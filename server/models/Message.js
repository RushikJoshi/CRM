const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: { // Optional for easier one-on-one lookup but primary logic is via conversationId
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        message: {
            type: String,
            required: true
        },
        encryptedAESKey: {
            type: String, // Encrypted with receiver's publicKey
            default: null
        },
        senderEncryptedKey: {
            type: String, // Sender's encrypted version (for history decoding)
            default: null
        },
        iv: {
            type: String, // Initialization vector for AES
            default: null
        },
        isEncrypted: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: ["text", "file"],
            default: "text"
        },
        fileUrl: {
            type: String,
            default: null
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
