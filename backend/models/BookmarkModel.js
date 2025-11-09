const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    url: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    source: {
        name: String,
        url: String
    },
    publishedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index for userId and url to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);