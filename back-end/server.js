import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import foodRoute from "./routes/foodRoute.js";
import userRoute from "./routes/userRoute.js";
import "dotenv/config";
import cartRoute from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRouter.js";
import promotionRoute from "./routes/promotionRoute.js";
import chatRoute from "./routes/chatRoute.js";
import { attachChatSocket } from "./socket/chatSocket.js";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/food", foodRoute);
app.use("/image", express.static("uploads"));
app.use("/api/user", userRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRouter);
app.use("/api/promotion", promotionRoute);
app.use("/api/chat", chatRoute);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

attachChatSocket(io);

server.listen(port, () => {
    console.log(`server on http://localhost:${port} (HTTP + Socket.IO)`);
});
