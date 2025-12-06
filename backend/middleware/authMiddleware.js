const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'hello';
        const decoded = jwt.verify(token, jwtSecret);

        // Check if user exists and is not soft-deleted
        const user = await User.findOne({ _id: decoded._id, isDeleted: false });
        if (!user) {
            return res.status(401).json({ message: 'User not found or account deleted' });
        }

        // Normalize payload to include `_id` property expected by controllers
        req.user = {
            _id: decoded._id || decoded.id,
            email: decoded.email,
            name: decoded.name
        };

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
};

module.exports = { protect };
