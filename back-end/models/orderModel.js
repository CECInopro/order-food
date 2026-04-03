import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    promoCode: {
        type: String,
        default: null,
    },
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "promotion",
        default: null,
    },
    userVoucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userVoucher",
        default: null,
    },
    address: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        default: "Food Processing"
    },
    date: {
        type: Date,
        default: Date.now()
    },
    payment: {
        type: Boolean,
        default: false
    }
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
