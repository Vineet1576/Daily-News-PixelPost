import React, { useState } from 'react';

const NewsCard = ({ item, onBookmarkToggle, isBookmarked }) => {
    const [imageError, setImageError] = useState(false);
    const [bookmarkStatus, setBookmarkStatus] = useState(isBookmarked);
    const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM2NDc0OUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

    const handleImageError = (e) => {
        setImageError(true);
        e.target.src = fallbackImage;
    };

    return (
        <article className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 transition-transform hover:scale-[1.02]">
            <div className="relative">
                {!imageError && item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        onError={handleImageError}
                        className="w-full h-48 object-cover"
                        loading="eager"
                        decoding="async"
                    />
                ) : (
                    <img
                        src={fallbackImage}
                        alt="No image available"
                        className="w-full h-48 object-cover"
                    />
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-slate-100 mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-3">{item.description}</p>
                <div className="flex items-center justify-between">
                    {item.source && (
                        <span className="text-xs text-slate-500">
                            {item.source.name}
                        </span>
                    )}
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-slate-900 text-sm font-semibold hover:bg-yellow-300 transition-colors"
                    >
                        Read More
                    </a>
                </div>
            </div>
        </article>
    );
};

export default NewsCard;