import foodModel from "../models/foodModel.js";
import fs from "fs";

// add food

const addFood = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename
    })
    try {
        await food.save();
        res.status(200).json({ message: "Food added successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error adding food", error: err });
    }
}

// get food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching food list", error: err });
    }
}

// reomve food
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`, () => { });
        await foodModel.findByIdAndDelete(req.body.id);
        res.status(200).json({ message: "Food removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error removing food", error: err });
    }
}

export { addFood, listFood, removeFood };