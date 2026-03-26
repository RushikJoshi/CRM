const express = require("express");
const router = express.Router();
const publicTestController = require("../controllers/publicTestController");
const testManagementController = require("../controllers/testManagementController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// PUBLIC ROUTES (No Auth Required)
router.get("/public/assessment/:companyId/:slug", publicTestController.getAssessmentBySlug);
router.get("/public/courses/:companyId", publicTestController.getCoursesByCompany);
router.post("/public/start-test", publicTestController.startTest);
router.get("/public/test/:token", publicTestController.getTestByToken);
router.post("/public/submit-test", publicTestController.submitTest);
router.post("/public/submit-lead", publicTestController.submitLead);
router.post("/public/inquiry/create", publicTestController.submitLead); // Unified inquiry capture

// ADMIN/SUPERADMIN ROUTES (Auth Required)
router.use(auth);
router.use(requireRole("super_admin", "company_admin"));

// Landing Page Management
router.get("/management/landing", testManagementController.getLandingPages);
router.get("/management/landing/:id", testManagementController.getLandingPageById);
router.post("/management/landing", testManagementController.createLandingPage);
router.put("/management/landing/:id", testManagementController.updateLandingPage);
router.delete("/management/landing/:id", testManagementController.deleteLandingPage);

// Course Management
router.get("/management/courses", testManagementController.getAllCourses);
router.get("/management/courses/:id", testManagementController.getCourseById);
router.post("/management/courses", testManagementController.createCourse);
router.put("/management/courses/:id", testManagementController.updateCourse);
router.delete("/management/courses/:id", testManagementController.deleteCourse);

// Question Management
router.get("/management/questions/:courseId", testManagementController.getQuestionsByCourse);
router.post("/management/questions", testManagementController.addQuestion);
router.put("/management/questions/:id", testManagementController.updateQuestion);
router.delete("/management/questions/:id", testManagementController.deleteQuestion);

module.exports = router;
