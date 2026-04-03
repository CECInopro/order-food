import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./ChatBubble.css";
import { StoreContext } from "../../contexts/StoreContext";
import axios from "axios";
import { io } from "socket.io-client";

const socketBase = (apiUrl) => String(apiUrl || "").replace(/\/$/, "");

const ChatBubble = ({ setShowLogin }) => {
    const { url, token } = useContext(StoreContext);
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);
    const listEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    const scrollToBottom = () => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    useEffect(() => {
        if (!open || !token) return;
        fetchMessages();
    }, [open, token, fetchMessages]);

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
                const res = await axios.get(`${url}/api/chat/messages`, { headers: { token } });
                if (res.data.success) setMessages(res.data.data || []);
                const ur = await axios.get(`${url}/api/chat/unread`, { headers: { token } });
                if (ur.data.success) setUnread(ur.data.count || 0);
            } catch (e) {
                console.error(e);
            }
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

    const send = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !token || sending) return;

        const sock = socketRef.current;
        if (!sock || !sock.connected) {
            alert("Đang kết nối chat, thử lại sau vài giây");
            return;
        }

        setSending(true);
        sock.emit("chat:send", { text }, (res) => {
            setSending(false);
            if (res?.success) {
                setInput("");
            } else {
                alert(res?.message || "Gửi thất bại");
            }
        });
    };

    const toggle = () => {
        setOpen((o) => !o);
        if (!open) fetchMessages();
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
                                        <span className="chat-msg-text">{m.text}</span>
                                        <span className="chat-msg-time">
                                            {m.createdAt
                                                ? new Date(m.createdAt).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : ""}
                                        </span>
                                    </li>
                                ))}
                                <div ref={listEndRef} />
                            </ul>
                        )}
                    </div>
                    {token && (
                        <form className="chat-panel-footer" onSubmit={send}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                maxLength={2000}
                                disabled={sending}
                            />
                            <button type="submit" disabled={sending || !input.trim()}>
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
