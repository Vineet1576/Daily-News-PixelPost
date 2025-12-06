import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_KEY } from './assets/key';
import './style/output.css';
import Navbar from './components/Navbar';
import NewsCard from './components/NewsCard';
import { useBookmarks } from './hooks/useBookmarks';
import { useSettings } from './context/SettingsContext';

export default function Profile() {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);
    const [user, setUser] = useState({ name: '', email: '' });
    const {
        bookmarks,
        loading: bookmarksLoading,
        error: bookmarksError,
        fetchBookmarks,
        removeBookmark,
        addBookmark,
        checkBookmark
    } = useBookmarks();
    const [bookmarkError, setBookmarkError] = useState('');
    const { settings, setSettings } = useSettings();
    const [signingOut, setSigningOut] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [clearing, setClearing] = useState(false);
    // Removed search and publishedDate state
    const [category, setCategory] = useState('');
    const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
    // New state for account management modals
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [changePasswordData, setChangePasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showDeletePwd, setShowDeletePwd] = useState(false);
    const [accountMessage, setAccountMessage] = useState('');
    const [accountError, setAccountError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const endpoint = 'https://gnews.io/api/v4/top-headlines';

    // Load user from API
    // Check authentication and fetch bookmarks on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchBookmarks();
    }, [navigate, fetchBookmarks]);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token) {
                setError('Please login to view your profile');
                navigate('/login');
                return;
            }

            // Set user data from localStorage first for immediate display
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                } catch (e) {
                    console.error('Error parsing stored user data:', e);
                }
            }

            try {
                const res = await axios.get("http://localhost:5000/api/auth/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.data) {
                    setUser(res.data);
                    setError('');
                    // Update stored user data
                    localStorage.setItem('user', JSON.stringify(res.data));
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch profile", error);
                if (error.response?.status === 401) {
                    setError('Your session has expired. Please login again.');
                    localStorage.removeItem('token');
                } else {
                    setError('Failed to load profile. Please try again later.');
                    // Handle error, e.g., redirect to login
                }
            }
        };
        fetchProfile();
    }, []);

    // Reset pagination when category changes
    useEffect(() => {
        setPage(1);
        setNews([]);
        setHasMore(true);
    }, [category]);

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
    }, [page, endpoint, category]);

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
    const handleBookmark = async (item) => {
        try {
            setBookmarkError('');

            // If the item is already a bookmark from the DB it should include _id
            if (item && item._id) {
                await removeBookmark(item._id);
                await fetchBookmarks();
                return;
            }

            // Otherwise, try to toggle bookmark by URL (news article)
            if (item && item.url) {
                // Check backend if this URL is bookmarked
                const status = await checkBookmark(item.url);
                if (status?.isBookmarked) {
                    // remove using returned bookmarkId
                    const idToRemove = status.bookmarkId;
                    if (idToRemove) {
                        await removeBookmark(idToRemove);
                        await fetchBookmarks();
                        return;
                    }
                    // If no id available, fail gracefully
                    throw new Error('Unable to determine bookmark id for removal');
                } else {
                    // Build bookmark payload expected by backend
                    const bookmarkData = {
                        title: item.title || item.name || 'Untitled',
                        description: item.description || item.content || '',
                        url: item.url,
                        image: item.image || item.urlToImage || '',
                        source: item.source || (item.source && item.source.name) || {},
                        publishedAt: item.publishedAt || item.published_at || new Date().toISOString()
                    };
                    await addBookmark(bookmarkData);
                    await fetchBookmarks();
                    return;
                }
            }

            // If no usable identifier found
            throw new Error('Invalid bookmark data');
        } catch (error) {
            console.error('Error handling bookmark:', error);
            setBookmarkError(error.response?.data?.message || error.message || 'Failed to process bookmark');
        }
    };

    // Change password handler
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setAccountError('');
        setAccountMessage('');

        if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
            setAccountError('All fields are required');
            return;
        }

        if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
            setAccountError('New passwords do not match');
            return;
        }

        try {
            setIsProcessing(true);
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/auth/change-password', changePasswordData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccountMessage('Password changed successfully');
            setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setShowChangePassword(false), 1500);
        } catch (error) {
            setAccountError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsProcessing(false);
        }
    };

    // Delete account handler
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setAccountError('');
        setAccountMessage('');

        if (!deleteAccountPassword) {
            setAccountError('Password is required');
            return;
        }

        if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
            return;
        }

        try {
            setIsProcessing(true);
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5000/api/auth/delete-account', {
                headers: { Authorization: `Bearer ${token}` },
                data: { password: deleteAccountPassword }
            });
            setAccountMessage('Account deleted successfully. Redirecting...');
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }, 2000);
        } catch (error) {
            setAccountError(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsProcessing(false);
        }
    };

    // No client-side filtering needed (search and publishedDate removed)
    const filteredNews = news;

    const readable = (iso) => {
        try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
    };

    const CATEGORIES = ['', 'general', 'business', 'technology', 'entertainment', 'sports', 'science', 'health', 'nation', 'politics', 'startup', 'fun', 'travel'];

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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-300">
                                <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v15a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm.75 1.5a.75.75 0 00-.75.75V19.5a.75.75 0 00.75.75h10.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H6.75zM8.25 15.75A.75.75 0 019 15h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-slate-200">
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

                <div className='mb-10 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md'>
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

                        {/* Right Side: Card-like controls, responsive grid */}
                        <div className="w-full md:w-96">
                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                                <div className="p-3 bg-gradient-to-r from-slate-800/60 to-slate-900 rounded-2xl border border-slate-700 shadow-sm">
                                    <h3 className="text-sm text-slate-300 font-semibold mb-2">Quick Actions</h3>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            aria-label="Copy email"
                                            title="Copy email"
                                            onClick={() => { navigator.clipboard?.writeText(user.email || ''); }}
                                            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 ${exporting ? 'bg-slate-700/60' : 'bg-slate-800 hover:bg-slate-700'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            Copy Email
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                aria-label="Export bookmarks"
                                                title="Export bookmarks"
                                                disabled={exporting}
                                                onClick={async () => {
                                                    try {
                                                        setExporting(true);
                                                        const token = localStorage.getItem('token');
                                                        if (!token) {
                                                            // no token -> force re-login
                                                            console.warn('No auth token found when exporting bookmarks');
                                                            localStorage.removeItem('token');
                                                            localStorage.removeItem('user');
                                                            navigate('/login');
                                                            return;
                                                        }

                                                        const response = await fetch('http://localhost:5000/api/bookmarks/export/excel', {
                                                            method: 'GET',
                                                            headers: {
                                                                Authorization: `Bearer ${token}`,
                                                                Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                            },
                                                        });

                                                        if (response.status === 401) {
                                                            // unauthorized: clear session and redirect to login
                                                            console.warn('Export failed: unauthorized (401)');
                                                            localStorage.removeItem('token');
                                                            localStorage.removeItem('user');
                                                            navigate('/login');
                                                            throw new Error('Unauthorized. Please login again.');
                                                        }

                                                        if (!response.ok) {
                                                            const text = await response.text().catch(() => null);
                                                            throw new Error(text || 'Failed to export bookmarks');
                                                        }

                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'bookmarks.xlsx';
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (e) {
                                                        console.error('Export failed', e);
                                                    } finally {
                                                        setExporting(false);
                                                    }
                                                }}
                                                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 ${exporting ? 'bg-slate-700/60' : 'bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 011-1h4a1 1 0 110 2H5v12h10V4h-3a1 1 0 110-2h4a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" /><path d="M9 7a1 1 0 012 0v5a1 1 0 11-2 0V7z" /></svg>
                                                {exporting ? 'Exporting…' : 'Export Bookmarks in Excel'}
                                            </button>

                                            <button
                                                type="button"
                                                aria-label="Clear all bookmarks"
                                                title="Clear all bookmarks"
                                                disabled={bookmarks.length === 0 || clearing}
                                                onClick={async () => {
                                                    try {
                                                        if (bookmarks.length === 0) return;
                                                        // ask user to confirm destructive action
                                                        if (!window.confirm('Clear all bookmarks? This cannot be undone.')) return;
                                                        setClearing(true);
                                                        for (const b of bookmarks) {
                                                            if (b._id) await removeBookmark(b._id);
                                                        }
                                                        await fetchBookmarks();
                                                    } catch (err) {
                                                        console.error('Failed to clear bookmarks', err);
                                                    } finally {
                                                        setClearing(false);
                                                    }
                                                }}
                                                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm ${bookmarks.length === 0 ? 'bg-slate-800/50 text-slate-500 border border-slate-700' : 'bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800'} focus:outline-none focus:ring-2`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3a1 1 0 00-.894.553L7 5H4a1 1 0 000 2h1v11a2 2 0 002 2h8a2 2 0 002-2V7h1a1 1 0 100-2h-3l-1.106-1.447A1 1 0 0015 3H9zM9 7h6v11H9V7z" /></svg>
                                                {clearing ? 'Clearing…' : 'Clear All Bookmarks'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-sm flex flex-col gap-3">
                                    <h3 className="text-sm text-slate-300 font-semibold">Preferences</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">Dark Mode</p>
                                            <p className="text-xs text-slate-400">Toggle app theme</p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-pressed={settings?.darkMode}
                                            aria-label="Toggle dark mode"
                                            onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${settings?.darkMode ? 'bg-yellow-400 text-slate-900 ring-2 ring-yellow-300' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}
                                        >{settings?.darkMode ? 'On' : 'Off'}</button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">Notifications</p>
                                            <p className="text-xs text-slate-400">In-app updates</p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-pressed={settings?.notifications}
                                            aria-label="Toggle notifications"
                                            onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${settings?.notifications ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}
                                        >{settings?.notifications ? 'On' : 'Off'}</button>
                                    </div>

                                    <button
                                        type="button"
                                        aria-label="Sign out"
                                        title="Sign out"
                                        onClick={async () => {
                                            try {
                                                setSigningOut(true);
                                                setTimeout(() => {
                                                    localStorage.removeItem('token');
                                                    localStorage.removeItem('user');
                                                    setUser({ name: '', email: '' });
                                                    setSigningOut(false);
                                                    navigate('/login');
                                                }, 500);
                                            } catch (e) {
                                                console.error('Sign out failed', e);
                                                setSigningOut(false);
                                            }
                                        }}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 bg-red-600 hover:bg-red-700`}
                                    >{signingOut ? (
                                        <>
                                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path></svg>
                                            Signing out...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h6a1 1 0 110 2H5v10h5a1 1 0 110 2H4a1 1 0 01-1-1V4z" clipRule="evenodd" /><path d="M13.293 7.293a1 1 0 011.414 0L17 9.586V9a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 010-1.414z" /></svg>
                                            Sign Out
                                        </>
                                    )}</button>

                                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                                        <button
                                            type="button"
                                            aria-label="Change password"
                                            onClick={() => { setShowChangePassword(true); setAccountError(''); setAccountMessage(''); }}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 bg-slate-800 hover:bg-slate-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C5.927 1 1 5.927 1 12s4.927 11 11 11 11-4.927 11-11S18.073 1 12 1m5 11h-4v4h-2v-4H7v-2h4V6h2v4h4v2z" /></svg>
                                            Change Password
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Delete account"
                                            onClick={() => { setShowDeleteAccount(true); setAccountError(''); setAccountMessage(''); }}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 bg-slate-800 hover:bg-slate-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H6z" /></svg>
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-span-1 bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 mb-8">
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

                        {(error || bookmarkError || bookmarksError) && (
                            <div className="mt-6 p-4 rounded-xl bg-red-900 text-red-200 border border-red-700">
                                {error || bookmarkError || bookmarksError}
                            </div>
                        )}
                    </section>
                </div>

                <BookmarkDrawer open={isBookmarkOpen} onClose={() => setIsBookmarkOpen(false)} items={bookmarks} />

                {/* Change Password Modal */}
                {showChangePassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangePassword(false)}></div>
                        <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-6 w-11/12 max-w-md mx-4 transform transition-all duration-200 scale-100">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 bg-blue-600 rounded-lg p-3 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-10v2m8 4a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">Change Password</h3>
                                    <p className="text-sm text-slate-400">Update your password. Use a strong, unique password.</p>
                                </div>
                                <button onClick={() => setShowChangePassword(false)} aria-label="Close" className="text-slate-400 hover:text-slate-200 ml-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPwd ? 'text' : 'password'}
                                            value={changePasswordData.currentPassword}
                                            onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPwd ? 'text' : 'password'}
                                            value={changePasswordData.newPassword}
                                            onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    {changePasswordData.newPassword && (
                                        <p className="text-xs text-slate-400 mt-2">Password strength: {changePasswordData.newPassword.length < 8 ? 'Weak' : changePasswordData.newPassword.length < 12 ? 'Medium' : 'Strong'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                                    <input
                                        type={showNewPwd ? 'text' : 'password'}
                                        value={changePasswordData.confirmPassword}
                                        onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                {accountError && <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">{accountError}</div>}
                                {accountMessage && <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">{accountMessage}</div>}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePassword(false)}
                                        className="flex-1 px-4 py-2 rounded-lg text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <svg className="animate-spin h-1 w-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C5.927 1 1 5.927 1 12s4.927 11 11 11 11-4.927 11-11S18.073 1 12 1m5 11h-4v4h-2v-4H7v-2h4V6h2v4h4v2z" /></svg>
                                        )}
                                        <span>{isProcessing ? 'Updating...' : 'Update Password'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteAccount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteAccount(false)}></div>
                        <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-6 w-11/12 max-w-md mx-4 transform transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 bg-red-600 rounded-lg p-3 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a3 3 0 013-3h0a3 3 0 013 3v2" /><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">Delete Account</h3>
                                    <p className="text-sm text-slate-400">This action is irreversible. Your data will be retained only according to our retention policy.</p>
                                </div>
                                <button onClick={() => setShowDeleteAccount(false)} aria-label="Close" className="text-slate-400 hover:text-slate-200 ml-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showDeletePwd ? 'text' : 'password'}
                                            value={deleteAccountPassword}
                                            onChange={(e) => setDeleteAccountPassword(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Enter your password to confirm"
                                        />
                                    </div>
                                </div>

                                {accountError && <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">{accountError}</div>}
                                {accountMessage && <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">{accountMessage}</div>}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteAccount(false)}
                                        className="flex-1 px-4 py-2 rounded-lg text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H6z" /></svg>
                                        )}
                                        <span>{isProcessing ? 'Deleting...' : 'Delete Account'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}