const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.post("/", auth, checkCompanyAccess, taskController.createTask);
router.get("/", auth, checkCompanyAccess, taskController.getTasks);
router.patch("/:id", auth, checkCompanyAccess, taskController.updateTaskStatus);

module.exports = router;
