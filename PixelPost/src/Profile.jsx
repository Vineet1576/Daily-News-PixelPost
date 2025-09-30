import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_KEY } from './assets/key';
import './style/output.css';
import Navbar from './components/Navbar';

export default function Profile() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);
    const [user, setUser] = useState({ name: '', email: '' });
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
            <Navbar
                publishedDate={publishedDate}
                setPublishedDate={setPublishedDate}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
            />
        } catch {
            return [];
        }
    });
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [publishedDate, setPublishedDate] = useState('');
    const [category, setCategory] = useState('');
    const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
    const endpoint = 'https://gnews.io/api/v4/top-headlines';

    // Load user from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { setUser({ name: '', email: '' }); }
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search.trim()), 400);
        return () => clearTimeout(id);
    }, [search]);

    // Reset pagination when primary filters change
    useEffect(() => {
        setPage(1);
        setNews([]);
        setHasMore(true);
    }, [publishedDate, category, debouncedSearch]);

    // Fetch news
    useEffect(() => {
        let ignore = false;
        const fetchNews = async () => {
            setLoading(true);
            setError('');
            try {
                const max = page === 1 ? 9 : 10;
                let url = `${endpoint}?lang=en&max=${max}&page=${page}&apikey=${API_KEY}`;
                if (category) url += `&topic=${category}`;
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
                        setError(data.message || 'No news found.');
                    }
                }
            } catch (err) {
                if (!ignore) {
                    setError('Failed to fetch news.');
                    setHasMore(false);
                }
            }
            if (!ignore) setLoading(false);
        };
        fetchNews();
        return () => { ignore = true; };
    }, [page, endpoint, category, debouncedSearch]);

    // Infinite scroll observer (smoother)
    useEffect(() => {
        if (!hasMore || loading) return;
        const observer = new window.IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) setPage(prev => prev + 1);
            },
            { threshold: 0.6, rootMargin: '200px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [hasMore, loading]);

    // Bookmark handler
    const handleBookmark = (item) => {
        const exists = bookmarks.some(b => b.url === item.url);
        const updated = exists ? bookmarks.filter(b => b.url !== item.url) : [item, ...bookmarks];
        setBookmarks(updated);
        localStorage.setItem('bookmarks', JSON.stringify(updated));
    };

    // Client-side filtering
    const filteredNews = useMemo(() => {
        const s = debouncedSearch.toLowerCase();
        return news.filter(item => {
            let matchesDate = true;
            let matchesSearch = true;
            if (publishedDate) {
                if (item.publishedAt) {
                    const itemDate = new Date(item.publishedAt).toISOString().slice(0, 10);
                    matchesDate = itemDate === publishedDate;
                } else {
                    matchesDate = false;
                }
            }
            if (s) {
                matchesSearch = (item.title && item.title.toLowerCase().includes(s)) ||
                    (item.description && item.description.toLowerCase().includes(s)) ||
                    (item.content && item.content.toLowerCase().includes(s));
            }
            return matchesDate && matchesSearch;
        });
    }, [news, debouncedSearch, publishedDate]);

    const readable = (iso) => {
        try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
    };

    const CATEGORIES = ['', 'general', 'business', 'technology', 'entertainment', 'sports', 'science', 'health', 'nation', 'politics', 'business', 'startup', 'fun', 'travel'];

    // Bookmark Drawer component
    const BookmarkDrawer = ({ open, onClose, items }) => (
        <div className={`fixed inset-0 z-40 transition-opacity ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
            <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Bookmarks drawer">
                <div className="p-6 flex items-center justify-between border-b border-slate-700">
                    <h3 className="text-xl font-bold text-yellow-300">Bookmarks</h3>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-800 focus:outline-none">Close</button>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100%-72px)]">
                    {items.length === 0 ? (
                        <p className="text-slate-400">No bookmarks yet. Save articles from the list.</p>
                    ) : (
                        items.map((b, i) => (
                            <div key={b.url || i} className="mb-4 p-3 bg-slate-800 rounded-2xl border border-slate-700">
                                <a href={b.url} target="_blank" rel="noreferrer" className="font-semibold text-yellow-200 block line-clamp-2">{b.title}</a>
                                <p className="text-xs text-slate-400 mt-2">{b.source?.name} · {readable(b.publishedAt)}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <button onClick={() => handleBookmark(b)} className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800">Remove</button>
                                    <a href={b.url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 rounded-full bg-yellow-400 text-slate-900 hover:bg-yellow-500">Open</a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </div>
    );

    const NewsCard = ({ item }) => {
        const isBookmarked = bookmarks.some(b => b.url === item.url);
        return (
            <article className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-slate-700 flex flex-col">
                <div className="relative">
                    {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                    ) : (
                        <div className="w-full h-48 bg-slate-700 flex items-center justify-center text-slate-400 font-medium">No Image Available</div>
                    )}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBookmark(item); }}
                        aria-label={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                        title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm ${isBookmarked ? 'bg-yellow-100/20 border border-yellow-400' : 'bg-black/30 border border-transparent'} focus:outline-none`}
                    >
                        {isBookmarked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-300">
                                <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v15a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm.75 1.5a.75.75 0 00-.75.75V19.5a.75.75 0 00.75.75h10.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H6.75zM8.25 15.75A.75.75 0 019 15h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21.75a.75.75 0 01-1.057.607L12 18.011l-5.439 3.346c-.59.364-1.38-.103-1.38-1.18V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.215 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-lg font-bold text-blue-300 mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">{item.content || item.description || 'No description available.'}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700">
                        <div>
                            {item.source?.name && <p className="text-sm font-semibold text-blue-200">{item.source.name}</p>}
                            {item.publishedAt && <p className="text-xs text-slate-400 mt-1">{readable(item.publishedAt)}</p>}
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">Read</a>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 text-white font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">Welcome, {user.name || 'User'}!</h1>
                    <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">Your personalized news feed — curated, saved, and ready.</p>
                </header>

                <div className="col-span-1 bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 mb-8">
                    <div className="flex flex-row items-center justify-between gap-6">

                        {/* Left Side: User Details - No Change */}
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-4xl text-white shadow-md ring-4 ring-blue-400/30">
                                    {(user.name && user.name.charAt(0)) || 'U'}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-100">{user.name || 'User Name'}</h2>
                                <p className="text-sm text-slate-400 mt-1">{user.email || 'user@email.com'}</p>
                            </div>
                        </div>

                        {/* Right Side: Inline Buttons Layout (Compact) */}
                        <div className="flex flex-row items-center gap-3 flex-shrink-0 w-80">
                            <button
                                onClick={() => { navigator.clipboard?.writeText(user.email || ''); }}
                                // Primary button with good padding
                                className="w-50 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                            >Copy Email</button>

                            {/* Subtle separator */}
                            <div className="h-6 w-px bg-slate-700"></div>

                            <button
                                onClick={() => { localStorage.removeItem('user'); setUser({ name: '', email: '' }); }}
                                // Simple text link for sign out
                                className="px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-xl hover:text-white hover:bg-slate-400 font-medium transition-colors"
                            >Sign Out</button>
                        </div>
                    </div>
                </div>

                <section className="mb-8 rounded-3xl p-6 bg-slate-900 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-extrabold text-yellow-400">Bookmarked News</h2>
                        <div className="text-sm text-slate-400 bg-slate-900 border border-yellow-400 rounded-full px-3 py-1">{bookmarks.length} saved</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookmarks.length > 0 ? bookmarks.map((item, idx) => (
                            <article
                                key={item.url || idx}
                                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-yellow-400 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1 focus-within:translate-y-0"
                                tabIndex={0}
                                aria-labelledby={`bm-title-${idx}`}
                            >
                                <div className="w-full h-48 sm:h-40 lg:h-44 overflow-hidden bg-slate-700">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title || 'Bookmarked article image'}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-center transform transition-transform duration-500 hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                                            No Image Available
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col h-full">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 id={`bm-title-${idx}`} className="font-semibold text-yellow-200 line-clamp-2 text-sm md:text-base">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                                {item.description || item.content || ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {item.source?.name && (
                                                <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700">
                                                    {item.source.name}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-400">{readable(item.publishedAt)}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            >
                                                Open
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M12.293 2.293a1 1 0 011.414 0L18 6.586V8a1 1 0 11-2 0V6.414l-4.293-4.293a1 1 0 010-1.414z" />
                                                    <path d="M3 5a2 2 0 012-2h5a1 1 0 110 2H5a1 1 0 00-1 1v9a2 2 0 002 2h9a1 1 0 110 2H6a4 4 0 01-4-4V5z" />
                                                </svg>
                                            </a>

                                            <button
                                                onClick={() => handleBookmark(item)}
                                                className="px-3 py-1 rounded-full border border-slate-700 text-sm bg-transparent hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                                aria-label="Remove bookmark"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )) : (
                            <div className="col-span-full p-8 bg-slate-800 rounded-2xl border border-slate-700 text-center text-slate-400">
                                <p className="mb-3 font-semibold">No bookmarks yet.</p>
                                <p className="text-sm mb-4">Save articles from the Blog page to see them here.</p>
                                <a
                                    href="/blog"
                                    className="inline-block px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Browse Headlines
                                </a>
                            </div>
                        )}
                    </div>

                </section>

                <section className="rounded-3xl p-6 bg-slate-900 border border-slate-700">
                    <h2 className="text-2xl font-extrabold text-blue-400 mb-6">Top Headlines</h2>
                    <div className="w-full md:w-auto mb-4">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar md:overflow-visible">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium border transition ${category === cat
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.length > 0 ? filteredNews.map((item, idx) => (
                            <NewsCard item={item} key={item.url || idx} />
                        )) : (!loading && !error) ? (
                            <div className="col-span-full p-10 bg-slate-800 rounded-2xl border border-slate-700 text-center text-slate-400">No news found. Try a different filter or clear your search.</div>
                        ) : null}
                    </div>

                    <div ref={loaderRef} className="flex justify-center items-center mt-8">
                        {loading && (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full relative">
                                    <div className="w-full h-full rounded-full absolute border-4 border-t-4 border-t-blue-500 border-gray-700 animate-spin"></div>
                                </div>
                                <p className="text-slate-400 mt-3">Loading more articles...</p>
                            </div>
                        )}
                    </div>

                    {error && <div className="mt-6 p-4 rounded-xl bg-red-900 text-red-200 border border-red-700">{error}</div>}
                </section>
            </div>

            <BookmarkDrawer open={isBookmarkOpen} onClose={() => setIsBookmarkOpen(false)} items={bookmarks} />
        </div>
    );
}
