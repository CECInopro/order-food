import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    sendUserMessage,
    getMyMessages,
    getUnreadForUser,
    listConversations,
    getAdminThread,
    adminReply,
} from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/send", authMiddleware, sendUserMessage);
chatRouter.get("/messages", authMiddleware, getMyMessages);
chatRouter.get("/unread", authMiddleware, getUnreadForUser);

chatRouter.get("/admin/conversations", listConversations);
chatRouter.get("/admin/thread/:userId", getAdminThread);
chatRouter.post("/admin/reply", adminReply);

export default chatRouter;
