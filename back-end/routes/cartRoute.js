import express from "express"
import { addToCard, removeTocard, getCard } from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";

const cartRoute = express.Router();

cartRoute.post("/add", authMiddleware, addToCard);
cartRoute.post("/remove", authMiddleware, removeTocard);
cartRoute.post("/get", authMiddleware, getCard);

export default cartRoute

