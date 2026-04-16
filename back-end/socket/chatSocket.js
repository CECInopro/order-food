import jwt from "jsonwebtoken";
import chatMessageModel from "../models/chatMessageModel.js";

const ADMIN_KEY = process.env.CHAT_ADMIN_KEY || "orderfood-admin-socket-dev";

/**
 * @param {import("socket.io").Server} io
 */
export function attachChatSocket(io) {
    io.use((socket, next) => {
        const auth = socket.handshake.auth || {};
        if (auth.adminKey && auth.adminKey === ADMIN_KEY) {
            socket.isAdmin = true;
            socket.userId = null;
            return next();
        }
        try {
            const token = auth.token;
            if (!token) {
                return next(new Error("Unauthorized"));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = String(decoded.id);
            socket.isAdmin = false;
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        if (socket.isAdmin) {
            socket.join("admin");
        } else {
            socket.join(`user:${socket.userId}`);
        }

        socket.on("chat:send", async (payload, ack) => {
            if (socket.isAdmin) {
                return ack?.({ success: false, message: "Forbidden" });
            }
            try {
                const text = String(payload?.text ?? "")
                    .trim()
                    .slice(0, 2000);
                if (!text) {
                    return ack?.({ success: false, message: "Nội dung trống" });
                }
                const msg = await chatMessageModel.create({
                    userId: socket.userId,
                    sender: "user",
                    text,
                    fileUrl: payload.fileUrl || null,
                    fileType: payload.fileType || null,
                    fileName: payload.fileName || null,
                    fileSize: payload.fileSize || null,
                    readByUser: true,
                    readByShop: false,
                });
                const lean = msg.toObject();
                io.to(`user:${socket.userId}`).emit("chat:new_message", { message: lean });
                io.to("admin").emit("chat:new_message", {
                    message: lean,
                    userId: socket.userId,
                });
                ack?.({ success: true, data: lean });
            } catch (err) {
                console.error(err);
                ack?.({ success: false, message: "Lỗi server" });
            }
        });

        socket.on("chat:admin_reply", async (payload, ack) => {
            if (!socket.isAdmin) {
                return ack?.({ success: false, message: "Forbidden" });
            }
            try {
                const userId = String(payload?.userId ?? "");
                const text = String(payload?.text ?? "")
                    .trim()
                    .slice(0, 2000);
                if (!userId || !text) {
                    return ack?.({ success: false, message: "Thiếu dữ liệu" });
                }
                const msg = await chatMessageModel.create({
                    userId,
                    sender: "shop",
                    text,
                    fileUrl: payload.fileUrl || null,
                    fileType: payload.fileType || null,
                    fileName: payload.fileName || null,
                    fileSize: payload.fileSize || null,
                    readByUser: false,
                    readByShop: true,
                });
                const lean = msg.toObject();
                io.to(`user:${userId}`).emit("chat:new_message", { message: lean });
                io.to("admin").emit("chat:new_message", { message: lean, userId });
                ack?.({ success: true, data: lean });
            } catch (err) {
                console.error(err);
                ack?.({ success: false, message: "Lỗi server" });
            }
        });

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
    });
}
