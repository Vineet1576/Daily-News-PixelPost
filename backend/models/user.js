const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default
    },
    resetPasswordToken: {
        type: String,
        default: null,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        default: null,
        select: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password if modified
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(passwordToCheck) {
    return await bcrypt.compare(passwordToCheck, this.password);
};

// Method to get public profile (exclude sensitive fields)
userSchema.methods.getPublicProfile = function() {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    delete user.__v;
    return user;
};

// Query helper to exclude deleted users
userSchema.query.active = function() {
    return this.find({ isDeleted: false });
};

// Query helper to include deleted users
userSchema.query.withDeleted = function() {
    return this.find({});
};

module.exports = mongoose.model('User', userSchema);