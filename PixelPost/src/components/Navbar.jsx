import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/output.css';

function Navbar({ publishedDate, setPublishedDate, search, setSearch, category, setCategory }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNav = (cb) => {
        setMenuOpen(false);
        if (cb) cb();
    };

    const hamburgerLine = `h-1 w-6 my-[2px] rounded-full bg-blue-400 transition-all duration-300 ease-in-out`;

    return (
        <nav className="sticky top-0 z-50 w-full bg-slate-900 shadow-xl border-b border-slate-700">
            <div className="flex items-center justify-between py-4 px-6 md:px-8 max-w-7xl mx-auto">
                {/* Logo */}
                <div
                    className="cursor-pointer text-3xl font-extrabold tracking-tight text-blue-400 drop-shadow-md transition-all duration-300 hover:scale-105"
                    onClick={() => handleNav(() => navigate('/'))}
                >
                    PixelPost.
                </div>

                {/* Mobile Menu Toggle Button */}
                <div
                    className="relative z-50 flex h-8 w-8 cursor-pointer flex-col items-center justify-center md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className={`${hamburgerLine} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`${hamburgerLine} ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
                    <span className={`${hamburgerLine} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>

                {/* Filters Section (Desktop & Mobile) */}
                <div className={`
                    absolute top-16 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-md flex flex-col items-start gap-5 transform transition-transform duration-300 ease-in-out
                    md:static md:flex md:flex-row md:items-center md:gap-6 md:p-0 md:bg-transparent md:backdrop-blur-none md:transform-none
                    ${menuOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
                `}>
                    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
                        <input
                            type="date"
                            name="date"
                            id="date"
                            value={publishedDate}
                            placeholder='Filter by date'
                            onChange={(e) => setPublishedDate(e.target.value)}
                            className="w-full md:w-auto min-w-[150px] rounded-full border border-slate-700 bg-slate-800 py-2 px-4 font-medium text-slate-200 shadow-sm transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                            id="category"
                            value={category}
                            onChange={e => { setCategory(e.target.value); }}
                            className="w-full md:w-auto min-w-[150px] rounded-full border border-blue-400 bg-slate-800 py-2 px-4 font-medium text-blue-300 shadow-sm transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="world">World</option>
                            <option value="nation">Nation</option>
                            <option value="business">Business</option>
                            <option value="technology">Technology</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="sports">Sports</option>
                            <option value="science">Science</option>
                            <option value="health">Health</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder='Search for news...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-auto min-w-[350px] rounded-full border border-slate-700 bg-slate-800 py-2 px-4 font-medium text-slate-200 shadow-sm transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;