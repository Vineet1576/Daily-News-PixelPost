const jwt = require('jsonwebtoken')
const User = require('../models/user')
const bcrypt = require('bcrypt')
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExist = await User.findOne({ email })
        if (userExist) return res.status(400).json({ message: "User already exist" });
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await new User({ name, email, password: hashPassword });
        const userSave = await user.save();
        res.status(201).json(userSave);
    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(201).json({ message: "User not  Registered" });
        }
        const isPasswordCorrect = await bcrypt.compare(password,userExist.password);

        if (!isPasswordCorrect) {
            return res.status(201).json({ message: "email and password is incorrect" });
        }
        const token = jwt.sign({ email: userExist.email }, "hello", {
            expiresIn: "30m"
        });
        return res.status(200).json({
            _id: userExist._id,
            name: userExist.name,
            email: userExist.email,
            token
        });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
}