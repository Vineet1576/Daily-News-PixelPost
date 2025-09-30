import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_KEY } from './assets/key';
import './style/output.css';

// Improved Blog component with enhanced UI and filters (single-file React component)
export default function Blog() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [publishedDate, setPublishedDate] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState('');
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch {
            return [];
        }
    });
    const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
    const loaderRef = useRef(null);
    const endpoint = 'https://gnews.io/api/v4/top-headlines';

    // Debounce search so we don't re-render/fetch on every keystroke
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search.trim()), 450);
        return () => clearTimeout(id);
    }, [search]);

    // Reset list when primary filters change
    useEffect(() => {
        setPage(1);
        setNews([]);
        setHasMore(true);
    }, [publishedDate, category, debouncedSearch]);

    // Fetching news (keeps compatibility with existing API usage)
    useEffect(() => {
        let ignore = false;
        const fetchNews = async () => {
            setLoading(true);
            setError('');
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
                // Server doesn't have search param for gnews free plan in a consistent way; keep client-side filtering
                const res = await fetch(url);
                const data = await res.json();
                if (!ignore) {
                    if (data.articles) {
                        setNews(prev => (page === 1 ? data.articles : [...prev, ...data.articles]));
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
    }, [page, endpoint, publishedDate, category, debouncedSearch]);

    // Bookmark handler
    const handleBookmark = (item) => {
        const exists = bookmarks.some(b => b.url === item.url);
        const updated = exists ? bookmarks.filter(b => b.url !== item.url) : [item, ...bookmarks];
        setBookmarks(updated);
        localStorage.setItem('bookmarks', JSON.stringify(updated));
    };

    // Infinite scroll observer (improved: rootMargin for smoother loads)
    useEffect(() => {
        if (!hasMore || loading) return;
        const observer = new window.IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.6, rootMargin: '200px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, loading]);

    // Client-side filtering and searching. Keep logic but optimize with useMemo
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

    // Small helper: readable date
    const readable = (iso) => {
        try {
            return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    // Bookmark drawer UI
    const BookmarkDrawer = ({ open, onClose, items }) => {
        return (
            <div className={`fixed inset-0 z-40 transition-opacity ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
                <div className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
                <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
                    aria-label="Bookmarks drawer" style={{ marginTop: '65px' }}
                >
                    <div className="p-6 flex items-center justify-between border-b border-slate-700">
                        <h3 className="text-xl font-bold text-blue-300">Bookmarks</h3>
                        <span className="px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800 focus:outline-none">{bookmarks.length} Bookmarks Saved</span>
                        <button onClick={onClose} className="px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800 focus:outline-none">Close</button>
                    </div>
                    <div className="p-4 overflow-y-auto h-[calc(100%-72px)] custom-scrollbar">
                        {items.length === 0 ? (
                            <p className="text-slate-400">No bookmarks yet. Click the bookmark icon on any article to save it here.</p>
                        ) : (
                            items.map((b, i) => (
                                <div key={b.url || i} className="mb-4 p-3 bg-slate-800 rounded-2xl border border-slate-700">
                                    <a href={b.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-200 block line-clamp-2">{b.title}</a>
                                    <p className="text-xs text-slate-400 mt-2">{b.source?.name} · {readable(b.publishedAt)}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <button onClick={() => handleBookmark(b)} className="text-sm px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800">Remove</button>
                                        <a href={b.url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700">Open</a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        );
    };

    // Small card component
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
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">{item.description || 'No description available.'}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700">
                        <div>
                            {item.source?.name && <p className="text-sm font-semibold text-blue-200">{item.source.name}</p>}
                            {item.publishedAt && <p className="text-xs text-slate-400 mt-1">{readable(item.publishedAt)}</p>}
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Read More
                        </a>
                    </div>
                </div>
            </article>
        );
    };

    // Categories quick-filter chips
    const CATEGORIES = ['', 'general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

    return (
        <div className="min-h-screen w-full bg-slate-950 text-white font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
            <header className="max-w-7xl mx-auto text-center mb-10">
                <h1 className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">Latest Headlines</h1>
                <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">Stay up-to-date with top stories from around the world.</p>
            </header>

            <div className="max-w-5xl mx-auto mb-8 flex justify-center">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full px-4">

                    {/* Search Input */}
                    <div className="relative flex-1 sm:flex-auto w-full">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search headlines, keywords or topics..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 px-4 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Search articles"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-800/80"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Date Input */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                        <input
                            type="date"
                            value={publishedDate}
                            onChange={e => setPublishedDate(e.target.value)}
                            className="w-full sm:w-auto bg-slate-800 border border-slate-700 rounded-full py-3 px-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Filter by date"
                        />
                    </div>

                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Categories with hidden scrollbar */}
                <div className="w-full md:w-auto">
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
                <div className='flex items-center gap-4 w-full'>
                    {/* Reset Button */}
                    <button
                        onClick={() => {
                            setPublishedDate('');
                            setSearch('');
                            setCategory('');
                        }}
                        className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                        Reset
                    </button>
                    {/* Bookmarks */}
                    <button
                        onClick={() => setIsBookmarkOpen(true)}
                        className="px-3 py-1 rounded-full bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-500 transition"
                    >
                        Bookmarks ({bookmarks.length})
                    </button></div>
            </div>

            <main className="max-w-7xl mx-auto">
                {error && <div className="mb-6 p-4 rounded-xl bg-red-900 text-red-200 border border-red-700">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

            </main>

            <BookmarkDrawer open={isBookmarkOpen} onClose={() => setIsBookmarkOpen(false)} items={bookmarks} />
        </div>
    );
}