import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const foodStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "order-food/foods",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
  },
});

const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "order-food/chat",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "pdf", "doc", "docx"],
  },
});

const uploadFood = multer({ storage: foodStorage });
const uploadChat = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export { cloudinary, uploadFood, uploadChat };
