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
