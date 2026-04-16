import chatMessageModel from "../models/chatMessageModel.js";
import userModel from "../models/userModel.js";
import quickReplyModel from "../models/quickReplyModel.js";
import path from "path";
import fs from "fs";

const sendUserMessage = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const text = req.body.text != null ? String(req.body.text).trim() : "";
        if (!text) {
            return res.json({ success: false, message: "Nội dung trống" });
        }
        const msg = await chatMessageModel.create({
            userId,
            sender: "user",
            text: text.slice(0, 2000),
            readByUser: true,
            readByShop: false,
        });
        return res.json({ success: true, data: msg });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const getMyMessages = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        await chatMessageModel.updateMany(
            { userId, sender: "shop", readByUser: false },
            { readByUser: true }
        );
        const list = await chatMessageModel.find({ userId }).sort({ createdAt: 1 }).lean();
        return res.json({ success: true, data: list });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const getUnreadForUser = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const count = await chatMessageModel.countDocuments({
            userId,
            sender: "shop",
            readByUser: false,
        });
        return res.json({ success: true, count });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const listConversations = async (req, res) => {
    try {
        const userIds = await chatMessageModel.distinct("userId");
        const items = await Promise.all(
            userIds.map(async (uid) => {
                const lastMsg = await chatMessageModel
                    .findOne({ userId: uid })
                    .sort({ createdAt: -1 })
                    .lean();
                const unread = await chatMessageModel.countDocuments({
                    userId: uid,
                    sender: "user",
                    readByShop: false,
                });
                const user = await userModel.findById(uid).select("name email").lean();
                return {
                    userId: uid,
                    userName: user?.name || "Khách",
                    email: user?.email || "",
                    lastMessage: lastMsg,
                    unreadShop: unread,
                };
            })
        );
        items.sort(
            (a, b) =>
                new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
        );
        return res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const getAdminThread = async (req, res) => {
    try {
        const userId = String(req.params.userId);
        await chatMessageModel.updateMany(
            { userId, sender: "user", readByShop: false },
            { readByShop: true }
        );
        const list = await chatMessageModel.find({ userId }).sort({ createdAt: 1 }).lean();
        const user = await userModel.findById(userId).select("name email").lean();
        return res.json({
            success: true,
            data: list,
            user: user || { name: "Khách", email: "" },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const adminReply = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const text = req.body.text != null ? String(req.body.text).trim() : "";
        if (!userId || !text) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
        }
        const msg = await chatMessageModel.create({
            userId,
            sender: "shop",
            text: text.slice(0, 2000),
            readByUser: false,
            readByShop: true,
        });
        return res.json({ success: true, data: msg });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Không có file" });
        }
        const fileUrl = `${BASE_URL}/uploads/chat/${req.file.filename}`;
        return res.json({
            success: true,
            url: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype.startsWith("image/") ? "image" : "document",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const getQuickReplies = async (req, res) => {
    try {
        const items = await quickReplyModel
            .find({ isActive: true })
            .sort({ order: 1 })
            .lean();
        return res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const listQuickReplies = async (req, res) => {
    try {
        const items = await quickReplyModel.find().sort({ order: 1 }).lean();
        return res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const createQuickReply = async (req, res) => {
    try {
        const { text, isActive = true, order = 0 } = req.body;
        if (!text?.trim()) {
            return res.status(400).json({ success: false, message: "Nội dung trống" });
        }
        const item = await quickReplyModel.create({ text: text.trim(), isActive, order });
        return res.json({ success: true, data: item });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const updateQuickReply = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, isActive, order } = req.body;
        const update = {};
        if (text !== undefined) update.text = text.trim();
        if (isActive !== undefined) update.isActive = isActive;
        if (order !== undefined) update.order = order;
        const item = await quickReplyModel.findByIdAndUpdate(id, update, { new: true });
        if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy" });
        return res.json({ success: true, data: item });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const deleteQuickReply = async (req, res) => {
    try {
        const { id } = req.params;
        await quickReplyModel.findByIdAndDelete(id);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const markMessagesRead = async (req, res) => {
    try {
        const { userId, messageIds } = req.body;
        await chatMessageModel.updateMany(
            { userId, _id: { $in: messageIds }, sender: "user" },
            { isRead: true, readAt: new Date() }
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

export {
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
};
