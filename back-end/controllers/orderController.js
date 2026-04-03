import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import promotionModel from "../models/promotionModel.js";
import userVoucherModel from "../models/userVoucherModel.js";
import Stripe from "stripe";
import { applyPromotionDiscount, applyUserVoucher } from "./promotionController.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE_USD = 2;

const computeSubtotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);

const placeOrder = async (req, res) => {

    const frontend_url = "http://localhost:5174";

    try {
        const items = req.body.items || [];
        if (!items.length) {
            return res.json({ success: false, message: "Giỏ hàng trống" });
        }
        const subtotal = computeSubtotal(items);
        let promoResult;
        if (req.body.userVoucherId) {
            promoResult = await applyUserVoucher(
                req.body.userId,
                req.body.userVoucherId,
                subtotal
            );
        } else {
            promoResult = await applyPromotionDiscount(req.body.promoCode, subtotal);
        }

        if (!promoResult.ok) {
            return res.json({
                success: false,
                message: promoResult.message || "Mã khuyến mãi không hợp lệ",
            });
        }

        const discount = promoResult.discount || 0;
        const payableSubtotal = Math.max(0, subtotal - discount);
        const ratio = subtotal > 0 ? payableSubtotal / subtotal : 1;
        const finalAmount = payableSubtotal + (subtotal > 0 ? DELIVERY_FEE_USD : 0);

        const promotion = promoResult.promotion;

        // Tạo order trong database (số tiền tính lại phía server)
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: finalAmount,
            discountAmount: discount,
            promoCode: promotion ? promotion.code : null,
            promotionId: promotion ? promotion._id : null,
            userVoucherId: promoResult.userVoucher ? promoResult.userVoucher._id : null,
            address: req.body.address,
        });

        await newOrder.save();

        // Xóa cart của user sau khi đặt hàng
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });


        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(Number(item.price) * ratio * 100),
            },
            quantity: item.quantity || 1,
        }));

        // Phí giao hàng
        line_items.push({
            price_data: {
                currency: "usd",
                product_data: {
                    name: "Delivery Charges",
                },
                unit_amount: DELIVERY_FEE_USD * 100,
            },
            quantity: 1,
        });

        // Tạo Stripe session
        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: "payment",
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({
            success: true,
            session_url: session.url,
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error while placing order",
        });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }
        if (success == "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            if (order.promotionId) {
                await promotionModel.findByIdAndUpdate(order.promotionId, { $inc: { usedCount: 1 } });
            }
            if (order.userVoucherId) {
                await userVoucherModel.findByIdAndUpdate(order.userVoucherId, {
                    status: "used",
                    orderId: order._id,
                });
            }
            res.json({ success: true, message: "Paid" });
        }
        else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Not Paid" })
        }
    }
    catch (err) {
        console.log(err);
        res.json({ success: false, message: "Error" })
    }
}

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({
            userId: req.body.userId
        })
        res.json({
            success: true,
            data: orders
        })
    }
    catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Error"
        })
    }
}

const listOrder = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({
            success: true,
            message: "Updated"
        })
    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Error"
        })
    }
}

export { placeOrder, verifyOrder, userOrders, listOrder, updateStatus };