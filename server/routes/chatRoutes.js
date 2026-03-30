const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
    getOrCreateConversation, 
    sendMessage, 
    getConversations, 
    getMessages,
    getLeadConversation
} = require("../controllers/chatController");

router.get("/conversations", auth, getConversations);
router.post("/conversations", auth, getOrCreateConversation);
router.get("/lead/:leadId", auth, getLeadConversation);
router.get("/:conversationId/messages", auth, getMessages);
router.post("/messages", auth, sendMessage);

module.exports = router;
