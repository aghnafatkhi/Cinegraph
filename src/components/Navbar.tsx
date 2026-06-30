import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Menu, X, Film, Users, Image as ImageIcon, Home, User, Sun, Moon, Trophy, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Beranda', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Dokumentasi', path: '/gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Aftermovie', path: '/projects', icon: <Film className="w-4 h-4" /> },
    { isDivider: true, path: 'divider-1' },
    { name: 'Anggota', path: '/members', icon: <Users className="w-4 h-4" /> },
    { name: 'Feed Foto', path: '/leaderboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { name: 'Presensi', path: '/attendance', icon: <Camera className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: <User className="w-4 h-4 text-accent" /> });
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 flex flex-col items-center',
        scrolled ? 'translate-y-0 md:translate-y-2' : 'translate-y-0'
      )}
    >
      <div className="w-full max-w-7xl px-6 py-3 relative isolate">
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300 -z-10',
            (scrolled || isOpen)
              ? 'left-4 right-4 md:left-6 md:right-6 rounded-2xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-100/5 dark:shadow-black/20'
              : 'left-0 right-0 bg-transparent border-transparent'
          )}
        />
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <img 
                src="https://i.imgur.com/qbI4zPO.png" 
                alt="Cinegraph Nepal Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Cinegraph Nepal</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-medium">
                SMAN 1 Cileungsi
              </span>
            </div>
          </Link>
  
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              'isDivider' in link && link.isDivider ? (
                <div key={link.path} className="h-4 w-[1.5px] bg-zinc-200/60 dark:bg-zinc-800/60 mx-1 lg:mx-2" />
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex items-center gap-2 text-xs lg:text-sm font-medium transition-colors hover:text-accent',
                    location.pathname === link.path 
                      ? 'text-accent' 
                      : 'text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              )
            ))}
            
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200/60 dark:border-zinc-800/60">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-accent dark:hover:text-accent transition-all border border-zinc-200/40 dark:border-zinc-800/40 backdrop-blur-sm"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
  
              <Link
                to={user ? (isAdmin ? '/admin' : '/dashboard') : '/login'}
                className="bg-zinc-900/90 dark:bg-white/90 text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white px-4 lg:px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-zinc-850 dark:border-zinc-150 backdrop-blur-sm flex-shrink-0"
              >
                <User className="w-4 h-4" />
                {user ? (isAdmin ? 'Admin Panel' : 'Dashboard') : 'Login Anggota'}
              </Link>
            </div>
          </div>
  
          {/* Mobile Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-accent transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-accent dark:hover:text-white transition-colors"
              aria-label={isOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
  
      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden mt-2 w-[calc(100%-2rem)] mx-auto rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shadow-xl"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link, index) => (
                'isDivider' in link && link.isDivider ? (
                  <div key={link.path} className="h-[1px] w-full bg-zinc-200/40 dark:bg-zinc-800/40 my-1" />
                ) : (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-4 text-base font-semibold transition-colors',
                        location.pathname === link.path 
                          ? 'text-accent' 
                          : 'text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  </motion.div>
                )
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.03 }}
              >
                <Link
                  to={user ? (isAdmin ? '/admin' : '/dashboard') : '/login'}
                  onClick={() => setIsOpen(false)}
                  className="bg-accent text-white px-6 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-3 transition-all shadow-md shadow-accent/20"
                >
                  <User className="w-5 h-5" />
                  {user ? (isAdmin ? 'Admin Panel' : 'Dashboard') : 'Login Anggota'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
