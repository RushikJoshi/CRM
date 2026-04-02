const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationService");

/**
 * ── SECURE CHAT CONTROLLER ──────────────────────────────────────────────────
 * WhatsApp-style participants-only access with strict company/branch scoping.
 */

// 1. Get or Create Conversation
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        if (!targetUserId) return res.status(400).json({ success: false, message: "Recipient ID required." });

        const userId = req.user.id;
        const companyId = req.user.companyId;

        // Check if existing conversation exists between these two users in the SAME company
        let conversation = await Conversation.findOne({
            companyId,
            participants: { $all: [userId, targetUserId] }
        });

        if (!conversation) {
            // Target user validation
            const targetUser = await User.findById(targetUserId);
            if (!targetUser || String(targetUser.companyId) !== String(companyId)) {
                return res.status(404).json({ success: false, message: "Target user not found or cross-company access denied." });
            }

            conversation = await Conversation.create({
                participants: [userId, targetUserId],
                companyId,
                branchId: req.user.branchId || targetUser.branchId || null // Scoped to initiator's branch
            });
        }

        res.json({ success: true, data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Send Message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text, type = "text", fileUrl, encryptedAESKey, senderEncryptedKey, iv } = req.body;
        if (!conversationId || (!text && !fileUrl)) return res.status(400).json({ success: false, message: "Missing conversationId or content." });

        // SECURE CONTEXT VALIDATION: User must be a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId,
            participants: req.user.id
        });

        if (!conversation) return res.status(403).json({ success: false, message: "Unauthorized access to this conversation." });

        const receiverId = conversation.participants.find(p => String(p) !== String(req.user.id));

        const message = await Message.create({
            conversationId,
            senderId: req.user.id,
            receiverId,
            message: text,
            encryptedAESKey,
            senderEncryptedKey,
            iv,
            isEncrypted: !!encryptedAESKey,
            type,
            fileUrl
        });

        // Update Conversation Summary (store only non-sensitive preview or placeholder if encrypted)
        conversation.lastMessage = {
            text: !!encryptedAESKey ? "🔒 Encrypted Message" : (type === "file" ? "Sent a file" : text),
            senderId: req.user.id,
            createdAt: new Date()
        };
        await conversation.save();

        // Dispatch Notification to receiver
        await createNotification({
            userId: receiverId,
            companyId: conversation.companyId,
            branchId: conversation.branchId,
            title: "New Message",
            message: !!encryptedAESKey ? "You received a new encrypted message." : `${req.user.name}: ${text.substring(0, 50)}...`,
            type: "chat",
            req
        });

        // Real-time broadcast
        const io = req.app.get("io");
        if (io) {
            const socketPayload = { ...message.toObject() };
            
            // 1. Emit to the conversation room (for everyone currently viewing)
            io.to(`conversation:${conversationId}`).emit("message:new", socketPayload);
            
            // 2. Emit specifically to the receiver's user room (backup for notifications/updates)
            if (receiverId) {
                io.to(`user:${receiverId}`).emit("message:new", socketPayload);
                io.to(`user:${receiverId}`).emit("chat:update", { conversationId, message: socketPayload });
            }
            
            // 3. Emit for lead-specific updates if applicable
            if (conversation.leadId) {
                io.to(`lead:${conversation.leadId}`).emit("message:new", socketPayload);
            }
        }

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Get or Create Lead-bound Conversation
exports.getLeadConversation = async (req, res) => {
    try {
        const { leadId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.companyId;

        let conversation = await Conversation.findOne({ companyId, leadId })
            .populate("participants", "name email role publicKey");

        if (!conversation) {
            const Inquiry = require("../models/Inquiry");
            const lead = await Inquiry.findById(leadId);
            if (!lead || String(lead.companyId) !== String(companyId)) {
                return res.status(404).json({ success: false, message: "Lead not found." });
            }
            const participants = new Set([String(userId)]);
            if (lead.createdBy) participants.add(String(lead.createdBy));
            if (lead.assignedTo) participants.add(String(lead.assignedTo));

            conversation = await Conversation.create({
                participants: Array.from(participants),
                companyId,
                branchId: lead.branchId,
                leadId: lead._id
            });
            conversation = await conversation.populate("participants", "name email role publicKey");
        } else {
            // Auto-join if not a participant
            const isParticipant = conversation.participants.some(p => String(p._id) === String(userId));
            if (!isParticipant) {
                await Conversation.updateOne({ _id: conversation._id }, { $addToSet: { participants: userId } });
                conversation = await Conversation.findById(conversation._id).populate("participants", "name email role publicKey");
            }
        }

        res.json({ success: true, data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Conversations List
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            companyId: req.user.companyId,
            participants: req.user.id
        })
        .populate("participants", "name email role branchId publicKey")
        .sort({ updatedAt: -1 });

        res.json({ success: true, data: conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Get Conversation Messages
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // AUTH CHECK: Must be participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            companyId: req.user.companyId,
            participants: req.user.id
        });

        if (!conversation) return res.status(403).json({ success: false, message: "Unauthorized." });

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .limit(100);

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
