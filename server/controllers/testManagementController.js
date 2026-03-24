const Course = require("../models/Course");
const Question = require("../models/Question");
const LandingPage = require("../models/LandingPage");

// ── Course Management ───────────────────────────────────────────────────────
exports.getAllCourses = async (req, res, next) => {
  try {
    const query = req.user.role === "super_admin" ? {} : { companyId: req.user.companyId };
    const courses = await Course.find(query).populate("companyId", "name");
    res.json({ success: true, data: courses });
  } catch (error) { next(error); }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    res.json({ success: true, data: course });
  } catch (error) { next(error); }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) { next(error); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: course });
  } catch (error) { next(error); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ courseId: req.params.id }); // Clean up
    res.json({ success: true, message: "Course and related questions deleted." });
  } catch (error) { next(error); }
};

// ── Question Management ─────────────────────────────────────────────────────
exports.getQuestionsByCourse = async (req, res, next) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId });
    res.json({ success: true, data: questions });
  } catch (error) { next(error); }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) { next(error); }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: question });
  } catch (error) { next(error); }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Question deleted." });
  } catch (error) { next(error); }
};

// ── Landing Page Management ──────────────────────────────────────────────────
exports.getLandingPages = async (req, res, next) => {
  try {
    const query = req.user.role === "super_admin" ? {} : { companyId: req.user.companyId };
    const pages = await LandingPage.find(query).populate("companyId", "name");
    res.json({ success: true, data: pages });
  } catch (error) { next(error); }
};

exports.getLandingPageById = async (req, res, next) => {
  try {
    const page = await LandingPage.findById(req.params.id);
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

exports.createLandingPage = async (req, res, next) => {
  try {
    const page = await LandingPage.create(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (error) { next(error); }
};

exports.updateLandingPage = async (req, res, next) => {
  try {
    const page = await LandingPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
};

exports.deleteLandingPage = async (req, res, next) => {
  try {
    await LandingPage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Landing page deleted." });
  } catch (error) { next(error); }
};
