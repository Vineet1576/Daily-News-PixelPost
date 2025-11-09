import { useState, useCallback } from 'react';
import axios from 'axios';

export const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all bookmarks
    const fetchBookmarks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setBookmarks([]);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/bookmarks', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (Array.isArray(response.data)) {
                setBookmarks(response.data);
            } else {
                setBookmarks([]);
            }
        } catch (err) {
            // Handle authentication errors
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                setBookmarks([]);
                return;
            }

            // Set user-friendly error message
            const errorMessage = err.response?.status === 404 ? 
                'No bookmarks found' : 
                'Unable to load bookmarks';
            
            setError(errorMessage);

            // Only log detailed errors in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to fetch bookmarks:', err.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Add a bookmark
    const addBookmark = useCallback(async (article) => {
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // Handle missing token gracefully
                const error = new Error('Please login to bookmark articles');
                error.code = 'AUTH_REQUIRED';
                throw error;
            }

            // Validate article data
            if (!article?.url || !article?.title) {
                throw new Error('Invalid article data');
            }

            const response = await axios.post('http://localhost:5000/api/bookmarks', article, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data) {
                setBookmarks(prev => [...prev, response.data]);
                return response.data;
            }
        } catch (err) {
            // Handle specific error cases
            if (err.code === 'AUTH_REQUIRED') {
                // Redirect to login for auth errors
                window.location.href = '/login';
                return null;
            }
            
            if (err.response?.status === 409) {
                // Article already bookmarked
                return null;
            }

            // Set user-friendly error message
            const errorMessage = 
                err.code === 'AUTH_REQUIRED' ? err.message :
                err.response?.data?.message || 
                'Unable to save bookmark';
            
            setError(errorMessage);

            // Only log detailed errors in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('Bookmark operation failed:', errorMessage);
            }
            return null;
        }
    }, []);

    // Remove a bookmark
    const removeBookmark = useCallback(async (bookmarkId) => {
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to manage bookmarks');
            }
            
            if (!bookmarkId) {
                // Silently return if no bookmark ID instead of throwing error
                return false;
            }

            await axios.delete(`http://localhost:5000/api/bookmarks/${bookmarkId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setBookmarks(prev => prev.filter(bookmark => bookmark._id !== bookmarkId));
            return true;
        } catch (err) {
            // Handle specific error cases
            if (err.response?.status === 401) {
                localStorage.removeItem('token'); // Clear invalid token
                window.location.href = '/login'; // Redirect to login
                return false;
            }
            
            const errorMessage = err.response?.data?.message || 'Unable to remove bookmark';
            setError(errorMessage);
            // Use more concise error logging
            if (process.env.NODE_ENV === 'development') {
                console.warn('Bookmark operation failed:', errorMessage);
            }
            return false;
        }
    }, []);

    // Check if an article is bookmarked
    const checkBookmark = useCallback(async (url) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { isBookmarked: false };
            }

            const response = await axios.get(`http://localhost:5000/api/bookmarks/check?url=${encodeURIComponent(url)}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (err) {
            // Only log errors in development
            if (process.env.NODE_ENV === 'development' && err.response?.status !== 401) {
                console.warn('Unable to check bookmark status');
            }
            return { isBookmarked: false };
        }
    }, []);

    return {
        bookmarks,
        loading,
        error,
        fetchBookmarks,
        addBookmark,
        removeBookmark,
        checkBookmark
    };
};