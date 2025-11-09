const express = require('express');
const router = express.Router();
const authRoute = require('./authRoute');
const BlogRoute = require('./BlogRoute');
const bookmarkRoute = require('./BookmarkRoute');

router.use('/auth', authRoute);
router.use('/blogs', BlogRoute);
router.use('/bookmarks', bookmarkRoute);

module.exports = router;