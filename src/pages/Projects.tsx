import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Play, Film, X, Info, ExternalLink, Copy, Check, Youtube, Search } from 'lucide-react';

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

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      // Merge with default YouTube projects without duplicate video links or titles
      const combined = [...projectData];
      DEFAULT_YOUTUBE_PROJECTS.forEach(defaultProj => {
        const alreadyExists = projectData.some(p => 
          p.videoUrl === defaultProj.videoUrl || 
          p.title.toLowerCase() === defaultProj.title.toLowerCase()
        );
        if (!alreadyExists) {
          combined.push(defaultProj);
        }
      });

      // Filter to keep ONLY valid YouTube links
      const youtubeOnly = combined.filter(p => getYoutubeId(p.videoUrl) !== null);

      // Sort the combined list
      if (sortBy === 'oldest') {
        youtubeOnly.sort((a, b) => {
          const isAYt = a.id.startsWith('yt-');
          const isBYt = b.id.startsWith('yt-');
          if (isAYt && !isBYt) return -1; // oldest presets first
          if (!isAYt && isBYt) return 1;
          
          if (isAYt && isBYt) {
            const indexA = DEFAULT_YOUTUBE_PROJECTS.findIndex(p => p.id === a.id);
            const indexB = DEFAULT_YOUTUBE_PROJECTS.findIndex(p => p.id === b.id);
            return indexB - indexA; // reverse order of presets
          }
          return a.id.localeCompare(b.id);
        });
      } else {
        // newest (default) - real firebase projects first, then presets in newest-to-oldest order
        youtubeOnly.sort((a, b) => {
          const isAYt = a.id.startsWith('yt-');
          const isBYt = b.id.startsWith('yt-');
          if (isAYt && !isBYt) return 1;
          if (!isAYt && isBYt) return -1;
          
          if (isAYt && isBYt) {
            const indexA = DEFAULT_YOUTUBE_PROJECTS.findIndex(p => p.id === a.id);
            const indexB = DEFAULT_YOUTUBE_PROJECTS.findIndex(p => p.id === b.id);
            return indexA - indexB;
          }
          return b.id.localeCompare(a.id);
        });
      }

      setProjects(youtubeOnly);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      const defaultYt = DEFAULT_YOUTUBE_PROJECTS.filter(p => getYoutubeId(p.videoUrl) !== null);
      setProjects(defaultYt);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

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
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 transition-colors duration-300"
    >
      <Helmet>
        <title>Aftermovie - Cinegraph Nepal</title>
        <meta name="description" content="Tonton kumpulan aftermovie acara dan kegiatan SMAN 1 Cileungsi hasil produksi Cinegraph Nepal." />
        <meta property="og:title" content="Aftermovie - Cinegraph Nepal" />
        <meta property="og:description" content="Koleksi aftermovie terbaik dari siswa SMAN 1 Cileungsi." />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1 mb-3"
          >
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl bg-gradient-to-r from-accent via-[#FA983A] to-[#E55039] bg-clip-text text-transparent block leading-none font-black py-1">
              AFTERMOVIE
            </h1>
          </motion.div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4">
            Kumpulan aftermovie kolaborasi tim Cinegraph Nepal SMAN 1 Cileungsi.
          </p>
        </header>

        {/* Search & Sort Filter */}
        <div className="flex flex-row justify-center items-center gap-2 mb-8 max-w-2xl mx-auto w-full px-4">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari aftermovie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 pl-11 pr-4 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-accent transition-all h-[44px]"
            />
          </div>
          
          {/* Sort dropdown */}
          <div className="shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 px-3 sm:px-4 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all cursor-pointer font-bold h-[44px]"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Memuat aftermovie...</p>
          </div>
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
                <div className="p-6 md:p-8 flex flex-col flex-grow justify-between">
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

      {/* Video Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div
            onClick={() => setSelectedProject(null)}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl z-10"
          >
              <button
                onClick={() => setSelectedProject(null)}
                aria-label="Tutup Video"
                className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-accent rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5 text-zinc-900 dark:text-white" />
              </button>

              <div className="flex flex-col">
                <div className="aspect-video bg-black relative">
                  {/* Video Embed Logic (Simple iframe for YouTube/Drive) */}
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
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <div className="text-accent font-bold text-xs uppercase tracking-widest mb-2">{selectedProject.category}</div>
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{selectedProject.title}</h2>
                    </div>
                    <a 
                      href={selectedProject.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-all shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka di YouTube
                    </a>
                    <button 
                      onClick={() => handleCopyLink(selectedProject.videoUrl)}
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-all shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Tersalin!' : 'Salin Link'}
                    </button>
                  </div>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-8" />
                  <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                    {selectedProject.description || "Aftermovie ini merupakan hasil kolaborasi tim Cinegraph Nepal SMAN 1 Cileungsi dalam mengeksplorasi teknik sinematografi dan storytelling visual."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
