import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Chat.css";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

const socketBase = (apiUrl) => String(apiUrl || "").replace(/\/$/, "");

const ADMIN_SOCKET_KEY =
    import.meta.env.VITE_CHAT_ADMIN_KEY || "orderfood-admin-socket-dev";

const Chat = ({ url }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const selectedIdRef = useRef(null);
    const [thread, setThread] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);

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

    const loadThread = useCallback(
        async (userId) => {
            if (!userId) return;
            try {
                const res = await axios.get(`${url}/api/chat/admin/thread/${userId}`);
                if (res.data.success) {
                    setThread(res.data.data || []);
                    setCustomer(res.data.user || null);
                }
            } catch (e) {
                console.error(e);
            }
        },
        [url]
    );

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

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
            const threadUser = userId != null ? String(userId) : String(message.userId || "");
            const sel = selectedIdRef.current ? String(selectedIdRef.current) : null;
            if (sel && threadUser === sel) {
                setThread((prev) => {
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        });

        socket.on("connect_error", (err) => {
            console.warn("Admin chat socket:", err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [url, loadConversations]);

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
        sock.emit(
            "chat:admin_reply",
            { userId: selectedId, text },
            (res) => {
                setSending(false);
                if (res?.success) {
                    setReply("");
                    loadConversations();
                } else {
                    toast.error(res?.message || "Không gửi được");
                }
            }
        );
    };

    return (
        <div className="admin-chat">
            <div className="admin-chat-sidebar">
                <h2>Hội thoại · Live</h2>
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
                                <span className="admin-chat-item-name">{c.userName}</span>
                                <span className="admin-chat-item-preview">{c.lastMessage?.text || ""}</span>
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
                        </div>
                        <div className="admin-chat-thread-body">
                            <ul className="admin-chat-messages">
                                {thread.map((m) => (
                                    <li
                                        key={m._id}
                                        className={`admin-chat-msg ${m.sender === "user" ? "from-user" : "from-shop"}`}
                                    >
                                        <span className="admin-chat-msg-bubble">{m.text}</span>
                                        <span className="admin-chat-msg-meta">
                                            {m.sender === "user" ? "Khách" : "Shop"} ·{" "}
                                            {m.createdAt
                                                ? new Date(m.createdAt).toLocaleString()
                                                : ""}
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
        </div>
    );
};

export default Chat;
