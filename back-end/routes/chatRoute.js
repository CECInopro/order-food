import express from "express";
import authMiddleware from "../middleware/auth.js";
import { uploadChat } from "../config/cloudinary.js";
import {
    sendUserMessage,
    getMyMessages,
    getUnreadForUser,
    listConversations,
    getAdminThread,
    adminReply,
    uploadFile,
    getQuickReplies,
    listQuickReplies,
    createQuickReply,
    updateQuickReply,
    deleteQuickReply,
    markMessagesRead,
} from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/send", authMiddleware, sendUserMessage);
chatRouter.get("/messages", authMiddleware, getMyMessages);
chatRouter.get("/unread", authMiddleware, getUnreadForUser);
chatRouter.post("/upload", authMiddleware, uploadChat.single("file"), uploadFile);
chatRouter.get("/quick-replies", authMiddleware, getQuickReplies);
chatRouter.post("/mark-read", authMiddleware, markMessagesRead);

chatRouter.get("/admin/conversations", listConversations);
chatRouter.get("/admin/thread/:userId", getAdminThread);
chatRouter.post("/admin/reply", adminReply);
chatRouter.post("/admin/upload", uploadChat.single("file"), uploadFile);
chatRouter.get("/admin/quick-replies", listQuickReplies);
chatRouter.post("/admin/quick-replies", createQuickReply);
chatRouter.put("/admin/quick-replies/:id", updateQuickReply);
chatRouter.delete("/admin/quick-replies/:id", deleteQuickReply);

export default chatRouter;
