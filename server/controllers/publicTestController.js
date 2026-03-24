const Course = require("../models/Course");
const Question = require("../models/Question");
const TestSession = require("../models/TestSession");
const TestSubmission = require("../models/TestSubmission");
const LandingPage = require("../models/LandingPage");
const Lead = require("../models/Lead");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ── Email Notification System ───────────────────────────────────────────────
const sendResultEmail = async (email, name, score, totalMarks) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"EduPath CRM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Performance Report - EduPath",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Hello ${name}!</h2>
          <p>Well done on completing the assessment. Your score is <b>${score}/${totalMarks}</b>.</p>
          <p>Our academic counselors will be in touch shortly to discuss your learning path.</p>
          <hr/>
          <p>Sent via <a href="https://edupathpro.com">EduPath Exam Engine</a></p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("EMAIL NOTIFICATION FAIL:", error.message);
    return false;
  }
};

// ── Assessment Portal ────────────────────────────────────────────────────────
exports.getAssessmentBySlug = async (req, res, next) => {
  try {
    const { companyId, slug } = req.params;
    const page = await LandingPage.findOne({ companyId, slug, isActive: true })
                                  .populate("companyId", "name logo");
    if (!page) return res.status(404).json({ success: false, message: "Link expired or invalid." });
    
    // Fetch courses available for this company
    const courses = await Course.find({ companyId, isActive: true });
    
    res.json({ success: true, data: { page, courses } });
  } catch (error) { next(error); }
};

exports.getCoursesByCompany = async (req, res, next) => {
  try {
    const courses = await Course.find({ 
      companyId: req.params.companyId, 
      isActive: true 
    });
    res.json({ success: true, data: courses });
  } catch (error) { next(error); }
};

// ── Test Lifecycle ───────────────────────────────────────────────────────────
exports.startTest = async (req, res, next) => {
  try {
    const { courseId, companyId } = req.body;
    if (!courseId || !companyId) return res.status(400).json({ success: false, message: "Identify assessment first." });

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) return res.status(404).json({ success: false, message: "Assessment inactive." });

    // Generate UUID token
    const token = crypto.randomUUID();

    // Snapshot questions
    let pool = await Question.find({ courseId }).lean();
    if (pool.length === 0) return res.status(400).json({ success: false, message: "Queue empty." });

    // Filter, Shuffle, Limit 10, Shuffle options, Remove correctAnswers
    let snapshot = pool.sort(() => 0.5 - Math.random()).slice(0, 10).map(q => {
      const { correctAnswer, ...safe } = q;
      safe.options = [...q.options].sort(() => 0.5 - Math.random());
      return { ...safe, originalAnswer: correctAnswer }; // We keep originalAnswer in snapshot for calculation later
    });

    const session = await TestSession.create({
      token,
      companyId,
      courseId,
      questions: snapshot.map(q => {
        const { originalAnswer, ...frontendSafe } = q;
        return frontendSafe;
      }),
      _internal_questions: snapshot, // We use a secret field to keep answers
      expiresAt: new Date(Date.now() + course.duration * 60000)
    });

    res.json({ success: true, token, expiresAt: session.expiresAt });
  } catch (error) { next(error); }
};

exports.getTestByToken = async (req, res, next) => {
  try {
    const session = await TestSession.findOne({ token: req.params.token });
    if (!session || session.isSubmitted) return res.status(404).json({ success: false, message: "Invalid or consumed token." });
    if (new Date() > session.expiresAt) return res.status(400).json({ success: false, message: "Time expired." });

    res.json({
      success: true,
      data: {
        questions: session.questions,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) { next(error); }
};

exports.submitTest = async (req, res, next) => {
  try {
    const { token, answers } = req.body;
    const session = await TestSession.findOne({ token });
    if (!session || session.isSubmitted) return res.status(403).json({ success: false, message: "Submisson locked." });

    // Use snapshot with secret answers
    const pool = session._internal_questions; 
    let score = 0;
    let totalMarks = 0;
    
    const Details = pool.map(q => {
      const selected = answers[q._id];
      const isCorrect = selected === q.originalAnswer;
      if (isCorrect) score += q.marks;
      totalMarks += (q.marks || 1);
      return {
        questionId: q._id,
        selected: selected || "N/A",
        correct: q.originalAnswer,
        isCorrect
      };
    });

    const submission = await TestSubmission.create({
        token,
        courseId: session.courseId,
        companyId: session.companyId,
        questions: pool,
        answers: Details,
        score,
        totalMarks // Add to model for convenience
    });

    session.isSubmitted = true;
    await session.save();

    const course = await Course.findById(session.courseId);

    res.json({ 
      success: true, 
      data: { 
        score, 
        totalMarks, 
        showResult: course?.showResult 
      } 
    });
  } catch (error) { next(error); }
};

// ── Lead Generation ─────────────────────────────────────────────────────────
exports.submitLead = async (req, res, next) => {
  try {
    const { token, name, email, phone } = req.body;
    if (!token || !name || !email || !phone) return res.status(400).json({ success: false, message: "Verification required." });

    // Validate token exists in TestSubmission
    const submission = await TestSubmission.findOne({ token });
    if (!submission) return res.status(404).json({ success: false, message: "Link record not found." });

    // Prevent duplicate lead (email + course)
    const duplicate = await Lead.findOne({ email: email.toLowerCase(), companyId: submission.companyId, source: new RegExp(`Test Campaign`, 'i') });
    // Note: We check source to avoid blocking regular leads
    if (duplicate) return res.status(400).json({ success: false, message: "Duplicate record detected." });

    const course = await Course.findById(submission.courseId);

    // Round-robin
    const sales = await User.find({ companyId: submission.companyId, role: "sales", status: "active" }).sort({ lastAssignedAt: 1 });
    let assignedTo = null;
    if (sales.length > 0) {
      assignedTo = sales[0]._id;
      await User.findByIdAndUpdate(assignedTo, { lastAssignedAt: new Date() });
    }

    const companyAdmin = await User.findOne({ companyId: submission.companyId, role: "company_admin" });

    const lead = await Lead.create({
      name,
      email: email.toLowerCase(),
      phone,
      companyId: submission.companyId,
      source: `Test Campaign - ${course?.title || 'Unknown'}`,
      status: "New",
      assignedTo,
      notes: `Test Performance: ${submission.score}/${submission.totalMarks || 10}`,
      createdBy: assignedTo || companyAdmin?._id || submission.companyId
    });

    // ── Final Automation ────────────────────────────────
    const sendWhatsApp = require("../services/whatsappService");
    
    // Non-blocking notifications
    sendResultEmail(email, name, submission.score, submission.totalMarks || 10);
    sendWhatsApp({
      phone: lead.phone,
      name: lead.name,
      score: submission.score
    });

    res.json({ success: true, message: "Profile linked. Counselor will contact you." });
  } catch (error) { next(error); }
};
