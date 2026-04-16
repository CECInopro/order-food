# chatBundle Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp chatBundle với tính năng gửi file/ảnh và cải thiện UI/UX (typing indicator, seen receipts, smart timestamps, emoji picker, quick replies)

**Architecture:** Backend sử dụng MongoDB với Multer cho upload file, Socket.io cho real-time events. Frontend sử dụng emoji-picker-react cho emoji picker.

**Tech Stack:** Node.js, Express, MongoDB, Socket.io, Multer, React, emoji-picker-react

---

## File Structure

```
back-end/
├── models/
│   ├── chatMessageModel.js     # Modify: add file fields, isRead
│   └── quickReplyModel.js      # Create
├── controllers/
│   └── chatController.js       # Modify: add upload, quickReply CRUD
├── routes/
│   └── chatRoute.js            # Modify: add new routes
├── socket/
│   └── chatSocket.js           # Modify: add typing, seen events
└── uploads/chat/              # Create: file storage

front-end/
├── src/component/ChatBubble/
│   ├── ChatBubble.jsx          # Modify: add all features
│   └── ChatBubble.css          # Modify: add new styles

admin/src/pages/Chat/
├── Chat.jsx                   # Modify: add typing, seen, quickReply
├── Chat.css                   # Modify: add new styles
└── QuickReplyModal.jsx       # Create
```

---

## Task 1: Update chatMessageModel - Add file fields and isRead

**Files:**
- Modify: `back-end/models/chatMessageModel.js`

**Steps:**

- [ ] **Step 1: Read current model**

Read `back-end/models/chatMessageModel.js`

- [ ] **Step 2: Update schema with new fields**

```javascript
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        sender: { type: String, enum: ["user", "shop"], required: true },
        text: { type: String, required: true, maxlength: 2000 },
        // File fields (NEW)
        fileUrl: { type: String, default: null },
        fileType: { type: String, enum: ["image", "document", null], default: null },
        fileName: { type: String, default: null },
        fileSize: { type: Number, default: null },
        // Read status (UNIFIED)
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

const chatMessageModel =
    mongoose.models.chatMessage || mongoose.model("chatMessage", chatMessageSchema);

export default chatMessageModel;
```

- [ ] **Step 3: Commit**

```bash
git add back-end/models/chatMessageModel.js
git commit -m "feat(chat): add file fields and isRead to chatMessageModel"
```

---

## Task 2: Create quickReplyModel

**Files:**
- Create: `back-end/models/quickReplyModel.js`

**Steps:**

- [ ] **Step 1: Create model file**

```javascript
import mongoose from "mongoose";

const quickReplySchema = new mongoose.Schema(
    {
        text: { type: String, required: true, maxlength: 500 },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const quickReplyModel =
    mongoose.models.quickReply || mongoose.model("quickReply", quickReplySchema);

export default quickReplyModel;
```

- [ ] **Step 2: Create seed data script (optional)**

Create `back-end/scripts/seedQuickReplies.js` with default quick replies:
```javascript
import quickReplyModel from "../models/quickReplyModel.js";

const defaults = [
    { text: "Xin chào! Cảm ơn đã liên hệ", order: 1 },
    { text: "Đơn hàng của bạn đang được xử lý", order: 2 },
    { text: "Cảm ơn bạn đã đặt hàng!", order: 3 },
    { text: "Chúng tôi sẽ giao hàng trong 30-45 phút", order: 4 },
];

async function seed() {
    const count = await quickReplyModel.countDocuments();
    if (count === 0) {
        await quickReplyModel.insertMany(defaults);
        console.log("Quick replies seeded");
    }
}

seed();
```

- [ ] **Step 3: Commit**

```bash
git add back-end/models/quickReplyModel.js back-end/scripts/seedQuickReplies.js
git commit -m "feat(chat): add quickReplyModel with seed data"
```

---

## Task 3: Update chatController - Add upload and quickReply CRUD

**Files:**
- Modify: `back-end/controllers/chatController.js`

**Steps:**

- [ ] **Step 1: Read current controller**

Read `back-end/controllers/chatController.js`

- [ ] **Step 2: Add new imports and upload controller**

Add at top:
```javascript
import path from "path";
import fs from "fs";
```

Add after existing functions:
```javascript
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
```

- [ ] **Step 3: Update exports**

Add new exports:
```javascript
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
```

- [ ] **Step 4: Commit**

```bash
git add back-end/controllers/chatController.js
git commit -m "feat(chat): add upload and quickReply CRUD to chatController"
```

---

## Task 4: Update chatRoute - Add new routes

**Files:**
- Modify: `back-end/routes/chatRoute.js`

**Steps:**

- [ ] **Step 1: Read current routes**

Read `back-end/routes/chatRoute.js`

- [ ] **Step 2: Update imports**

```javascript
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
```

- [ ] **Step 3: Configure multer**

Add before routes:
```javascript
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext || mime) return cb(null, true);
        cb(new Error("Loại file không được hỗ trợ"));
    },
});
```

- [ ] **Step 4: Update routes**

```javascript
const chatRouter = express.Router();

// User routes (require auth)
chatRouter.post("/send", authMiddleware, sendUserMessage);
chatRouter.get("/messages", authMiddleware, getMyMessages);
chatRouter.get("/unread", authMiddleware, getUnreadForUser);
chatRouter.post("/upload", authMiddleware, upload.single("file"), uploadFile);
chatRouter.get("/quick-replies", authMiddleware, getQuickReplies);
chatRouter.post("/mark-read", authMiddleware, markMessagesRead);

// Admin routes
chatRouter.get("/admin/conversations", listConversations);
chatRouter.get("/admin/thread/:userId", getAdminThread);
chatRouter.post("/admin/reply", adminReply);
chatRouter.post("/admin/upload", upload.single("file"), uploadFile);
chatRouter.get("/admin/quick-replies", listQuickReplies);
chatRouter.post("/admin/quick-replies", createQuickReply);
chatRouter.put("/admin/quick-replies/:id", updateQuickReply);
chatRouter.delete("/admin/quick-replies/:id", deleteQuickReply);

export default chatRouter;
```

- [ ] **Step 5: Ensure upload directory exists**

Add to main server file or create startup script:
```javascript
import fs from "fs";
const chatDir = "uploads/chat";
if (!fs.existsSync(chatDir)) {
    fs.mkdirSync(chatDir, { recursive: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add back-end/routes/chatRoute.js
git commit -m "feat(chat): add upload and quickReply routes"
```

---

## Task 5: Update chatSocket - Add typing and seen events

**Files:**
- Modify: `back-end/socket/chatSocket.js`

**Steps:**

- [ ] **Step 1: Read current socket**

Read `back-end/socket/chatSocket.js`

- [ ] **Step 2: Add typing and seen handlers**

Add after `socket.on("chat:admin_reply", ...)`:

```javascript
socket.on("chat:typing", (payload) => {
    const { isTyping } = payload || {};
    if (socket.isAdmin) {
        socket.broadcast.emit("chat:typing", { userId: socket.userId, isTyping });
    } else {
        io.to("admin").emit("chat:typing", { userId: socket.userId, isTyping });
    }
});

socket.on("chat:seen", async (payload) => {
    if (socket.isAdmin) return;
    try {
        const { messageIds } = payload || {};
        if (Array.isArray(messageIds) && messageIds.length > 0) {
            await chatMessageModel.updateMany(
                { _id: { $in: messageIds }, sender: "user" },
                { isRead: true, readAt: new Date() }
            );
            io.to("admin").emit("chat:seen", { userId: socket.userId, messageIds });
        }
    } catch (err) {
        console.error(err);
    }
});

socket.on("chat:admin_read", async (payload) => {
    if (!socket.isAdmin) return;
    try {
        const { userId } = payload || {};
        if (!userId) return;
        await chatMessageModel.updateMany(
            { userId, sender: "user", isRead: false },
            { isRead: true, readAt: new Date() }
        );
        io.to(`user:${userId}`).emit("chat:read_all", { userId });
    } catch (err) {
        console.error(err);
    }
});
```

- [ ] **Step 3: Update message events to include file data**

Update `chat:send` and `chat:admin_reply` to include file fields in message creation.

- [ ] **Step 4: Commit**

```bash
git add back-end/socket/chatSocket.js
git commit -m "feat(chat): add typing, seen, admin_read socket events"
```

---

## Task 6: Install emoji-picker-react

**Steps:**

- [ ] **Step 1: Install package**

```bash
cd front-end && npm install emoji-picker-react
```

- [ ] **Step 2: Commit**

```bash
git add front-end/package.json front-end/package-lock.json
git commit -m "chore(chat): install emoji-picker-react"
```

---

## Task 7: Update ChatBubble (Frontend User) - Complete UI overhaul

**Files:**
- Modify: `front-end/src/component/ChatBubble/ChatBubble.jsx`
- Modify: `front-end/src/component/ChatBubble/ChatBubble.css`

**Steps:**

- [ ] **Step 1: Read current ChatBubble**

Read `front-end/src/component/ChatBubble/ChatBubble.jsx`

- [ ] **Step 2: Rewrite ChatBubble.jsx**

```javascript
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./ChatBubble.css";
import { StoreContext } from "../../contexts/StoreContext";
import axios from "axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const socketBase = (apiUrl) => String(apiUrl || "").replace(/\/$/, "");
const MAX_BASE64_SIZE = 512 * 1024; // 500KB

const ChatBubble = ({ setShowLogin }) => {
    const { url, token } = useContext(StoreContext);
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);
    const [showEmoji, setShowEmoji] = useState(false);
    const [quickReplies, setQuickReplies] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [shopTyping, setShopTyping] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const listEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    const scrollToBottom = () => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    };

    const fetchMessages = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${url}/api/chat/messages`, { headers: { token } });
            if (res.data.success) setMessages(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, [url, token]);

    const fetchUnread = useCallback(async () => {
        if (!token) {
            setUnread(0);
            return;
        }
        try {
            const res = await axios.get(`${url}/api/chat/unread`, { headers: { token } });
            if (res.data.success) setUnread(res.data.count || 0);
        } catch (e) {
            console.error(e);
        }
    }, [url, token]);

    const fetchQuickReplies = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${url}/api/chat/quick-replies`, { headers: { token } });
            if (res.data.success) setQuickReplies(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, [url, token]);

    useEffect(() => {
        if (!open || !token) return;
        fetchMessages();
        fetchQuickReplies();
    }, [open, token, fetchMessages, fetchQuickReplies]);

    useEffect(() => {
        if (open) scrollToBottom();
    }, [messages, open]);

    useEffect(() => {
        if (open) {
            fetchUnread();
        }
    }, [open, fetchUnread]);

    useEffect(() => {
        if (!token) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socket = io(socketBase(url), {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("chat:new_message", async ({ message }) => {
            if (!message) return;
            setMessages((prev) => {
                if (prev.some((m) => m._id === message._id)) return prev;
                return [...prev, message];
            });
            if (message.sender !== "shop") return;

            if (!openRef.current) {
                setUnread((u) => u + 1);
                return;
            }
            try {
                const ur = await axios.get(`${url}/api/chat/unread`, { headers: { token } });
                if (ur.data.success) setUnread(ur.data.count || 0);
            } catch (e) {
                console.error(e);
            }
        });

        socket.on("chat:typing", ({ userId, isTyping }) => {
            setShopTyping(isTyping);
        });

        socket.on("chat:read_all", () => {
            setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
        });

        socket.on("connect_error", (err) => {
            console.warn("Chat socket:", err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [url, token]);

    useEffect(() => {
        if (!token) {
            setUnread(0);
            return;
        }
        fetchUnread();
    }, [token, fetchUnread]);

    const emitTyping = (isTyping) => {
        const sock = socketRef.current;
        if (!sock || !sock.connected) return;
        sock.emit("chat:typing", { isTyping });
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        emitTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
    };

    const handleEmojiClick = (emojiData) => {
        setInput((prev) => prev + emojiData.emoji);
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        if (file.size <= MAX_BASE64_SIZE && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPreviewFile({
                    type: "image",
                    data: ev.target.result,
                    name: file.name,
                    size: file.size,
                });
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewFile({
                type: "uploading",
                name: file.name,
                size: file.size,
                file,
            });
        }
    };

    const sendFileViaServer = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post(`${url}/api/chat/upload`, formData, {
            headers: { token, "Content-Type": "multipart/form-data" },
        });
        return res.data;
    };

    const sendMessage = (textToSend, fileData = null) => {
        const text = (textToSend || input).trim();
        const sock = socketRef.current;
        if ((!text && !fileData) || !token || sending) return;
        if (!sock || !sock.connected) {
            alert("Đang kết nối chat, thử lại sau vài giây");
            return;
        }

        setSending(true);
        const payload = { text };
        if (fileData) {
            if (fileData.type === "image" && fileData.data) {
                payload.fileData = fileData.data;
                payload.fileType = "image";
                payload.fileName = fileData.name;
            } else {
                payload.fileName = fileData.name;
                payload.fileSize = fileData.size;
            }
        }

        sock.emit("chat:send", payload, async (res) => {
            setSending(false);
            if (res?.success) {
                setInput("");
                setPreviewFile(null);
                if (fileData?.type === "uploading") {
                    await sendFileViaServer(fileData.file);
                }
            } else {
                alert(res?.message || "Gửi thất bại");
            }
        });
    };

    const send = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const sendQuickReply = (text) => {
        sendMessage(text);
    };

    const toggle = () => {
        setOpen((o) => !o);
        if (!open) {
            fetchMessages();
            setShowEmoji(false);
        }
    };

    const showBadge = !open && unread > 0;

    return (
        <div className="chat-bubble-root">
            {open && (
                <div className="chat-panel" role="dialog" aria-label="Chat với cửa hàng">
                    <div className="chat-panel-header">
                        <span>Chat cửa hàng · Live</span>
                        <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Đóng">
                            ×
                        </button>
                    </div>
                    {quickReplies.length > 0 && (
                        <div className="chat-quick-replies">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr._id}
                                    type="button"
                                    className="chat-quick-reply-chip"
                                    onClick={() => sendQuickReply(qr.text)}
                                >
                                    {qr.text}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="chat-panel-body">
                        {!token ? (
                            <div className="chat-guest">
                                <p>Vui lòng đăng nhập để chat với shop.</p>
                                <button
                                    type="button"
                                    className="chat-login-btn"
                                    onClick={() => {
                                        setOpen(false);
                                        setShowLogin(true);
                                    }}
                                >
                                    Đăng nhập
                                </button>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="chat-empty">Xin chào! Bạn cần hỗ trợ gì ạ?</p>
                        ) : (
                            <ul className="chat-messages">
                                {messages.map((m) => (
                                    <li
                                        key={m._id}
                                        className={`chat-msg ${m.sender === "user" ? "chat-msg-user" : "chat-msg-shop"}`}
                                    >
                                        {m.fileUrl && m.fileType === "image" && (
                                            <img
                                                src={m.fileUrl}
                                                alt="attachment"
                                                className="chat-msg-image"
                                                onClick={() => window.open(m.fileUrl, "_blank")}
                                            />
                                        )}
                                        {m.fileUrl && m.fileType === "document" && (
                                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="chat-msg-file">
                                                📄 {m.fileName || "File"} ({(m.fileSize / 1024).toFixed(1)} KB)
                                            </a>
                                        )}
                                        {m.text && <span className="chat-msg-text">{m.text}</span>}
                                        <span className="chat-msg-meta">
                                            <span className="chat-msg-time">{formatTime(m.createdAt)}</span>
                                            {m.sender === "user" && (
                                                <span className={`chat-msg-status ${m.isRead ? "read" : "sent"}`}>
                                                    {m.isRead ? "✓✓" : "✓"}
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                                <div ref={listEndRef} />
                            </ul>
                        )}
                        {shopTyping && (
                            <div className="chat-typing">
                                <span className="chat-typing-dot" />
                                <span className="chat-typing-dot" />
                                <span className="chat-typing-dot" />
                                <span className="chat-typing-text">Shop đang nhập tin nhắn...</span>
                            </div>
                        )}
                    </div>
                    {previewFile && (
                        <div className="chat-preview">
                            {previewFile.type === "image" ? (
                                <div className="chat-preview-image">
                                    <img src={previewFile.data} alt="preview" />
                                    <button type="button" className="chat-preview-remove" onClick={() => setPreviewFile(null)}>×</button>
                                </div>
                            ) : (
                                <div className="chat-preview-file">
                                    📄 {previewFile.name}
                                    <button type="button" className="chat-preview-remove" onClick={() => setPreviewFile(null)}>×</button>
                                </div>
                            )}
                        </div>
                    )}
                    {token && (
                        <form className="chat-panel-footer" onSubmit={send}>
                            <div className="chat-footer-left">
                                <label className="chat-attach-btn" htmlFor="chat-file-input">
                                    📎
                                </label>
                                <input
                                    type="file"
                                    id="chat-file-input"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                    onChange={handleFileSelect}
                                    style={{ display: "none" }}
                                />
                                <button type="button" className="chat-emoji-btn" onClick={() => setShowEmoji((v) => !v)}>
                                    😊
                                </button>
                            </div>
                            {showEmoji && (
                                <div className="chat-emoji-picker">
                                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Nhập tin nhắn..."
                                maxLength={2000}
                                disabled={sending}
                            />
                            <button type="submit" disabled={sending || (!input.trim() && !previewFile)}>
                                Gửi
                            </button>
                        </form>
                    )}
                </div>
            )}
            <button
                type="button"
                className="chat-fab"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Mở chat"
            >
                {showBadge && <span className="chat-fab-badge">{unread > 9 ? "9+" : unread}</span>}
                <span className="chat-fab-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                </span>
            </button>
        </div>
    );
};

export default ChatBubble;
```

- [ ] **Step 3: Update CSS**

```css
.chat-bubble-root {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
}

.chat-fab {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: tomato;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(255, 99, 71, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.chat-fab:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 22px rgba(255, 99, 71, 0.55);
}

.chat-fab-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 10px;
    background: #c62828;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 20px;
    text-align: center;
}

.chat-fab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-panel {
    position: absolute;
    right: 0;
    bottom: 72px;
    width: min(100vw - 32px, 380px);
    height: min(80vh, 520px);
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #eee;
}

.chat-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: linear-gradient(135deg, tomato 0%, #ff8c69 100%);
    color: #fff;
    font-weight: 600;
}

.chat-close {
    background: rgba(255, 255, 255, 0.25);
    border: none;
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
}

.chat-close:hover {
    background: rgba(255, 255, 255, 0.4);
}

.chat-quick-replies {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    overflow-x: auto;
    background: #fafafa;
    border-bottom: 1px solid #eee;
}

.chat-quick-replies::-webkit-scrollbar {
    height: 4px;
}

.chat-quick-replies::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
}

.chat-quick-reply-chip {
    flex-shrink: 0;
    padding: 6px 12px;
    border: 1px solid tomato;
    border-radius: 16px;
    background: #fff;
    color: tomato;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.chat-quick-reply-chip:hover {
    background: tomato;
    color: #fff;
}

.chat-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    background: #f8f8f8;
}

.chat-guest {
    text-align: center;
    padding: 24px 12px;
    color: #555;
}

.chat-login-btn {
    margin-top: 12px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: tomato;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}

.chat-empty {
    text-align: center;
    color: #888;
    font-size: 14px;
    margin-top: 40px;
}

.chat-messages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chat-msg {
    max-width: 85%;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.chat-msg-user {
    align-self: flex-end;
    align-items: flex-end;
}

.chat-msg-shop {
    align-self: flex-start;
    align-items: flex-start;
}

.chat-msg-image {
    max-width: 200px;
    max-height: 150px;
    border-radius: 12px;
    cursor: pointer;
    object-fit: cover;
}

.chat-msg-file {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    font-size: 13px;
    color: #333;
    text-decoration: none;
}

.chat-msg-text {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;
}

.chat-msg-user .chat-msg-text {
    background: tomato;
    color: #fff;
    border-bottom-right-radius: 4px;
}

.chat-msg-shop .chat-msg-text {
    background: #fff;
    color: #333;
    border: 1px solid #e8e8e8;
    border-bottom-left-radius: 4px;
}

.chat-msg-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #999;
    padding: 0 4px;
}

.chat-msg-status {
    font-size: 12px;
}

.chat-msg-status.sent {
    color: #aaa;
}

.chat-msg-status.read {
    color: #4fc3f7;
}

.chat-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 0;
}

.chat-typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #999;
    animation: typing-bounce 1.4s infinite ease-in-out;
}

.chat-typing-dot:nth-child(1) { animation-delay: 0s; }
.chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
}

.chat-typing-text {
    font-size: 12px;
    color: #888;
    margin-left: 4px;
}

.chat-preview {
    padding: 8px 12px;
    border-top: 1px solid #eee;
    background: #fff;
}

.chat-preview-image {
    position: relative;
    display: inline-block;
}

.chat-preview-image img {
    max-width: 120px;
    max-height: 80px;
    border-radius: 8px;
    object-fit: cover;
}

.chat-preview-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: #c62828;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-preview-file {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

.chat-panel-footer {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #eee;
    background: #fff;
    position: relative;
}

.chat-footer-left {
    display: flex;
    align-items: center;
    gap: 4px;
}

.chat-attach-btn,
.chat-emoji-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.chat-attach-btn:hover,
.chat-emoji-btn:hover {
    background: #f0f0f0;
}

.chat-emoji-picker {
    position: absolute;
    bottom: 60px;
    left: 12px;
    z-index: 100;
}

.chat-panel-footer input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 14px;
}

.chat-panel-footer button[type="submit"] {
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: tomato;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}

.chat-panel-footer button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 480px) {
    .chat-bubble-root {
        right: 12px;
        bottom: 12px;
    }

    .chat-panel {
        bottom: 68px;
        width: calc(100vw - 24px);
        right: -12px;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add front-end/src/component/ChatBubble/ChatBubble.jsx front-end/src/component/ChatBubble/ChatBubble.css
git commit -m "feat(chat): complete ChatBubble UI overhaul with file upload, emoji, typing, seen"
```

---

## Task 8: Update Admin Chat Panel

**Files:**
- Modify: `admin/src/pages/Chat/Chat.jsx`
- Modify: `admin/src/pages/Chat/Chat.css`
- Create: `admin/src/pages/Chat/QuickReplyModal.jsx`

**Steps:**

- [ ] **Step 1: Read current Admin Chat**

Read `admin/src/pages/Chat/Chat.jsx`

- [ ] **Step 2: Rewrite Admin Chat.jsx**

```javascript
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Chat.css";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import QuickReplyModal from "./QuickReplyModal";

const socketBase = (apiUrl) => String(apiUrl || "").replace(/\/$/, "");

const ADMIN_SOCKET_KEY = import.meta.env.VITE_CHAT_ADMIN_KEY || "orderfood-admin-socket-dev";

const Chat = ({ url }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const selectedIdRef = useRef(null);
    const [thread, setThread] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
    const [quickReplies, setQuickReplies] = useState([]);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const audioRef = useRef(null);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const loadConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${url}/api/chat/admin/conversations`);
            if (res.data.success) setConversations(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, [url]);

    const loadThread = useCallback(async (userId) => {
        if (!userId) return;
        try {
            const res = await axios.get(`${url}/api/chat/admin/thread/${userId}`);
            if (res.data.success) {
                setThread(res.data.data || []);
                setCustomer(res.data.user || null);
                if (socketRef.current?.connected) {
                    socketRef.current.emit("chat:admin_read", { userId });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, [url]);

    const loadQuickReplies = useCallback(async () => {
        try {
            const res = await axios.get(`${url}/api/chat/admin/quick-replies`);
            if (res.data.success) setQuickReplies(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, [url]);

    useEffect(() => {
        loadConversations();
        loadQuickReplies();
    }, [loadConversations, loadQuickReplies]);

    useEffect(() => {
        const socket = io(socketBase(url), {
            auth: { adminKey: ADMIN_SOCKET_KEY },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("chat:new_message", (payload) => {
            const { message, userId } = payload || {};
            if (!message) return;
            loadConversations();
            if (soundEnabled && message.sender === "user") {
                audioRef.current?.play().catch(() => {});
            }
            const threadUser = userId != null ? String(userId) : String(message.userId || "");
            const sel = selectedIdRef.current ? String(selectedIdRef.current) : null;
            if (sel && threadUser === sel) {
                setThread((prev) => {
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        });

        socket.on("chat:typing", ({ userId, isTyping }) => {
            setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
        });

        socket.on("chat:seen", ({ userId, messageIds }) => {
            if (selectedIdRef.current === userId) {
                setThread((prev) =>
                    prev.map((m) =>
                        messageIds.includes(m._id) ? { ...m, isRead: true } : m
                    )
                );
            }
        });

        socket.on("connect_error", (err) => {
            console.warn("Admin chat socket:", err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [url, loadConversations, soundEnabled]);

    useEffect(() => {
        if (!selectedId) return;
        loadThread(selectedId);
    }, [selectedId, loadThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread]);

    const sendReply = (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (!text || !selectedId || sending) return;

        const sock = socketRef.current;
        if (!sock || !sock.connected) {
            toast.error("Socket chưa sẵn sàng");
            return;
        }

        setSending(true);
        sock.emit("chat:admin_reply", { userId: selectedId, text }, (res) => {
            setSending(false);
            if (res?.success) {
                setReply("");
                loadConversations();
            } else {
                toast.error(res?.message || "Không gửi được");
            }
        });
    };

    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    };

    return (
        <div className="admin-chat">
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />
            <div className="admin-chat-sidebar">
                <div className="admin-chat-sidebar-header">
                    <h2>Hội thoại · Live</h2>
                    <button
                        type="button"
                        className="admin-chat-settings-btn"
                        onClick={() => setShowQuickReplyModal(true)}
                        title="Quản lý Quick Replies"
                    >
                        ⚙️
                    </button>
                </div>
                <div className="admin-chat-list">
                    {conversations.length === 0 ? (
                        <p className="admin-chat-empty">Chưa có tin nhắn</p>
                    ) : (
                        conversations.map((c) => (
                            <button
                                key={c.userId}
                                type="button"
                                className={`admin-chat-item ${selectedId === c.userId ? "active" : ""}`}
                                onClick={() => setSelectedId(c.userId)}
                            >
                                <div className="admin-chat-item-avatar">
                                    {c.userName?.charAt(0)?.toUpperCase() || "?"}
                                    {typingUsers[c.userId] && <span className="typing-indicator" />}
                                </div>
                                <div className="admin-chat-item-content">
                                    <span className="admin-chat-item-name">{c.userName}</span>
                                    <span className="admin-chat-item-preview">{c.lastMessage?.text || "📎 File"}</span>
                                </div>
                                {c.unreadShop > 0 && (
                                    <span className="admin-chat-item-badge">{c.unreadShop}</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
            <div className="admin-chat-main">
                {!selectedId ? (
                    <p className="admin-chat-placeholder">Chọn một khách để trả lời</p>
                ) : (
                    <>
                        <div className="admin-chat-thread-header">
                            <div>
                                <strong>{customer?.name || "Khách"}</strong>
                                <span className="admin-chat-email">{customer?.email}</span>
                            </div>
                            <div className="admin-chat-header-actions">
                                <button
                                    type="button"
                                    className={`admin-chat-sound-btn ${soundEnabled ? "active" : ""}`}
                                    onClick={() => setSoundEnabled((v) => !v)}
                                    title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                                >
                                    {soundEnabled ? "🔔" : "🔕"}
                                </button>
                            </div>
                        </div>
                        <div className="admin-chat-thread-body">
                            <ul className="admin-chat-messages">
                                {thread.map((m) => (
                                    <li
                                        key={m._id}
                                        className={`admin-chat-msg ${m.sender === "user" ? "from-user" : "from-shop"}`}
                                    >
                                        {m.fileUrl && m.fileType === "image" && (
                                            <img
                                                src={m.fileUrl}
                                                alt="attachment"
                                                className="admin-chat-msg-image"
                                                onClick={() => window.open(m.fileUrl, "_blank")}
                                            />
                                        )}
                                        {m.fileUrl && m.fileType === "document" && (
                                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="admin-chat-msg-file">
                                                📄 {m.fileName || "File"} ({(m.fileSize / 1024).toFixed(1)} KB)
                                            </a>
                                        )}
                                        {m.text && <span className="admin-chat-msg-bubble">{m.text}</span>}
                                        <span className="admin-chat-msg-meta">
                                            {m.sender === "user" ? "Khách" : "Shop"} · {formatTime(m.createdAt)}
                                            {m.sender === "shop" && m.isRead && <span className="seen-badge">✓✓</span>}
                                        </span>
                                    </li>
                                ))}
                                <div ref={bottomRef} />
                            </ul>
                        </div>
                        <form className="admin-chat-reply" onSubmit={sendReply}>
                            <input
                                type="text"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Trả lời khách..."
                                maxLength={2000}
                            />
                            <button type="submit" disabled={sending || !reply.trim()}>
                                Gửi
                            </button>
                        </form>
                    </>
                )}
            </div>
            {showQuickReplyModal && (
                <QuickReplyModal
                    url={url}
                    quickReplies={quickReplies}
                    onClose={() => setShowQuickReplyModal(false)}
                    onUpdate={setQuickReplies}
                />
            )}
        </div>
    );
};

export default Chat;
```

- [ ] **Step 3: Update Admin Chat CSS**

Add/update these styles in `admin/src/pages/Chat/Chat.css`:

```css
.admin-chat-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e5e5e5;
}

.admin-chat-sidebar-header h2 {
    font-size: 16px;
    margin: 0;
}

.admin-chat-settings-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.admin-chat-settings-btn:hover {
    background: #f0f0f0;
}

.admin-chat-item {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    border: none;
    border-bottom: 1px solid #eee;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
}

.admin-chat-item:hover {
    background: #f0f0f0;
}

.admin-chat-item.active {
    background: #ffe8e3;
}

.admin-chat-item-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #666;
    flex-shrink: 0;
    position: relative;
}

.typing-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #4caf50;
    border-radius: 50%;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.admin-chat-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.admin-chat-item-name {
    font-weight: 600;
    font-size: 14px;
}

.admin-chat-item-preview {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.admin-chat-thread-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid #e5e5e5;
}

.admin-chat-email {
    display: block;
    font-size: 13px;
    color: #666;
    margin-top: 4px;
}

.admin-chat-header-actions {
    display: flex;
    gap: 8px;
}

.admin-chat-sound-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f0f0f0;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.admin-chat-sound-btn.active {
    background: #e3f2fd;
}

.admin-chat-msg {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 78%;
}

.admin-chat-msg-image {
    max-width: 200px;
    max-height: 150px;
    border-radius: 12px;
    cursor: pointer;
    object-fit: cover;
}

.admin-chat-msg-file {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    font-size: 13px;
    color: #333;
    text-decoration: none;
}

.seen-badge {
    color: #4fc3f7;
    margin-left: 4px;
}
```

- [ ] **Step 4: Create QuickReplyModal.jsx**

```javascript
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const QuickReplyModal = ({ url, quickReplies, onClose, onUpdate }) => {
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ text: "", isActive: true });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.text.trim()) return;
        setLoading(true);
        try {
            if (editing) {
                const res = await axios.put(`${url}/api/chat/admin/quick-replies/${editing}`, form);
                if (res.data.success) {
                    onUpdate((prev) => prev.map((r) => (r._id === editing ? res.data.data : r)));
                    toast.success("Đã cập nhật");
                }
            } else {
                const res = await axios.post(`${url}/api/chat/admin/quick-replies`, form);
                if (res.data.success) {
                    onUpdate((prev) => [...prev, res.data.data]);
                    toast.success("Đã thêm");
                }
            }
            setForm({ text: "", isActive: true });
            setEditing(null);
        } catch (e) {
            toast.error("Lỗi");
        }
        setLoading(false);
    };

    const handleEdit = (reply) => {
        setEditing(reply._id);
        setForm({ text: reply.text, isActive: reply.isActive });
    };

    const handleDelete = async (id) => {
        if (!confirm("Xóa quick reply này?")) return;
        try {
            await axios.delete(`${url}/api/chat/admin/quick-replies/${id}`);
            onUpdate((prev) => prev.filter((r) => r._id !== id));
            toast.success("Đã xóa");
        } catch (e) {
            toast.error("Lỗi");
        }
    };

    const toggleActive = async (reply) => {
        try {
            const res = await axios.put(`${url}/api/chat/admin/quick-replies/${reply._id}`, {
                isActive: !reply.isActive,
            });
            if (res.data.success) {
                onUpdate((prev) => prev.map((r) => (r._id === reply._id ? res.data.data : r)));
            }
        } catch (e) {
            toast.error("Lỗi");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content quick-reply-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Quản lý Quick Replies</h3>
                    <button type="button" className="modal-close" onClick={onClose}>×</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={form.text}
                        onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                        placeholder="Nhập nội dung quick reply..."
                        maxLength={500}
                    />
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        />
                        Đang hoạt động
                    </label>
                    <button type="submit" disabled={loading || !form.text.trim()}>
                        {editing ? "Cập nhật" : "Thêm mới"}
                    </button>
                    {editing && (
                        <button type="button" className="btn-cancel" onClick={() => { setEditing(null); setForm({ text: "", isActive: true }); }}>
                            Hủy
                        </button>
                    )}
                </form>
                <div className="quick-reply-list">
                    {quickReplies.map((qr) => (
                        <div key={qr._id} className={`quick-reply-item ${!qr.isActive ? "inactive" : ""}`}>
                            <span className="quick-reply-text">{qr.text}</span>
                            <div className="quick-reply-actions">
                                <button type="button" onClick={() => toggleActive(qr)}>
                                    {qr.isActive ? "Tắt" : "Bật"}
                                </button>
                                <button type="button" onClick={() => handleEdit(qr)}>Sửa</button>
                                <button type="button" className="btn-delete" onClick={() => handleDelete(qr._id)}>Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickReplyModal;
```

- [ ] **Step 5: Add modal styles to Admin Chat CSS**

Add modal styles for QuickReplyModal:

```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.modal-header h3 {
    margin: 0;
}

.modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: #f0f0f0;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.modal-form input[type="text"] {
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.modal-form button {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    background: tomato;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}

.modal-form button:disabled {
    opacity: 0.5;
}

.btn-cancel {
    background: #666 !important;
}

.quick-reply-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.quick-reply-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
}

.quick-reply-item.inactive {
    opacity: 0.5;
}

.quick-reply-text {
    flex: 1;
    font-size: 14px;
}

.quick-reply-actions {
    display: flex;
    gap: 8px;
}

.quick-reply-actions button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
}

.btn-delete {
    border-color: #f44336 !important;
    color: #f44336 !important;
}
```

- [ ] **Step 6: Commit**

```bash
git add admin/src/pages/Chat/Chat.jsx admin/src/pages/Chat/Chat.css admin/src/pages/Chat/QuickReplyModal.jsx
git commit -m "feat(chat): add typing indicator, seen receipts, quick reply management to admin panel"
```

---

## Task 9: Install multer on backend

**Steps:**

- [ ] **Step 1: Install multer**

```bash
cd back-end && npm install multer
```

- [ ] **Step 2: Commit**

```bash
git add back-end/package.json back-end/package-lock.json
git commit -m "chore(chat): install multer for file upload"
```

---

## Task 10: Test the implementation

**Steps:**

- [ ] **Step 1: Ensure upload directory exists**

```bash
mkdir -p back-end/uploads/chat
```

- [ ] **Step 2: Run backend and frontend**

Start backend: `cd back-end && npm run dev`
Start frontend: `cd front-end && npm run dev`

- [ ] **Step 3: Test user flow**

1. Login as user
2. Open chat bubble
3. Send text message
4. Send emoji via emoji picker
5. Send quick reply
6. Upload small image (base64)
7. Upload large file (server upload)
8. Verify typing indicator shows
9. Verify seen receipts

- [ ] **Step 4: Test admin flow**

1. Login as admin
2. View conversation list
3. Open a conversation
4. Send reply
5. Verify typing badge on user
6. Open quick reply settings
7. Add/edit/delete quick reply
8. Toggle sound on/off

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Update chatMessageModel | `back-end/models/chatMessageModel.js` |
| 2 | Create quickReplyModel | `back-end/models/quickReplyModel.js` |
| 3 | Update chatController | `back-end/controllers/chatController.js` |
| 4 | Update chatRoute | `back-end/routes/chatRoute.js` |
| 5 | Update chatSocket | `back-end/socket/chatSocket.js` |
| 6 | Install emoji-picker-react | `front-end/package.json` |
| 7 | Update ChatBubble UI | `front-end/src/component/ChatBubble/*` |
| 8 | Update Admin Chat | `admin/src/pages/Chat/*` |
| 9 | Install multer | `back-end/package.json` |
| 10 | Test | Manual testing |
