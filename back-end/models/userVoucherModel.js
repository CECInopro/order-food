import mongoose from "mongoose";

const userVoucherSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        promotionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "promotion",
            required: true,
        },
        status: { type: String, enum: ["available", "used"], default: "available" },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", default: null },
        claimedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

userVoucherSchema.index({ userId: 1, promotionId: 1, status: 1 });

const userVoucherModel =
    mongoose.models.userVoucher ||
    mongoose.model("userVoucher", userVoucherSchema);

export default userVoucherModel;
