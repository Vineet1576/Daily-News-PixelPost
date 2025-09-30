import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../style/output.css';

function Navbar({ publishedDate, setPublishedDate, search, setSearch, category, setCategory }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNav = (cb) => {
        setMenuOpen(false);
        if (cb) cb();
    };

    const hamburgerLine = `h-1 w-6 my-[2px] rounded-full bg-blue-400 transition-all duration-300 ease-in-out`;

    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/profile", label: "Profile" },
        { path: "/login", label: "Login" },
    ];

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

                {/* Desktop Links */}
                <div className="hidden md:flex gap-6 items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="text-white font-semibold hover:text-blue-400 transition"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Hamburger Icon (mobile) */}
                <div
                    className="relative z-50 flex h-8 w-8 cursor-pointer flex-col items-center justify-center md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className={`${hamburgerLine} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`${hamburgerLine} ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
                    <span className={`${hamburgerLine} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>

                {/* Mobile Dropdown */}
                <div
                    className={`
            absolute top-16 left-0 right-0 px-6 py-6 bg-slate-900/95 backdrop-blur-md flex flex-col items-center gap-6
            transform transition-all duration-300 ease-in-out md:hidden
            ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}
          `}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMenuOpen(false)}
                            className="text-white font-semibold hover:text-blue-400 transition text-lg"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;