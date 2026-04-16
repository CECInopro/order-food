import quickReplyModel from "../models/quickReplyModel.js";

const defaults = [
    { text: "Xin chào! Cảm ơn đã liên hệ", order: 1 },
    { text: "Đơn hàng của bạn đang được xử lý", order: 2 },
    { text: "Cảm ơn bạn đã đặt hàng!", order: 3 },
    { text: "Chúng tôi sẽ giao hàng trong 30-45 phút", order: 4 },
];

async function seed() {
    const count = await quickReplyModel.countDocuments();
    if (count === 0) {
        await quickReplyModel.insertMany(defaults);
        console.log("Quick replies seeded");
    }
}

seed();
