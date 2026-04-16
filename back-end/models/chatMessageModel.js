import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        sender: { type: String, enum: ["user", "shop"], required: true },
        text: { type: String, required: true, maxlength: 2000 },
        fileUrl: { type: String, default: null },
        fileType: { type: String, enum: ["image", "document", null], default: null },
        fileName: { type: String, default: null },
        fileSize: { type: Number, default: null },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

const chatMessageModel =
    mongoose.models.chatMessage || mongoose.model("chatMessage", chatMessageSchema);

export default chatMessageModel;
