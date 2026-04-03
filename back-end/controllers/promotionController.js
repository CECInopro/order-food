import jwt from "jsonwebtoken";
import promotionModel from "../models/promotionModel.js";
import userVoucherModel from "../models/userVoucherModel.js";

function roundMoney(n) {
    return Math.round(n * 100) / 100;
}

/** Còn “lượt toàn hệ thống” để thanh toán với mã này */
export function promotionHasStock(promo) {
    if (!promo) return false;
    if (promo.maxUses == null) return true;
    return promo.usedCount < promo.maxUses;
}

export function promotionEligibleForClaim(promo) {
    if (!promo || !promo.active) return false;
    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return false;
    return promotionHasStock(promo);
}

/** Kiểm tra mã có dùng được trên đơn (subtotal) hay không — dùng chung cho nhập mã & ví */
export function validatePromotionForOrder(promo, subtotal) {
    const st = Math.max(0, Number(subtotal) || 0);

    if (!promo) {
        return { ok: false, discount: 0, promotion: null, message: "Mã khuyến mãi không hợp lệ" };
    }
    if (!promo.active) {
        return { ok: false, discount: 0, promotion: null, message: "Mã này không còn hiệu lực" };
    }
    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
        return { ok: false, discount: 0, promotion: null, message: "Mã đã hết hạn" };
    }
    if (!promotionHasStock(promo)) {
        return { ok: false, discount: 0, promotion: null, message: "Mã đã hết lượt sử dụng" };
    }
    if (st < promo.minOrderAmount) {
        return {
            ok: false,
            discount: 0,
            promotion: null,
            message: `Đơn tối thiểu $${promo.minOrderAmount} để dùng mã này`,
        };
    }

    let discount = 0;
    if (promo.type === "percent") {
        if (promo.value <= 0 || promo.value > 100) {
            return { ok: false, discount: 0, promotion: null, message: "Cấu hình mã không hợp lệ" };
        }
        discount = st * (promo.value / 100);
    } else {
        if (promo.value <= 0) {
            return { ok: false, discount: 0, promotion: null, message: "Cấu hình mã không hợp lệ" };
        }
        discount = Math.min(promo.value, st);
    }

    discount = roundMoney(Math.min(discount, st));
    return { ok: true, discount, promotion: promo, message: "" };
}

/** Trả về mã hợp lệ + số tiền giảm; không có mã thì ok, discount 0 */
export async function applyPromotionDiscount(rawCode, subtotal) {
    if (rawCode === undefined || rawCode === null || String(rawCode).trim() === "") {
        return { ok: true, discount: 0, promotion: null, userVoucher: null, message: "" };
    }

    const code = String(rawCode).trim().toUpperCase();
    const promo = await promotionModel.findOne({ code });
    const result = validatePromotionForOrder(promo, subtotal);
    return { ...result, userVoucher: null };
}

export async function applyUserVoucher(userId, userVoucherId, subtotal) {
    if (!userVoucherId) {
        return {
            ok: false,
            discount: 0,
            promotion: null,
            userVoucher: null,
            message: "Chưa chọn voucher",
        };
    }

    const v = await userVoucherModel.findById(userVoucherId);
    if (!v || String(v.userId) !== String(userId)) {
        return {
            ok: false,
            discount: 0,
            promotion: null,
            userVoucher: null,
            message: "Voucher không hợp lệ",
        };
    }
    if (v.status !== "available") {
        return {
            ok: false,
            discount: 0,
            promotion: null,
            userVoucher: null,
            message: "Voucher đã được sử dụng",
        };
    }

    const promo = await promotionModel.findById(v.promotionId);
    const result = validatePromotionForOrder(promo, subtotal);
    if (!result.ok) {
        return { ...result, userVoucher: null };
    }

    return { ...result, userVoucher: v };
}

const shopVisibilityQuery = {
    active: true,
    $or: [{ showInShop: true }, { showInShop: { $exists: false } }],
};

const browseShopPromotions = async (req, res) => {
    try {
        let userId = null;
        const token = req.headers.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = String(decoded.id);
            } catch (_) {
                /* guest */
            }
        }

        const promos = await promotionModel.find(shopVisibilityQuery).sort({ createdAt: -1 });

        const payload = await Promise.all(
            promos.map(async (p) => {
                const o = p.toObject();
                const maxPerUser = p.maxClaimsPerUser ?? 1;
                const eligible = promotionEligibleForClaim(p);
                const availableInWallet = userId
                    ? await userVoucherModel.countDocuments({
                          userId,
                          promotionId: p._id,
                          status: "available",
                      })
                    : 0;
                const hasInWallet = availableInWallet > 0;
                const canClaim = Boolean(
                    userId && eligible && availableInWallet < maxPerUser
                );
                const displayTitle =
                    (p.title && String(p.title).trim()) || `Ưu đãi ${p.code}`;

                return {
                    _id: o._id,
                    code: o.code,
                    title: displayTitle,
                    type: o.type,
                    value: o.value,
                    minOrderAmount: o.minOrderAmount,
                    expiresAt: o.expiresAt,
                    maxUses: o.maxUses,
                    usedCount: o.usedCount,
                    eligible,
                    hasInWallet,
                    canClaim,
                    maxClaimsPerUser: maxPerUser,
                };
            })
        );

        return res.json({ success: true, data: payload });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const claimPromotion = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const { promotionId } = req.body;
        if (!promotionId) {
            return res.status(400).json({ success: false, message: "Thiếu promotionId" });
        }

        const promo = await promotionModel.findById(promotionId);
        if (!promo || !promo.active) {
            return res.json({ success: false, message: "Khuyến mãi không tồn tại hoặc đã tắt" });
        }
        if (promo.showInShop === false) {
            return res.json({ success: false, message: "Không thể nhận mã này từ cửa hàng" });
        }
        if (!promotionEligibleForClaim(promo)) {
            return res.json({ success: false, message: "Khuyến mãi đã hết hạn hoặc hết lượt" });
        }

        const maxPerUser = promo.maxClaimsPerUser ?? 1;
        const inWallet = await userVoucherModel.countDocuments({
            userId,
            promotionId: promo._id,
            status: "available",
        });

        if (inWallet >= maxPerUser) {
            return res.json({
                success: false,
                message: "Bạn đã nhận đủ số lượng voucher này trong ví",
            });
        }

        const doc = await userVoucherModel.create({
            userId,
            promotionId: promo._id,
            status: "available",
        });

        return res.status(201).json({
            success: true,
            message: "Đã thêm vào ví voucher",
            data: doc,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const listMyVouchers = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const list = await userVoucherModel
            .find({ userId, status: "available" })
            .populate("promotionId")
            .sort({ claimedAt: -1 });

        const now = Date.now();
        const data = list
            .filter((v) => v.promotionId && typeof v.promotionId === "object")
            .filter((v) => {
                const pr = v.promotionId;
                if (!pr.active) return false;
                if (pr.expiresAt && new Date(pr.expiresAt).getTime() < now) return false;
                return promotionHasStock(pr);
            })
            .map((v) => {
                const pr = v.promotionId;
                const title =
                    (pr.title && String(pr.title).trim()) || `Ưu đãi ${pr.code}`;
                return {
                    _id: v._id,
                    claimedAt: v.claimedAt,
                    promotionId: pr._id,
                    code: pr.code,
                    title,
                    type: pr.type,
                    value: pr.value,
                    minOrderAmount: pr.minOrderAmount,
                    expiresAt: pr.expiresAt,
                };
            });

        return res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const validateWalletVoucher = async (req, res) => {
    try {
        const userId = String(req.body.userId);
        const { userVoucherId, subtotal } = req.body;
        const result = await applyUserVoucher(userId, userVoucherId, subtotal);

        if (!result.ok) {
            return res.json({ success: false, message: result.message });
        }

        return res.json({
            success: true,
            discount: result.discount,
            code: result.promotion ? result.promotion.code : null,
            userVoucherId: result.userVoucher ? result.userVoucher._id : null,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const createPromotion = async (req, res) => {
    try {
        const {
            code,
            title,
            type,
            value,
            minOrderAmount,
            expiresAt,
            maxUses,
            active,
            showInShop,
            maxClaimsPerUser,
        } = req.body;

        if (!code || !type || value === undefined || value === null) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        if (type === "percent" && (Number(value) <= 0 || Number(value) > 100)) {
            return res.status(400).json({ success: false, message: "Phần trăm phải từ 1 đến 100" });
        }
        if (type === "fixed" && Number(value) <= 0) {
            return res.status(400).json({ success: false, message: "Số tiền giảm phải lớn hơn 0" });
        }

        const maxUsesNum =
            maxUses === "" || maxUses == null ? null : Number(maxUses);
        if (maxUsesNum != null && maxUsesNum < 1) {
            return res.status(400).json({ success: false, message: "Giới hạn lượt dùng phải >= 1 hoặc để trống" });
        }

        const maxClaimsMax = maxClaimsPerUser === "" || maxClaimsPerUser == null ? 1 : Number(maxClaimsPerUser);
        if (maxClaimsMax < 1) {
            return res.status(400).json({ success: false, message: "Số voucher / user phải >= 1" });
        }

        const promo = new promotionModel({
            code: String(code).trim().toUpperCase(),
            title: title != null ? String(title).trim() : "",
            type,
            value: Number(value),
            minOrderAmount: minOrderAmount != null ? Number(minOrderAmount) : 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            maxUses: maxUsesNum,
            active: active !== false,
            showInShop: showInShop !== false,
            maxClaimsPerUser: maxClaimsMax,
        });

        await promo.save();
        return res.status(201).json({ success: true, message: "Tạo khuyến mãi thành công", data: promo });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Mã khuyến mãi đã tồn tại" });
        }
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const listPromotions = async (req, res) => {
    try {
        const list = await promotionModel.find({}).sort({ createdAt: -1 });
        return res.json({ success: true, data: list });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const removePromotion = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: "Thiếu id" });
        }
        await userVoucherModel.deleteMany({ promotionId: id });
        await promotionModel.findByIdAndDelete(id);
        return res.json({ success: true, message: "Đã xóa" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const validatePromotion = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        const result = await applyPromotionDiscount(code, subtotal);

        if (!result.ok) {
            return res.json({ success: false, message: result.message });
        }

        return res.json({
            success: true,
            discount: result.discount,
            code: result.promotion ? result.promotion.code : null,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

export {
    browseShopPromotions,
    claimPromotion,
    listMyVouchers,
    validateWalletVoucher,
    createPromotion,
    listPromotions,
    removePromotion,
    validatePromotion,
};
