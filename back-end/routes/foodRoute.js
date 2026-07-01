import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import { uploadFood } from "../config/cloudinary.js";

const foodRoute = express.Router();

foodRoute.post("/add", uploadFood.single("image"), addFood);
foodRoute.get("/list", listFood);
foodRoute.post("/remove", removeFood);


export default foodRoute;