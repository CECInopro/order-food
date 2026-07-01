import foodModel from "../models/foodModel.js";
import { cloudinary } from "../config/cloudinary.js";

const addFood = async (req, res) => {
    const image_url = req.file?.path || "";

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_url,
    })
    try {
        await food.save();
        res.status(200).json({ message: "Food added successfully", success: true });
    } catch (err) {
        res.status(500).json({ message: "Error adding food", success: false, error: err });
    }
}

const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching food list", error: err });
    }
}

const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (food?.image) {
            const publicId = food.image.split("/").slice(-2).join("/").split(".")[0];
            await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
        await foodModel.findByIdAndDelete(req.body.id);
        res.status(200).json({ message: "Food removed successfully", success: true });
    } catch (err) {
        res.status(500).json({ message: "Error removing food", success: false, error: err });
    }
}

export { addFood, listFood, removeFood };