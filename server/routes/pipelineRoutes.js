const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const {
  getPipelines,
  getPipelineStages,
  createPipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} = require("../controllers/pipelineController");

router.get("/", auth, checkCompanyAccess, getPipelines);
router.get("/:pipelineId/stages", auth, checkCompanyAccess, getPipelineStages);
router.post("/", auth, checkCompanyAccess, createPipeline);
router.post("/stages", auth, checkCompanyAccess, createStage);
router.patch("/stages/:stageId", auth, checkCompanyAccess, updateStage);
router.delete("/stages/:stageId", auth, checkCompanyAccess, deleteStage);
router.post("/stages/reorder", auth, checkCompanyAccess, reorderStages);

module.exports = router;
