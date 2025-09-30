import React, { useState, useEffect, useRef } from 'react';
import { API_KEY } from './assets/key';
import './style/output.css';

function Profile() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);
    const [user, setUser] = useState({ name: '', email: '' });
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch {
            return [];
        }
    });
    const endpoint = "https://gnews.io/api/v4/top-headlines";

    useEffect(() => {
        // Simulate logged-in user from localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                setUser({ name: '', email: '' });
            }
        }
    }, []);

    useEffect(() => {
        let ignore = false;
        const fetchNews = async () => {
            setLoading(true);
            setError("");
            try {
                const max = page === 1 ? 9 : 10;
                let url = `${endpoint}?lang=en&max=${max}&page=${page}&apikey=${API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                if (!ignore) {
                    if (data.articles) {
                        const sorted = [...data.articles].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
                        setNews(prev => page === 1 ? sorted : [...prev, ...sorted]);
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
    }, [page, endpoint]);

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

    return (
        <div className="min-h-screen w-full bg-slate-950 text-white font-sans antialiased">
            <div className="w-[95%] max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">
                        Welcome, {user.name || 'User'}!
                    </h1>
                    <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
                        Your personalized news feed awaits. Stay informed with the latest headlines from around the globe.
                    </p>
                </header>

                {/* User Profile Card */}
                <div className="bg-slate-800 rounded-3xl p-8 mb-12 shadow-xl border-t border-b border-slate-700 relative">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-28 h-28 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl text-blue-400 shadow-md ring-4 ring-blue-400/50">
                            <span>👤</span>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-3xl font-bold text-slate-200">
                                {user.name || 'User Name'}
                            </h2>
                            <p className="text-lg text-slate-400 mt-1">
                                {user.email || 'user@email.com'}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Bookmarks Section */}
                <section className="rounded-3xl p-8 mb-12 shadow-xl border-t border-b border-slate-700 relative">
                    <h2 className="text-2xl font-extrabold text-yellow-400 mb-6 pl-4 border-l-4 border-yellow-400"
                        tabIndex={0}> Bookmarked News</h2>                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
                        {bookmarks.length > 0 ? bookmarks.map((item, idx) => (
                            <div
                                className="bg-slate-800 rounded-3xl overflow-hidden shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border border-yellow-400 flex flex-col"
                                key={item.url || idx}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-56 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 bg-slate-700 flex items-center justify-center text-slate-400 text-lg font-medium p-4 text-center">
                                        No Image Available
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-yellow-300 mb-3 leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 flex-grow mb-4 line-clamp-4">
                                        {item.description || 'No description available.'}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-yellow-400">
                                        <div>
                                            {item.source?.name && <p className="text-sm font-bold text-yellow-200 drop-shadow-lg">{item.source.name}</p>}
                                            {item.publishedAt && <p className="text-xs font-bold text-slate-400 mt-1">{new Date(item.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                                        </div>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-2 px-5 rounded-full text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                        >
                                            Read More
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className='text-slate-400 font-semibold text-center col-span-full py-10'>No bookmarks yet. Bookmark news from the Blog page.</p>
                        )}
                    </div>
                </section>
                {/* News Grid */}
                <div className='rounded-3xl p-8 mb-12 shadow-2xl border-t border-b border-slate-700 relative'>
                    <h2 className="text-2xl font-extrabold text-blue-400 mb-6 pl-4 border-l-4 border-blue-400">Top Headlines</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.length > 0 ? news.map((item, idx) => (
                            <div
                                className="bg-slate-800 rounded-3xl overflow-hidden shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border border-slate-700 flex flex-col"
                                key={item.url || idx}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-56 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 bg-slate-700 flex items-center justify-center text-slate-400 text-lg font-medium p-4 text-center">
                                        No Image Available
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-blue-300 mb-3 leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 flex-grow mb-4 line-clamp-4">
                                        {item.content || item.description || 'No description available.'}
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
                        )) : !loading && !error ? (
                            <p className='text-slate-400 font-semibold text-center col-span-full py-10'>No news found. Please check your API key or try again later.</p>
                        ) : null}
                    </div>
                </div>

                {/* Loader and Error Messages */}
                {error && <p className="text-red-500 font-semibold mt-8 text-center text-lg col-span-full">{error}</p>}
                <div ref={loaderRef} style={{ height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {loading && (
                        <div className="w-16 h-16 relative mt-8">
                            <div className="w-full h-full rounded-full absolute border-4 border-t-4 border-t-blue-500 border-gray-700 animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;