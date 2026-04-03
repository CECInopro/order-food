import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        sender: { type: String, enum: ["user", "shop"], required: true },
        text: { type: String, required: true, maxlength: 2000 },
        readByUser: { type: Boolean, default: false },
        readByShop: { type: Boolean, default: false },
    },
    { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

const chatMessageModel =
    mongoose.models.chatMessage || mongoose.model("chatMessage", chatMessageSchema);

export default chatMessageModel;
