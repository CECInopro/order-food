import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";


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

export { loginUser, registerUser };

