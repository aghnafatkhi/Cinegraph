import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Play, Film, X, Info, ExternalLink, Copy, Check, Youtube, Search, ArrowLeft, Calendar, Share2, ChevronDown } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';

interface Project {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  category?: string;
}

const DEFAULT_YOUTUBE_PROJECTS: Project[] = [
  {
    id: "yt-pesantren-ekologi-2026",
    title: "Aftermovie Pesantren Ekologi 2026",
    description: "Aftermovie Pesantren Ekologi 2026 SMAN 1 Cileungsi yang menghadirkan momen penuh pembelajaran spiritual dan kepedulian terhadap lingkungan. Seluruh video diproduksi oleh tim Cinematography SMAN 1 Cileungsi.",
    videoUrl: "https://www.youtube.com/watch?v=iB_S9Qi6Lqs",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-isra-miraj-2026",
    title: "Aftermovie Isra Mi'raj 2026",
    description: "Rangkaian momen penuh kebersamaan, makna, dan spiritualitas dalam peringatan Isra Mi’raj Nabi Muhammad SAW di SMAN 1 Cileungsi.",
    videoUrl: "https://www.youtube.com/watch?v=HCPImsDK4FA",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-hari-guru-2025",
    title: "Aftermovie Hari Guru 2025",
    description: "Momen penuh kebersamaan, haru, dan tawa dalam perayaan Hari Guru 2025 di SMAN 1 Cileungsi sebagai bentuk apresiasi kepada pahlawan tanpa tanda jasa.",
    videoUrl: "https://www.youtube.com/watch?v=NXtrw8SyXU4",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-pesan-guru-2025",
    title: "Pesan Siswa/i untuk para Guru pada Hari Guru 2025",
    description: "Video ucapan terima kasih tulus dan ungkapan rasa hormat dari para siswa-siswi SMAN 1 Cileungsi untuk bapak dan ibu guru.",
    videoUrl: "https://www.youtube.com/watch?v=wvOlbs9WbcM",
    thumbnailUrl: "",
    category: "Dokumentasi"
  },
  {
    id: "yt-alumni-guru-2025",
    title: "Ucapan Alumni untuk Guru pada Hari Guru 2025",
    description: "Pesan penuh rindu, terima kasih, dan dedikasi dari para alumni SMAN 1 Cileungsi untuk guru-guru yang telah membentuk masa depan mereka.",
    videoUrl: "https://www.youtube.com/watch?v=VfGSq5ohqTo",
    thumbnailUrl: "",
    category: "Dokumentasi"
  },
  {
    id: "yt-skulprize-prambors",
    title: "Radio Prambors dengan Kao menghadiri Nepal dalam kegiatan SKULPRIZE",
    description: "Keseruan dan semangat kreativitas siswa-siswi SMAN 1 Cileungsi (Nepal) saat didatangi tim Radio Prambors dan Kao dalam ajang SKULPRIZE.",
    videoUrl: "https://www.youtube.com/watch?v=DyANhfFhVCE",
    thumbnailUrl: "",
    category: "Kegiatan"
  },
  {
    id: "yt-festival-unggulan-2026",
    title: "Festival Pelajaran Unggulan 2026",
    description: "Dokumentasi perayaan kreativitas akademis dan non-akademis siswa-siswi SMAN 1 Cileungsi dalam Festival Pelajaran Unggulan 2026.",
    videoUrl: "https://www.youtube.com/watch?v=01zx0yJHOvM",
    thumbnailUrl: "",
    category: "Dokumentasi"
  },
  {
    id: "yt-kartini-2026",
    title: "Aftermovie Hari Kartini 2026",
    description: "Semarak emansipasi, kebersamaan, dan kreativitas siswa-siswi dalam merayakan Hari Kartini 2026 di lingkungan SMAN 1 Cileungsi.",
    videoUrl: "https://www.youtube.com/watch?v=roJYvrsi59s",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-revitalisasi-2025",
    title: "Revitalisasi Satuan Pendidikan - SMAN 1 Cileungsi",
    description: "Dokumentasi resmi perjalanan revitalisasi sarana dan prasarana pendidikan SMAN 1 Cileungsi demi menunjang kenyamanan belajar mengajar.",
    videoUrl: "https://www.youtube.com/watch?v=Qto5VxBJkZQ",
    thumbnailUrl: "",
    category: "Dokumentasi"
  },
  {
    id: "yt-alteration-2",
    title: "ALTERATION 2.0 (2020): Official Aftermovie at SMAN 1 Cileungsi",
    description: "Official aftermovie of ALTERATION 2.0 (2020) at SMAN 1 Cileungsi, captured and edited by the Cinematography Extracurricular (Cinegraph Nepal).",
    videoUrl: "https://www.youtube.com/watch?v=sSNFxCIwf0U",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-alteration-2019",
    title: "ALTERATION 2019 : Official Aftermovie at SMAN 1 CILEUNGSI",
    description: "Official aftermovie of ALTERATION 2019 at SMAN 1 Cileungsi, organized and recorded by Cinegraph Nepal.",
    videoUrl: "https://www.youtube.com/watch?v=k8007P9K1ZQ",
    thumbnailUrl: "",
    category: "Aftermovie"
  },
  {
    id: "yt-angkatan-22",
    title: "SMAN 1 CILEUNGSI - [ VIDEO DOKUMENTER ANGKATAN 22 ]",
    description: "Video dokumentasi pelepasan dan kelulusan siswa-siswi kelas XII SMAN 1 Cileungsi Angkatan 22.",
    videoUrl: "https://www.youtube.com/watch?v=Au9_jBUQuAU",
    thumbnailUrl: "",
    category: "Dokumentasi"
  }
];

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getYoutubeThumbnail(url: string, fallbackUrl?: string): string {
  const videoId = getYoutubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return fallbackUrl || "https://picsum.photos/seed/cinema/800/450";
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [copied, setCopied] = useState(false);
  const [liveYtVideos, setLiveYtVideos] = useState<Project[]>([]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch live YouTube videos from server endpoint
  useEffect(() => {
    let isMounted = true;
    fetch('/api/youtube-videos')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch YouTube videos");
        return res.json();
      })
      .then((data: Project[]) => {
        if (isMounted && Array.isArray(data)) {
          setLiveYtVideos(data);
        }
      })
      .catch(err => {
        console.warn("Could not load live YouTube RSS feed:", err);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Build unified list starting with live YouTube RSS videos
      const combined: Project[] = [...liveYtVideos];

      // Helper to check if a video already exists in combined list
      const isDuplicate = (p: Project) => {
        const id1 = getYoutubeId(p.videoUrl);
        return combined.some(item => {
          const id2 = getYoutubeId(item.videoUrl);
          if (id1 && id2 && id1 === id2) return true;
          return item.title.toLowerCase().trim() === p.title.toLowerCase().trim();
        });
      };

      // Add database projects if not duplicate
      dbProjects.forEach(p => {
        if (!isDuplicate(p)) {
          combined.push(p);
        }
      });

      // Add preset fallback projects if not duplicate
      DEFAULT_YOUTUBE_PROJECTS.forEach(defaultProj => {
        if (!isDuplicate(defaultProj)) {
          combined.push(defaultProj);
        }
      });

      // Filter to keep ONLY valid YouTube links
      const youtubeOnly = combined.filter(p => getYoutubeId(p.videoUrl) !== null);

      // Sort
      youtubeOnly.sort((a, b) => {
        const dateA = (a as any).publishedAt ? new Date((a as any).publishedAt).getTime() : 0;
        const dateB = (b as any).publishedAt ? new Date((b as any).publishedAt).getTime() : 0;

        if (sortBy === 'oldest') {
          if (dateA > 0 && dateB > 0) return dateA - dateB;
          if (dateA > 0) return 1;
          if (dateB > 0) return -1;
          return a.id.localeCompare(b.id);
        } else {
          // newest
          if (dateA > 0 && dateB > 0) return dateB - dateA;
          if (dateA > 0) return -1;
          if (dateB > 0) return 1;
          return b.id.localeCompare(a.id);
        }
      });

      setProjects(youtubeOnly);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects from Firestore:", error);
      const combined = [...liveYtVideos];
      DEFAULT_YOUTUBE_PROJECTS.forEach(d => {
        const id1 = getYoutubeId(d.videoUrl);
        if (!combined.some(c => getYoutubeId(c.videoUrl) === id1)) {
          combined.push(d);
        }
      });
      setProjects(combined);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy, liveYtVideos]);

  const filteredProjects = projects.filter(p => {
    const queryStr = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(queryStr) || 
           (p.description && p.description.toLowerCase().includes(queryStr));
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-4 sm:px-6 transition-colors duration-300"
    >
      <Helmet>
        <title>Aftermovie - Cinegraph Nepal</title>
        <meta name="description" content="Tonton kumpulan aftermovie acara dan kegiatan SMAN 1 Cileungsi hasil produksi Cinegraph Nepal." />
        <meta property="og:title" content="Aftermovie - Cinegraph Nepal" />
        <meta property="og:description" content="Koleksi aftermovie terbaik dari siswa SMAN 1 Cileungsi." />
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
                AFTERMOVIE
              </span>
            </h1>
          </motion.div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-xs sm:text-base leading-relaxed px-2">
            Kumpulan aftermovie kolaborasi tim Cinegraph Nepal SMAN 1 Cileungsi.
          </p>
        </header>

        {/* Search & Sort Filter */}
        <div className="flex flex-row justify-center items-center gap-2 mb-6 sm:mb-8 max-w-2xl mx-auto w-full">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari aftermovie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-accent transition-all h-[40px] sm:h-[44px]"
            />
          </div>
          
          {/* Sort dropdown */}
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

        {loading ? (
          <GridSkeleton count={6} type="card" />
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedProject(project)}
                className="group relative bg-zinc-50 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:border-accent/50 transition-all shadow-xl hover:shadow-2xl flex flex-col h-full cursor-pointer"
              >
                <div className="relative aspect-video w-full overflow-hidden shrink-0 bg-zinc-950">
                  <img
                    src={getYoutubeThumbnail(project.videoUrl, project.thumbnailUrl)}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-accent p-4 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                      <Play className="w-6 h-6 fill-current text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-5 md:p-8 flex flex-col flex-grow justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2">{project.title}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3 leading-relaxed">
                      {project.description || "Aftermovie acara karya tim Cinematography SMAN 1 Cileungsi."}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-zinc-50 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Film className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Belum ada aftermovie</h2>
            <p className="text-zinc-500">Aftermovie akan segera hadir di sini.</p>
          </div>
        )}
      </div>

      {/* Video Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              {/* Sticky Top Bar / Back Button Header */}
              <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-accent hover:text-zinc-950 text-zinc-800 dark:text-zinc-200 font-bold text-xs md:text-sm rounded-xl transition-all shadow-xs group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Kembali ke Daftar</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-xs text-zinc-400 font-medium truncate max-w-[200px]">
                    {selectedProject.title}
                  </span>
                  <button
                    onClick={() => setSelectedProject(null)}
                    aria-label="Tutup Detail Video"
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto flex-1">
                {/* Video Player */}
                <div className="aspect-video w-full bg-black relative shrink-0">
                  <iframe
                    src={(() => {
                      const ytId = getYoutubeId(selectedProject.videoUrl);
                      if (ytId) {
                        return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
                      }
                      const url = selectedProject.videoUrl;
                      if (url.includes('drive.google.com')) {
                        return url.replace('/view', '/preview');
                      }
                      return url;
                    })()}
                    title={selectedProject.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>

                {/* Video Meta & Details */}
                <div className="p-6 sm:p-8 md:p-10">
                  {/* Date Metadata */}
                  {(selectedProject as any).publishedAt && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-700/60">
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                        {new Date((selectedProject as any).publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Title & Action Buttons Row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-snug">
                        {selectedProject.title}
                      </h2>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 font-medium">
                        Diproduksi oleh Tim Cinegraph Nepal • SMAN 1 Cileungsi
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <a
                        href={selectedProject.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                      >
                        <Youtube className="w-4 h-4 fill-current" />
                        <span>Buka di YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>

                      <button
                        onClick={() => handleCopyLink(selectedProject.videoUrl)}
                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 my-6" />

                  {/* Description Section */}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-accent" />
                      Deskripsi Video
                    </h3>
                    <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-line font-normal">
                      {selectedProject.description || "Aftermovie ini merupakan hasil kolaborasi tim Cinegraph Nepal SMAN 1 Cileungsi dalam mengeksplorasi teknik sinematografi dan storytelling visual."}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
