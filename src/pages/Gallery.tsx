import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Calendar, Search, Image as ImageIcon, Grid, List } from 'lucide-react';
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
}

export default function Gallery() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="bg-accent/10 border border-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
              Dokumentasi Visual
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white">GALERI <span className="text-accent">FOTO</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Kumpulan momen berharga dari berbagai acara di SMAN 1 Cileungsi yang berhasil kami abadikan.
            </p>
          </motion.div>
        </header>

        {/* Search & Filter Bar */}
        <div className="max-w-5xl mx-auto mb-16 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Cari nama acara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="flex-grow md:flex-grow-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all cursor-pointer font-bold"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>

            <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'grid' ? "bg-accent text-white" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'list' ? "bg-accent text-white" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Memuat galeri...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={cn(
            "grid gap-8",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "group bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-accent/30 transition-all relative",
                  viewMode === 'grid' ? "aspect-[4/5]" : "flex flex-col md:flex-row h-auto md:h-64"
                )}
              >
                {/* Image Section */}
                <div className={cn(
                  "relative overflow-hidden",
                  viewMode === 'grid' ? "absolute inset-0" : "w-full md:w-80 h-64 md:h-full"
                )}>
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Gradient Overlay - ONLY for Grid Mode */}
                  {viewMode === 'grid' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  )}
                </div>
                
                {/* Content Section */}
                <div className={cn(
                  "relative h-full w-full",
                  viewMode === 'grid' ? "absolute inset-0" : "flex-grow p-8 flex flex-col justify-center"
                )}>
                  {viewMode === 'grid' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-12 text-center overflow-hidden">
                      <div 
                        className="w-full relative z-10 transition-transform duration-500"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="bg-accent/20 backdrop-blur-md border border-accent/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent">
                            {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-black leading-tight text-white group-hover:text-accent transition-colors duration-500">
                          {event.title}
                        </h3>

                        <div 
                          className="overflow-hidden text-center transition-all duration-500 max-h-40 opacity-100 md:max-h-0 md:opacity-0 md:group-hover:max-h-40 md:group-hover:opacity-100"
                        >
                          <div className="pt-4">
                            <p className="text-zinc-300 text-sm mb-6 line-clamp-2 leading-relaxed">
                              {event.description || "Dokumentasi kegiatan sekolah oleh tim Cinegraph Nepal."}
                            </p>
                            
                            {event.googleDriveLink ? (
                              <a
                                href={event.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-accent hover:bg-white hover:text-accent text-white px-6 py-3 rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-accent/20"
                              >
                                Lihat Galeri <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <div className="inline-block text-zinc-500 text-xs font-bold uppercase tracking-widest bg-white/5 backdrop-blur-md py-2 px-4 rounded-lg border border-white/10">
                                Galeri Belum Tersedia
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* List Mode Content */
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight text-black dark:text-white group-hover:text-accent transition-colors duration-500">
                        {event.title}
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed max-w-2xl">
                        {event.description || "Dokumentasi kegiatan sekolah oleh tim Cinegraph Nepal."}
                      </p>
                      
                      {event.googleDriveLink ? (
                        <a
                          href={event.googleDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-fit inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white px-8 py-3 rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg"
                        >
                          Lihat Galeri <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="w-fit text-zinc-500 text-xs font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          Galeri Belum Tersedia
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tidak ada hasil</h3>
            <p className="text-zinc-500">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
