const Bookmark = require('../models/BookmarkModel');
const User = require('../models/user');

// Add a bookmark
exports.addBookmark = async (req, res) => {
    try {
        const { title, description, url, image, source, publishedAt } = req.body;
        const userId = req.user._id; // From auth middleware

        // Check if bookmark already exists
        const existingBookmark = await Bookmark.findOne({ userId, url });
        if (existingBookmark) {
            return res.status(400).json({ message: "Article already bookmarked" });
        }

        const bookmark = new Bookmark({
            userId,
            title,
            description,
            url,
            image,
            source,
            publishedAt: publishedAt ? new Date(publishedAt) : new Date()
        });

        const savedBookmark = await bookmark.save();
        res.status(201).json(savedBookmark);
    } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ message: "Error adding bookmark", error: error.message });
    }
};

// Get all bookmarks for a user
exports.getBookmarks = async (req, res) => {
    try {
        const userId = req.user._id;
        const bookmarks = await Bookmark.find({ userId })
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json(bookmarks);
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ message: "Error fetching bookmarks", error: error.message });
    }
};

// Remove a bookmark
exports.removeBookmark = async (req, res) => {
    try {
        const bookmarkId = req.params.bookmarkId;
        const userId = req.user._id;

        const bookmark = await Bookmark.findOne({ _id: bookmarkId, userId });
        
        if (!bookmark) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        await Bookmark.deleteOne({ _id: bookmarkId });
        res.status(200).json({ message: "Bookmark removed successfully" });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ message: "Error removing bookmark", error: error.message });
    }
};

// Check if a URL is bookmarked by the user
exports.checkBookmark = async (req, res) => {
    try {
        const { url } = req.query;
        const userId = req.user._id;

        const bookmark = await Bookmark.findOne({ userId, url });
        res.status(200).json({ isBookmarked: !!bookmark, bookmarkId: bookmark?._id });
    } catch (error) {
        console.error('Check bookmark error:', error);
        res.status(500).json({ message: "Error checking bookmark status", error: error.message });
    }
};