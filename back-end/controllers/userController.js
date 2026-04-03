import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto"
import nodemailer from "nodemailer";


//login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        const token = createToken(user._id);
        res.json({ message: "User logged in successfully", success: true, token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

//register user
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // check is user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already exists", success: false });
        }

        // validate email and password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email", success: false });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long", success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new userModel({
            name: name,
            email: email,
            password: hashedPassword
        })
        await user.save();
        const token = createToken(user._id);
        res.status(201).json({ message: "User registered successfully", success: true, token });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}


// 1. Gửi mail reset password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            // Tránh lộ email tồn tại hay không
            return res.json({ success: true, message: "Nếu email tồn tại, link reset đã được gửi" });
        }
        // tạo token ngẫu nhiên
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
        await user.save();
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5174"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        // cấu hình transporter (sửa theo SMTP thực tế của anh/chị)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        await transporter.sendMail({
            from: `"Order Food" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Đặt lại mật khẩu",
            html: `
                <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
                <p>Nhấn vào link bên dưới để đặt mật khẩu mới (link có hiệu lực trong 15 phút):</p>
                <a href="${resetUrl}">${resetUrl}</a>
            `,
        });
        return res.json({ success: true, message: "Nếu email tồn tại, link reset đã được gửi" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// 2. Đổi mật khẩu bằng token
const resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await userModel.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Mật khẩu phải tối thiểu 8 ký tự" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


export { loginUser, registerUser, forgotPassword, resetPassword };

