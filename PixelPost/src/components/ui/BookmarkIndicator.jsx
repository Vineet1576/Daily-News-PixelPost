import React, { useState, useEffect } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';

const BookmarkIndicator = ({ url, onToggle }) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const { checkBookmark } = useBookmarks();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const result = await checkBookmark(url);
                setIsBookmarked(result.isBookmarked);
            } catch (error) {
                console.error('Error checking bookmark status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [url, checkBookmark]);

    return (
        <button
            onClick={onToggle}
            disabled={loading}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isBookmarked
                    ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </span>
            ) : (
                isBookmarked ? 'Bookmarked' : 'Bookmark'
            )}
        </button>
    );
};

export default BookmarkIndicator;