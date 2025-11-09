const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    addBookmark,
    getBookmarks,
    removeBookmark,
    checkBookmark
} = require('../controllers/BookmarkController');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Add a new bookmark
router.post('/', addBookmark);

// Get all bookmarks for the current user
router.get('/', getBookmarks);

// Remove a bookmark
router.delete('/:bookmarkId', removeBookmark);

// Check if a URL is bookmarked
router.get('/check', checkBookmark);

module.exports = router;