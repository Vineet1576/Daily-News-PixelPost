const express = require('express');
const router = express.Router();
const { createBlog, getBlogs } = require('../controllers/BlogsController');

router.post('/', createBlog);
router.get('/', getBlogs)
module.exports = router;