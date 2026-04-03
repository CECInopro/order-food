import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        title: { type: String, default: "" },
        type: { type: String, enum: ["percent", "fixed"], required: true },
        value: { type: Number, required: true },
        minOrderAmount: { type: Number, default: 0 },
        /** Hiển thị ở trang “săn” voucher cho khách */
        showInShop: { type: Boolean, default: true },
        /** Số voucher “đang còn trong ví” tối đa cùng một mã / user (mặc định 1 như Shopee) */
        maxClaimsPerUser: { type: Number, default: 1 },
        active: { type: Boolean, default: true },
        expiresAt: { type: Date, default: null },
        maxUses: { type: Number, default: null },
        usedCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const promotionModel =
    mongoose.models.promotion || mongoose.model("promotion", promotionSchema);

export default promotionModel;
