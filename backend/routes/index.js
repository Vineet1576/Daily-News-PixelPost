const express = require('express');
const router = express.Router();
const authRoute = require('./authRoute');
const BlogRoute = require('./BlogRoute');
router.use('/auth', authRoute);
router.use('/blogs', BlogRoute);
module.exports = router;