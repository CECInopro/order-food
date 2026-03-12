import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import e from "cors";
import { connect } from "mongoose";
import { connectDB } from "./config/db.js";
import foodRoute from "./routes/foodRoute.js";
import userRoute from "./routes/userRoute.js";
import 'dotenv/config';

// app config
const app = express();
const port = 4000;

// middlewares
app.use(express.json());
app.use(cors());

//db conncection
connectDB();

//api endpoints
app.use("/api/food", foodRoute);
app.use("/image", express.static("uploads"));
app.use("/api/user", userRoute);


app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.listen(port, () => {
    console.log(`server on http://localhost:${port}`);
})