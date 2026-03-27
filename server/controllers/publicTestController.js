const Course = require("../models/Course");
const Question = require("../models/Question");
const TestSession = require("../models/TestSession");
const TestSubmission = require("../models/TestSubmission");
const ProctoringLog = require("../models/ProctoringLog");
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
    console.log("START TEST REQUEST:", { courseId, companyId });
    if (!courseId || !companyId) {
       console.error("Missing courseId or companyId");
       return res.status(400).json({ success: false, message: "Identify assessment first." });
    }

    const course = await Course.findById(courseId);
    console.log(`COURSE STATUS ${courseId}: ${course ? (course.isActive ? 'Active' : 'Inactive') : 'NOT FOUND'}`);
    if (!course || !course.isActive) {
       console.error(`Course ${courseId} is inactive or not found`);
       return res.status(404).json({ success: false, message: "Assessment inactive." });
    }

    // Generate UUID token
    const token = crypto.randomUUID();

    // Snapshot questions
    const pool = await Question.find({ courseId }).lean();
    const globalCount = await Question.countDocuments();
    console.log(`[Lifecycle] StartTest - Requested: ${courseId}, Pool size: ${pool.length}, Total Questions in DB: ${globalCount}`);
    
    if (pool.length === 0) {
       console.error(`ERROR: Assessment "${course.title}" has zero questions. (ID: ${courseId})`);
       return res.status(400).json({ 
         success: false, 
         message: "Course content is currently empty. Please add at least 1-10 questions for this assessment in the Admin Dashboard under Test Management." 
       });
    }

    // Filter, Shuffle, Limit 10 (or pool size if < 10), Shuffle options, Remove correctAnswers
    const snapshot = pool.sort(() => 0.5 - Math.random()).slice(0, 10).map(q => {
      const { correctAnswer, ...safe } = q;
      safe.options = [...q.options].sort(() => 0.5 - Math.random());
      return { ...safe, originalAnswer: correctAnswer }; 
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

    // Fetch proctoring summary
    const proctoring = await ProctoringLog.findOne({ token });

    res.json({ 
      success: true, 
      data: { 
        score, 
        totalMarks, 
        showResult: course?.showResult,
        proctoringScore: proctoring?.score || 100,
        violations: proctoring?.violations || null,
        proctoringStatus: proctoring?.status || "active"
      } 
    });
  } catch (error) { next(error); }
};

// ── Proctoring System ────────────────────────────────────────────────────────
exports.logProctoring = async (req, res, next) => {
  try {
    const { token, violations, proctoringStatus } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token required." });

    let log = await ProctoringLog.findOne({ token });
    if (!log) {
      log = new ProctoringLog({ token });
    }

    // Merge violations (always keep max count or incremental?)
    // User said: "Send data every 10–15 seconds: { testId, violations, timestamp }"
    // This implies violations are totals or current snapshots.
    // I'll assume they are totals from the frontend for simplicity.
    log.violations = {
      noFace: violations.noFace || 0,
      multipleFaces: violations.multipleFaces || 0,
      tabSwitch: violations.tabSwitch || 0,
      noise: violations.noise || 0,
      fullscreenExit: violations.fullscreenExit || 0
    };

    // Calculate score
    let score = 100;
    score -= (log.violations.noFace * 10);
    score -= (log.violations.multipleFaces * 30);
    score -= (log.violations.tabSwitch * 20);
    score -= (log.violations.noise * 10);
    score -= (log.violations.fullscreenExit * 15);

    log.score = Math.max(0, score);
    await log.save();

    res.json({ success: true, score: log.score });
  } catch (error) { next(error); }
};

exports.getProctoringDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    const log = await ProctoringLog.findOne({ token });
    if (!log) return res.status(404).json({ success: false, message: "Proctoring log not found." });
    res.json({ success: true, data: log });
  } catch (error) { next(error); }
};

// ── Inquiry-Based Capture ───────────────────────────────────────────────────
exports.submitLead = async (req, res, next) => {
  try {
    const { token, name, email, phone, location, proctoringStatus } = req.body;
    if (!token || !name || !email) return res.status(400).json({ success: false, message: "Identification required." });

    const submission = await TestSubmission.findOne({ token });
    if (!submission) return res.status(404).json({ success: false, message: "Assessment record not found." });

    const course = await Course.findById(submission.courseId);
    const Inquiry = require("../models/Inquiry");
    const Activity = require("../models/Activity");
    const inquiryCtrl = require("./inquiryController");

    const companyId = submission.companyId;
    const phoneStr = phone ? String(phone).trim() : "";
    const emailStr = String(email).trim().toLowerCase();
    const testScorePerc = Math.round((submission.score / (submission.totalMarks || 10)) * 100);

    // 1. DUPLICATE CHECK (24H)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // FETCH PROCTORING LOG
    const procLog = await ProctoringLog.findOne({ token });
    const pScore = procLog ? procLog.score : 100;
    const pRisk = pScore > 80 ? "Low" : pScore >= 50 ? "Medium" : "High";

    let inquiry = await Inquiry.findOne({
      companyId,
      $or: [{ email: emailStr }, { phone: phoneStr || "NONE" }],
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (inquiry) {
      // Update existing
      inquiry.name = name;
      inquiry.courseSelected = course?.title || inquiry.courseSelected;
      inquiry.testScore = testScorePerc;
      inquiry.proctoringScore = pScore;
      inquiry.proctoringRisk = pRisk;
      inquiry.testToken = token;
      inquiry.proctoringStatus = proctoringStatus || (procLog ? "active" : "unknown");
      inquiry.location = location || inquiry.location;
      inquiry.message = `Updated via Test Portal (Score: ${testScorePerc}%) [Proctoring: ${pScore} / ${pRisk}]`;
      await inquiry.save();
    } else {
      // Create new
      inquiry = await Inquiry.create({
        name,
        email: emailStr,
        phone: phoneStr,
        location: location || "",
        companyId,
        source: "test_portal",
        courseSelected: course?.title || "Unknown",
        testScore: testScorePerc,
        proctoringScore: pScore,
        proctoringRisk: pRisk,
        testToken: token,
        proctoringStatus: proctoringStatus || (procLog ? "active" : "unknown"),
        status: "new",
        message: `Captured via Test Portal Assessment (Result: ${submission.score}/${submission.totalMarks}) [Proctoring: ${pScore} / ${pRisk}]`
      });

      // Log activity
      await Activity.create({
        inquiryId: inquiry._id,
        companyId,
        type: "inquiry",
        note: "New inquiry created from test portal"
      });
    }

    // Notify admin/candidate (optional/legacy)
    sendResultEmail(emailStr, name, submission.score, submission.totalMarks || 10);

    // Final response
    res.json({ 
      success: true, 
      message: "Profile linked. Inquiry captured successfully.",
      inquiryId: inquiry._id
    });
  } catch (error) { next(error); }
};
