import express from "express";
import multer from "multer";
import path from "path";
import authMiddleware from "../middleware/auth.js";
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/chat/");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `chat-${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext || mime) return cb(null, true);
        cb(new Error("Loại file không được hỗ trợ"));
    },
});

const chatRouter = express.Router();

chatRouter.post("/send", authMiddleware, sendUserMessage);
chatRouter.get("/messages", authMiddleware, getMyMessages);
chatRouter.get("/unread", authMiddleware, getUnreadForUser);
chatRouter.post("/upload", authMiddleware, upload.single("file"), uploadFile);
chatRouter.get("/quick-replies", authMiddleware, getQuickReplies);
chatRouter.post("/mark-read", authMiddleware, markMessagesRead);

chatRouter.get("/admin/conversations", listConversations);
chatRouter.get("/admin/thread/:userId", getAdminThread);
chatRouter.post("/admin/reply", adminReply);
chatRouter.post("/admin/upload", upload.single("file"), uploadFile);
chatRouter.get("/admin/quick-replies", listQuickReplies);
chatRouter.post("/admin/quick-replies", createQuickReply);
chatRouter.put("/admin/quick-replies/:id", updateQuickReply);
chatRouter.delete("/admin/quick-replies/:id", deleteQuickReply);

export default chatRouter;
