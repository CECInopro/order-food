import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://10112003dtc:10112003Dtc@cluster0.zhhqy6v.mongodb.net/order-food?retryWrites=true&w=majority").then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log(err);
    });
}