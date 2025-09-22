const Blog = require('../models/BlogsModel');

exports.createBlog = async (req, res) => {
    try {
        const { title, content, author } = req.body;

        if (!title || !author || !content) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newBlog = new Blog({
            title,
            author,
            content
        });

        const saveBlog = await newBlog.save();
        res.status(201).json({ sucess: true, data: saveBlog });
    } catch (error) {
        res.status(500).json({ error: "Error Creating Blog", details: error.message });
    }
};

exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({ success: true, data: blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};