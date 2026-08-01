import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Calendar, Search, Image as ImageIcon, Grid, List, Heart, MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  coverImage: string;
  googleDriveLink?: string;
  category?: string;
}

export default function Gallery() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('Semua Tahun');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', sortBy === 'newest' ? 'desc' : 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

  const years = ['Semua Tahun', ...new Set(events.map(event => new Date(event.date).getFullYear().toString()))].sort((a, b) => b.localeCompare(a));

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'Semua Tahun' || new Date(event.date).getFullYear().toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-24 sm:pt-32 pb-20 px-3 sm:px-6 transition-colors duration-300"
    >
      <Helmet>
        <title>Dokumentasi - Cinegraph Nepal</title>
        <meta name="description" content="Lihat kumpulan dokumentasi acara dan kegiatan SMAN 1 Cileungsi yang diabadikan oleh tim Cinegraph Nepal." />
        <meta property="og:title" content="Dokumentasi - Cinegraph Nepal" />
        <meta property="og:description" content="Kumpulan momen berharga di SMAN 1 Cileungsi dalam lensa Cinegraph Nepal." />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1 mb-2 sm:mb-3"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight py-1">
              <span className="bg-gradient-to-r from-accent via-[#FA983A] to-[#E55039] bg-clip-text text-transparent inline-block">
                DOKUMENTASI
              </span>
            </h1>
          </motion.div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-xs sm:text-base leading-relaxed px-2">
            Kumpulan momen berharga dari berbagai acara di SMAN 1 Cileungsi yang berhasil kami abadikan.
          </p>
        </header>

        {/* Search & Filter Bar */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2.5">
          {/* Row 1: Search Bar & View Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="relative flex-grow group">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-accent w-4 h-4 transition-colors" />
              <input
                type="text"
                placeholder="Cari acara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-[40px] sm:h-[44px]"
              />
            </div>

            {/* View switcher */}
            <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-1 shrink-0 h-[40px] sm:h-[44px] items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all h-full flex items-center justify-center",
                  viewMode === 'grid' ? "bg-accent text-white shadow-xs" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
                aria-label="Grid View"
              >
                <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all h-full flex items-center justify-center",
                  viewMode === 'list' ? "bg-accent text-white shadow-xs" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
                aria-label="List View"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: Year Filter & Sort Selection */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
            {/* Year Filter */}
            <div className="flex items-center gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl overflow-x-auto custom-scrollbar-hide h-[40px] sm:h-[44px] shrink min-w-0">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0",
                    selectedYear === year 
                      ? "bg-accent text-white shadow-xs" 
                      : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {year === 'Semua Tahun' ? 'Semua' : year}
                </button>
              ))}
            </div>

            {/* Sort Selection */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl py-2 pl-3 sm:pl-4 pr-8 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all cursor-pointer font-bold h-[40px] sm:h-[44px] appearance-none"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <GridSkeleton count={6} type={viewMode === 'grid' ? 'card' : 'list'} />
        ) : (
          <div 
            className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
                : "flex flex-col gap-2.5 sm:gap-3 md:gap-4"
            )}
          >
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3,
                  ease: "easeOut"
                }}
                whileHover={{ y: viewMode === 'grid' ? -5 : -2 }}
                className={cn(
                  "group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-accent/40 transition-all relative shadow-xs hover:shadow-md overflow-hidden",
                  viewMode === 'grid' 
                    ? "rounded-[2.5rem] aspect-[4/5] shadow-lg hover:shadow-2xl" 
                    : "rounded-xl sm:rounded-2xl md:rounded-3xl flex flex-row items-center p-2.5 sm:p-3.5 md:p-5 gap-3 sm:gap-4 md:gap-6"
                )}
              >
                {viewMode === 'grid' ? (
                  /* GRID MODE */
                  <>
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-end h-full p-6 md:p-10 text-center">
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="bg-accent/20 backdrop-blur-md border border-accent/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent">
                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>

                        <h2 className="text-xl md:text-3xl font-black leading-tight text-white group-hover:text-accent transition-colors duration-500">
                          {event.title}
                        </h2>

                        <div className="overflow-hidden text-center transition-all duration-500 max-h-40 opacity-100 md:max-h-0 md:opacity-0 md:group-hover:max-h-40 md:group-hover:opacity-100">
                          <div className="pt-3">
                            <p className="text-zinc-300 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                              {event.description || "Dokumentasi kegiatan sekolah oleh tim Cinegraph Nepal."}
                            </p>

                            {event.googleDriveLink ? (
                              <a
                                href={`/halaman-transisi.html?url=${encodeURIComponent(event.googleDriveLink)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-accent hover:bg-white hover:text-accent text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 shadow-lg shadow-accent/20"
                              >
                                Lihat Dokumentasi <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <div className="inline-block text-zinc-400 text-[10px] font-bold uppercase tracking-widest bg-white/5 backdrop-blur-md py-1.5 px-3 rounded-lg border border-white/10">
                                Dokumentasi Belum Tersedia
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* LIST MODE - COMPACT & SPACE EFFICIENT FOR MOBILE */
                  <>
                    {/* Compact Image Thumbnail */}
                    <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-56 md:h-36 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 sm:py-1">
                      <div>
                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-accent tracking-wider uppercase mb-0.5 sm:mb-1">
                          <Calendar className="w-3 h-3 text-accent shrink-0" />
                          <span>
                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-sm sm:text-base md:text-xl font-extrabold leading-snug text-zinc-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2">
                          {event.title}
                        </h2>

                        {/* Description (visible on sm+) */}
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm line-clamp-1 hidden sm:block mt-1">
                          {event.description || "Dokumentasi kegiatan sekolah oleh tim Cinegraph Nepal."}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                        {event.googleDriveLink ? (
                          <a
                            href={`/halaman-transisi.html?url=${encodeURIComponent(event.googleDriveLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-2 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold transition-all active:scale-95 shadow-xs"
                          >
                            <span>Lihat Dokumentasi</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 italic">
                            Belum Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-zinc-50 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Tidak ada hasil</h2>
          <p className="text-zinc-500">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      )}

      <section className="mt-32 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-accent to-accent/60 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-accent/20">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <Heart className="w-64 h-64 -rotate-12 -translate-x-10 -translate-y-10 text-white fill-current" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 relative z-10 text-white uppercase">DUKUNG KREATIVITAS KAMI</h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Bantu kami terus berkarya dan mendokumentasikan setiap momen berharga dengan memberikan dukungan melalui Saweria.
          </p>
          <a
            href="https://saweria.co/cinegraphnepal"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-accent px-10 py-5 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all inline-flex items-center gap-3 relative z-10 shadow-xl active:scale-95"
          >
            <Heart className="w-6 h-6 fill-current" />
            Support Kami di Saweria
          </a>
        </div>
      </section>
    </div>
  </motion.div>
  );
}
