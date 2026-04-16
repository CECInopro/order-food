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

        socket.on("chat:typing", ({ isTyping }) => {
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
