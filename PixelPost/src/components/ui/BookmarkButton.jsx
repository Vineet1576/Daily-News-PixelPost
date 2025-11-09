import React, { useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';

const BookmarkButton = ({ article, onBookmarkChange }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { addBookmark, removeBookmark, checkBookmark } = useBookmarks();

    const handleClick = async () => {
        try {
            setIsLoading(true);
            const status = await checkBookmark(article.url);

            if (status.isBookmarked) {
                await removeBookmark(status.bookmarkId);
            } else {
                const bookmarkData = {
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    image: article.image,
                    source: article.source,
                    publishedAt: article.publishedAt
                };
                await addBookmark(bookmarkData);
            }

            if (onBookmarkChange) {
                onBookmarkChange(!status.isBookmarked);
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors 
                ${isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'} 
                text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing
                </span>
            ) : (
                'Bookmark'
            )}
        </button>
    );
};

export default BookmarkButton;