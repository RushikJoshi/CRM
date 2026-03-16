const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { getPipelines, getPipelineStages, createPipeline, createStage } = require("../controllers/pipelineController");

router.get("/", auth, checkCompanyAccess, getPipelines);
router.get("/:pipelineId/stages", auth, checkCompanyAccess, getPipelineStages);
router.post("/", auth, checkCompanyAccess, createPipeline);
router.post("/stages", auth, checkCompanyAccess, createStage);

module.exports = router;
