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
