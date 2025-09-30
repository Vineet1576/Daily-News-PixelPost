import React, { useState, useEffect, useRef } from 'react';
import { API_KEY } from './assets/key';
import Navbar from './components/Navbar.jsx';
import './style/output.css';

function Blog() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [publishedDate, setPublishedDate] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch {
            return [];
        }
    });
    const loaderRef = useRef(null);
    const endpoint = "https://gnews.io/api/v4/top-headlines";

    useEffect(() => {
        let ignore = false;
        const fetchNews = async () => {
            setLoading(true);
            setError("");
            try {
                const max = page === 1 ? 9 : 10;
                let url = `${endpoint}?lang=en&max=${max}&page=${page}&apikey=${API_KEY}`;
                if (publishedDate) {
                    const from = `${publishedDate}T00:00:00Z`;
                    const to = `${publishedDate}T23:59:59Z`;
                    url += `&from=${from}&to=${to}`;
                }
                if (category) {
                    url += `&topic=${category}`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (!ignore) {
                    if (data.articles) {
                        setNews(prev => page === 1 ? data.articles : [...prev, ...data.articles]);
                        setHasMore(data.articles.length > 0);
                    } else {
                        if (page === 1) setNews([]);
                        setHasMore(false);
                        setError(data.message || "No news found.");
                    }
                }
            } catch (err) {
                if (!ignore) {
                    setError("Failed to fetch news.");
                    setHasMore(false);
                }
            }
            if (!ignore) setLoading(false);
        };
        fetchNews();
        return () => { ignore = true; };
    }, [page, endpoint, publishedDate, category]);
    // Bookmark handler
    const handleBookmark = (item) => {
        const exists = bookmarks.some(b => b.url === item.url);
        let updated;
        if (exists) {
            updated = bookmarks.filter(b => b.url !== item.url);
        } else {
            updated = [...bookmarks, item];
        }
        setBookmarks(updated);
        localStorage.setItem('bookmarks', JSON.stringify(updated));
    };

    // Infinite scroll observer
    useEffect(() => {
        if (!hasMore || loading) return;
        const observer = new window.IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1 }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, loading]);

    // Filter logic
    const filteredNews = news.filter(item => {
        let matchesDate = true;
        let matchesSearch = true;
        if (publishedDate) {
            // Compare only the date part (YYYY-MM-DD)
            if (item.publishedAt) {
                const itemDate = new Date(item.publishedAt).toISOString().slice(0, 10);
                matchesDate = itemDate === publishedDate;
            } else {
                matchesDate = false;
            }
        }
        if (search) {
            const s = search.toLowerCase();
            matchesSearch = (item.title && item.title.toLowerCase().includes(s)) ||
                (item.description && item.description.toLowerCase().includes(s)) ||
                (item.content && item.content.toLowerCase().includes(s));
        }
        return matchesDate && matchesSearch;
    });

    return (
        <>
            <Navbar
                publishedDate={publishedDate}
                setPublishedDate={setPublishedDate}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={cat => { setCategory(cat); setPage(1); }}
            />
            <div className="min-h-screen w-full bg-slate-950 text-white font-sans antialiased py-16 px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">
                        Latest Headlines
                    </h1>
                    <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
                        Stay up-to-date with top stories from around the world.
                    </p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
                    {filteredNews.length > 0 ? filteredNews.map((item, idx) => {
                        const isBookmarked = bookmarks.some(b => b.url === item.url);
                        return (
                            <div
                                className="bg-slate-800 rounded-3xl overflow-hidden shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border border-slate-700 flex flex-col relative"
                                key={item.url || idx}
                            >
                                {/* Improved Bookmark Icon at top right */}
                                <div className="absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleBookmark(item);
                                        }}
                                        className={`p-2 rounded-full shadow-lg border-2 ${isBookmarked ? 'border-yellow-400 bg-yellow-100 p-2' : 'border-slate-700 bg-slate-800 pl-4 pr-4'} hover:border-yellow-400 hover:bg-yellow-50/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
                                        title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                                        aria-label={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                                    >
                                        {isBookmarked ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-yellow-400 drop-shadow-lg">
                                                <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v15a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm.75 1.5a.75.75 0 00-.75.75V19.5a.75.75 0 00.75.75h10.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H6.75zM8.25 15.75A.75.75 0 019 15h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-300 group-hover:text-yellow-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21.75a.75.75 0 01-1.057.607L12 18.011l-5.439 3.346c-.59.364-1.38-.103-1.38-1.18V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.215 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-56 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 bg-slate-700 flex items-center justify-center text-slate-400 text-lg font-medium p-4 text-center">
                                        {"No Image Available"}
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-blue-300 mb-3 leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 flex-grow mb-4 line-clamp-4">
                                        {item.description || 'No description available.'}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
                                        <div>
                                            {item.source?.name && <p className="text-sm font-bold text-blue-200 drop-shadow-lg">{item.source.name}</p>}
                                            {item.publishedAt && <p className="text-xs font-bold text-slate-400 mt-1">{new Date(item.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                                        </div>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-full text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                        >
                                            Read More
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : !loading && !error ? (
                        <p className='text-slate-400 font-semibold text-center col-span-full py-10'>No news found. Please check your API key or try again later.</p>
                    ) : null}
                </div>
                {error && <p className="text-red-500 font-semibold mt-8 text-center text-lg col-span-full">{error}</p>}
                <div ref={loaderRef} style={{ height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {loading && (
                        <div className="w-16 h-16 relative mt-8">
                            <div className="w-full h-full rounded-full absolute border-4 border-t-4 border-t-blue-500 border-gray-700 animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Blog;