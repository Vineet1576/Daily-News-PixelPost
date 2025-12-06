# FlashFeed - Real-time News and Bookmarking Platform

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.x-green.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-blue.svg)](https://tailwindcss.com/)

## Overview
FlashFeed is a modern web application that provides real-time news updates and allows users to bookmark their favorite articles. Built with React.js and Node.js, it offers a seamless experience for reading and managing news content. The platform combines powerful features like real-time updates, personalized bookmarking, and a responsive user interface to deliver an engaging news reading experience.

## Features
- 🔐 User Authentication (JWT)
- 📰 Real-time News Updates
- 🔖 Article Bookmarking System
- 🎯 Category-based Filtering
- 🔍 Advanced Search Functionality
- 📱 Responsive Design
- 💾 MongoDB Integration
- 🌐 REST API Backend

## Project Structure

```
backend/
  ├── controllers/
  │   ├── authController.js
  │   ├── BlogsController.js
  │   └── BookmarkController.js
  ├── middleware/
  │   └── authMiddleware.js
  ├── models/
  │   ├── BlogsModel.js
  │   ├── BookmarkModel.js
  │   └── user.js
  ├── routes/
  │   ├── authRoute.js
  │   ├── BlogRoute.js
  │   └── index.js
  └── server.js

FlashFeed/
  ├── src/
  │   ├── components/
  │   │   ├── Navbar.jsx
  │   │   └── ui/
  │   │       ├── Button.jsx
  │   │       ├── Card.jsx
  │   │       └── Input.jsx
  │   ├── hooks/
  │   │   └── useBookmarks.js
  │   ├── utils/
  │   │   └── imageUtils.js
  │   ├── App.jsx
  │   ├── Blog.jsx
  │   ├── Login.jsx
  │   └── Profile.jsx
  └── package.json
```

## Key Features Implementation

### Authentication System
```javascript
// authController.js
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(201).json({ message: "User not Registered" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, userExist.password);
        if (!isPasswordCorrect) {
            return res.status(201).json({ message: "email and password is incorrect" });
        }
        const token = jwt.sign({ 
            id: userExist._id,
            email: userExist.email,
            name: userExist.name
        }, "hello", {
            expiresIn: "30m"
        });
        return res.status(200).json({
            _id: userExist._id,
            name: userExist.name,
            email: userExist.email,
            token
        });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};
```

### Bookmark System
```javascript
// BookmarkModel.js
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
    description: String,
    url: {
        type: String,
        required: true
    },
    image: String,
    source: {
        name: String,
        url: String
    },
    publishedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bookmarkSchema.index({ userId: 1, url: 1 }, { unique: true });
```
### Authentication Components
#### Login Component
```jsx
// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import Label from './components/ui/Label';
import ErrorText from './components/ui/ErrorText';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });
            
            if (res.data && res.data.token) {
                localStorage.setItem("user", JSON.stringify({
                    _id: res.data._id,
                    name: res.data.name,
                    email: res.data.email
                }));
                localStorage.setItem("token", res.data.token);
                navigate("/profile");
            } else {
                setError("Login failed - Invalid credentials");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white py-16 px-4">
            <Card className="w-full max-w-md mx-auto">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8">Login</h1>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <Label htmlFor="email">Email Address:</Label>
                        <Input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password:</Label>
                        <Input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>
                    <ErrorText>{error}</ErrorText>
                    <Button type="submit" className="w-full">Login</Button>
                </form>
                <div className="text-center mt-6">
                    <p className="text-slate-400">
                        Don't have an account?{' '}
                        <span
                            className="text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/signup")}
                        >
                            Sign Up here
                        </span>
                    </p>
                </div>
            </Card>
        </main>
    );
}

export default Login;
```
#### SignUp Component
```jsx
// SignUp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import Label from './components/ui/Label';
import ErrorText from './components/ui/ErrorText';

function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/api/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (res.status === 201) {
                navigate("/login");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Registration failed");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white py-16 px-4">
            <Card className="w-full max-w-md mx-auto">
                <h1 className="font-extrabold text-blue-400 text-center text-4xl mb-8">Sign Up</h1>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="name">Full Name:</Label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email Address:</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password:</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirm Password:</Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>
                    <ErrorText>{error}</ErrorText>
                    <Button type="submit" className="w-full">Sign Up</Button>
                </form>
                <div className="text-center mt-6">
                    <p className="text-slate-400">
                        Already have an account?{' '}
                        <span
                            className="text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/login")}
                        >
                            Login here
                        </span>
                    </p>
                </div>
            </Card>
        </main>
    );
}

export default SignUp;
```

#### UI Components

```jsx
// components/ui/Input.jsx
const Input = ({ className = "", ...props }) => (
    <input
        className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
        text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 
        focus:ring-blue-500 focus:border-transparent ${className}`}
        {...props}
    />
);

// components/ui/Button.jsx
const Button = ({ children, className = "", ...props }) => (
    <button
        className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium 
        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:ring-offset-2 focus:ring-offset-slate-900 
        disabled:bg-slate-700 disabled:cursor-not-allowed ${className}`}
        {...props}
    >
        {children}
    </button>
);

// components/ui/ErrorText.jsx
const ErrorText = ({ children }) => (
    children ? (
        <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200">
            {children}
        </div>
    ) : null
);
```

### News Filtering System

The news filtering system allows users to filter articles based on multiple criteria including categories, date ranges, and sources. Here's a detailed implementation:

#### Filter Components
```jsx
// components/filters/NewsFilters.jsx
import React from 'react';
import { useNewsContext } from '../../context/NewsContext';

const NewsFilters = () => {
    const { filters, updateFilters } = useNewsContext();
    
    const categories = [
        'Technology', 'Business', 'Sports', 
        'Entertainment', 'Health', 'Science'
    ];

    const handleCategoryChange = (category) => {
        updateFilters({ ...filters, category });
    };

    const handleDateRangeChange = (range) => {
        updateFilters({ ...filters, dateRange: range });
    };

    const handleSourceChange = (source) => {
        updateFilters({ ...filters, source });
    };

    return (
        <div className="flex flex-col space-y-4 p-4 bg-slate-800 rounded-lg">
            {/* Category Filters */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Categories</h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className={`px-3 py-1 rounded-full text-sm 
                                ${filters.category === category 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-slate-700 text-slate-300'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Time Period</h3>
                <select 
                    value={filters.dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-lg p-2"
                >
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                </select>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">News Sources</h3>
                <select
                    value={filters.source}
                    onChange={(e) => handleSourceChange(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-lg p-2"
                >
                    <option value="all">All Sources</option>
                    <option value="reuters">Reuters</option>
                    <option value="bbc">BBC News</option>
                    <option value="cnn">CNN</option>
                    <option value="bloomberg">Bloomberg</option>
                </select>
            </div>
        </div>
    );
};

export default NewsFilters;
```

#### News Context
```jsx
// context/NewsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const NewsContext = createContext();

export const NewsProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        category: 'all',
        dateRange: 'week',
        source: 'all',
        searchQuery: ''
    });

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    const updateFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        fetchArticles(newFilters);
    }, []);

    const fetchArticles = async (currentFilters) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                category: currentFilters.category,
                dateRange: currentFilters.dateRange,
                source: currentFilters.source,
                q: currentFilters.searchQuery
            });

            const response = await fetch(
                `/api/news?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            setArticles(data);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <NewsContext.Provider value={{
            filters,
            articles,
            loading,
            updateFilters
        }}>
            {children}
        </NewsContext.Provider>
    );
};

export const useNewsContext = () => useContext(NewsContext);
```

#### Backend Implementation
```javascript
// controllers/NewsController.js
const News = require('../models/NewsModel');

exports.getFilteredNews = async (req, res) => {
    try {
        const { category, dateRange, source, q } = req.query;
        
        // Build filter query
        const query = {};
        
        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Date range filter
        if (dateRange) {
            const date = new Date();
            switch (dateRange) {
                case 'today':
                    date.setHours(0, 0, 0, 0);
                    query.publishedAt = { $gte: date };
                    break;
                case 'week':
                    date.setDate(date.getDate() - 7);
                    query.publishedAt = { $gte: date };
                    break;
                case 'month':
                    date.setMonth(date.getMonth() - 1);
                    query.publishedAt = { $gte: date };
                    break;
                case 'year':
                    date.setFullYear(date.getFullYear() - 1);
                    query.publishedAt = { $gte: date };
                    break;
            }
        }

        // Source filter
        if (source && source !== 'all') {
            query['source.name'] = source;
        }

        // Search query
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const articles = await News
            .find(query)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await News.countDocuments(query);

        res.json({
            articles,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error fetching news", 
            error: error.message 
        });
    }
};
```

### News Model
```javascript
// models/NewsModel.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    content: String,
    url: {
        type: String,
        required: true,
        unique: true
    },
    image: String,
    publishedAt: {
        type: Date,
        required: true
    },
    source: {
        name: String,
        url: String
    },
    category: {
        type: String,
        enum: ['Technology', 'Business', 'Sports', 
               'Entertainment', 'Health', 'Science'],
        required: true
    }
}, { timestamps: true });

// Index for faster searches
newsSchema.index({ title: 'text', description: 'text' });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ 'source.name': 1 });

module.exports = mongoose.model('News', newsSchema);
```

### Frontend Bookmark Management
```javascript
// useBookmarks.js
export const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookmarks = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:5000/api/bookmarks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (Array.isArray(response.data)) {
                setBookmarks(response.data);
            }
        } catch (err) {
            setError('Unable to load bookmarks');
        } finally {
            setLoading(false);
        }
    }, []);

    return { bookmarks, loading, error, fetchBookmarks };
};
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the FlashFeed directory:
   ```bash
    cd FlashFeed
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Authentication Code

#### Auth Controller
```javascript
// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send response without password
        const userWithoutPassword = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        };

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

module.exports = { register, login };
```

#### User Model
```javascript
// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

#### Auth Middleware
```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user from payload
        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = authMiddleware;
```

#### Auth Routes
```javascript
// routes/authRoute.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

## API Documentation

### Authentication Endpoints
#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
}
```

#### User Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "securepassword"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Bookmark Endpoints
#### Get User Bookmarks
```http
GET /api/bookmarks
Authorization: Bearer <token>
```

#### Add New Bookmark
```http
POST /api/bookmarks
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Article Title",
    "description": "Article description",
    "url": "https://example.com/article",
    "image": "https://example.com/image.jpg",
    "source": {
        "name": "News Source",
        "url": "https://example.com"
    }
}
```

#### Remove Bookmark
```http
DELETE /api/bookmarks/:id
Authorization: Bearer <token>
```

#### Check Bookmark Status
```http
GET /api/bookmarks/check?url=https://example.com/article
Authorization: Bearer <token>
```

### Response Examples

#### Successful Login Response
```json
{
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token_here"
}
```

#### Bookmark List Response
```json
[
    {
        "_id": "bookmark_id",
        "title": "Article Title",
        "description": "Article description",
        "url": "https://example.com/article",
        "image": "https://example.com/image.jpg",
        "source": {
            "name": "News Source",
            "url": "https://example.com"
        },
        "createdAt": "2025-11-09T12:00:00.000Z"
    }
]
```

## Environment Variables
Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
API_KEY=your_news_api_key
```

## Development

### Code Style and Standards
- Use ESLint for code linting
- Follow Airbnb JavaScript Style Guide
- Maintain consistent code formatting using Prettier
- Write meaningful commit messages following Conventional Commits

### Testing
```bash
# Run frontend tests
cd FlashFeed
npm test

# Run backend tests
cd backend
npm test
```

### Building for Production
```bash
# Build frontend
cd FlashFeed
npm run build

# Prepare backend for production
cd backend
npm run build
```

## Performance Optimization

### Frontend Optimizations
- Lazy loading of images and components
- Code splitting for optimal bundle size
- Caching strategies for API responses
- Optimized asset delivery

### Backend Optimizations
- Database indexing for faster queries
- Response caching
- Rate limiting
- Compression middleware

## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Guidelines
```
feat: add new feature
fix: resolve specific issue
docs: update documentation
style: formatting, missing semi colons, etc
refactor: code restructuring
test: add missing tests
chore: maintain dependencies
```

## Security Measures
- JWT-based authentication
- Password hashing using bcrypt
- XSS protection
- CORS configuration
- Rate limiting
- Input validation
- Secure headers
- Environment variable protection

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- Project Link: [Daily-News-FlashFeed](https://github.com/Vineet1576/Daily-News-PixelPost)
- Developer: [Vineet1576](https://github.com/Vineet1576)

## Acknowledgments
- [React.js](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - Backend runtime
- [MongoDB](https://www.mongodb.com/) - Database
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [GNews API](https://gnews.io/) - News data provider
- [Express.js](https://expressjs.com/) - Backend framework
- [JWT](https://jwt.io/) - Authentication
- [Vite](https://vitejs.dev/) - Build tool
