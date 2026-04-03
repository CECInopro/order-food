import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    browseShopPromotions,
    claimPromotion,
    listMyVouchers,
    validateWalletVoucher,
    createPromotion,
    listPromotions,
    removePromotion,
    validatePromotion,
} from "../controllers/promotionController.js";

const promotionRouter = express.Router();

promotionRouter.get("/shop", browseShopPromotions);
promotionRouter.post("/claim", authMiddleware, claimPromotion);
promotionRouter.post("/mine", authMiddleware, listMyVouchers);
promotionRouter.post("/validate-wallet", authMiddleware, validateWalletVoucher);

promotionRouter.post("/add", createPromotion);
promotionRouter.get("/list", listPromotions);
promotionRouter.post("/remove", removePromotion);
promotionRouter.post("/validate", validatePromotion);

export default promotionRouter;
