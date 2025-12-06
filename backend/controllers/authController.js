const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');

// Helper function to generate JWT token
const generateToken = (userId, email, name) => {
    const jwtSecret = process.env.JWT_SECRET || 'hello';
    return jwt.sign(
        { _id: userId, email, name },
        jwtSecret,
        { expiresIn: '30m' }
    );
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && !existingUser.isDeleted) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        // Generate token
        const token = generateToken(user._id, user.email, user.name);

        res.status(201).json({
            message: 'User registered successfully',
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors from schema
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user with password field (normally hidden)
        const user = await User.findOne({ email, isDeleted: false }).select('+password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare passwords using model method
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id, user.email, user.name);

        res.status(200).json({
            message: 'Login successful',
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || user.isDeleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.getPublicProfile());
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        // Find user with password field
        const user = await User.findById(req.user._id).select('+password');
        if (!user || user.isDeleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordCorrect) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email, isDeleted: false });
        
        // Don't reveal if user exists for security
        if (!user) {
            return res.status(200).json({ 
                message: 'If an account exists with this email, a password reset link will be sent' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();

        // In production, send email with resetToken
        // For development, return the token
        res.status(200).json({
            message: 'Password reset link sent to email',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validation
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the provided token to compare
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching token that hasn't expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: new Date() },
            isDeleted: false
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Account (Soft Delete)
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required to delete account' });
        }

        // Find user with password field
        const user = await User.findById(req.user._id).select('+password');
        if (!user || user.isDeleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password for security
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Password is incorrect' });
        }

        // Soft delete
        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save();

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create Test User (Development only)
exports.createTestUser = async (req, res) => {
    try {
        // Check if test user already exists
        const existingUser = await User.findOne({ email: 'test@example.com' });
        if (existingUser && !existingUser.isDeleted) {
            return res.status(200).json({ 
                message: 'Test user already exists',
                email: 'test@example.com',
                password: 'password123'
            });
        }

        // Create test user
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        
        await testUser.save();
        
        res.status(201).json({
            message: 'Test user created successfully',
            email: 'test@example.com',
            password: 'password123',
            note: 'Use these credentials to login'
        });
    } catch (error) {
        console.error('Create test user error:', error);
        res.status(500).json({ message: 'Error creating test user', error: error.message });
    }
};
        