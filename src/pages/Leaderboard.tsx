import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Heart, LayoutGrid, List, Download, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHash, cn } from '../lib/utils';

interface Member {
  id: string;
  name: string;
  photoUrl: string;
  featuredPhotos?: string[];
}

interface PhotoLike {
  photoUrl: string;
  likes: number;
  memberName: string;
  memberPhoto: string;
  photoHash: string;
  memberId: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<PhotoLike[]>([]);
  const [allPhotos, setAllPhotos] = useState<PhotoLike[]>([]);
  const [likedPhotos, setLikedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'feed'>('feed');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoLike | null>(null);

  // Get the most up-to-date data for the selected photo from the allPhotos array
  const currentSelectedPhoto = selectedPhoto 
    ? allPhotos.find(p => p.photoHash === selectedPhoto.photoHash) || selectedPhoto 
    : null;

  useEffect(() => {
    console.log("Setting up real-time leaderboard and feed listeners...");
    
    let members: Member[] = [];
    let likes: any[] = [];

    const updateData = () => {
      const likesMap: Record<string, number> = {};
      likes.forEach(like => {
        const hash = like.photoHash || getHash(like.photoUrl);
        likesMap[hash] = (likesMap[hash] || 0) + 1;
      });

      const photoLikes: PhotoLike[] = [];
      members.forEach(member => {
        member.featuredPhotos?.forEach(photoUrl => {
          const photoHash = getHash(photoUrl);
          photoLikes.push({
            photoUrl,
            likes: likesMap[photoHash] || 0,
            memberName: member.name,
            memberPhoto: member.photoUrl,
            photoHash,
            memberId: member.id
          });
        });
      });

      // Leaderboard: Top 10
      const sorted = [...photoLikes].sort((a, b) => b.likes - a.likes);
      setLeaderboard(sorted.slice(0, 10));

      // Feed: All photos (maybe shuffle or sort by date if available, but for now just all)
      setAllPhotos(photoLikes);
      setLoading(false);
    };

    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      updateData();
    });

    const unsubLikes = onSnapshot(collection(db, 'likes'), (snapshot) => {
      likes = snapshot.docs.map(doc => doc.data());
      
      // Also update current user's likes if logged in
      if (auth.currentUser) {
        const userLikes = snapshot.docs
          .filter(doc => doc.data().userId === auth.currentUser?.uid)
          .map(doc => doc.data().photoHash || getHash(doc.data().photoUrl));
        setLikedPhotos(userLikes);
      }
      
      updateData();
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Re-fetch likes to update likedPhotos for the new user
        const q = query(collection(db, 'likes'), where('userId', '==', user.uid));
        onSnapshot(q, (snapshot) => {
          const userLikes = snapshot.docs.map(doc => doc.data().photoHash || getHash(doc.data().photoUrl));
          setLikedPhotos(userLikes);
        });
      } else {
        setLikedPhotos([]);
      }
    });

    return () => {
      unsubMembers();
      unsubLikes();
      unsubAuth();
    };
  }, []);

  const handleLike = async (item: PhotoLike) => {
    if (!auth.currentUser) {
      alert("Silakan login terlebih dahulu untuk menyukai foto.");
      return;
    }
    
    const likeId = `${auth.currentUser.uid}_${item.photoHash}`;
    const likeRef = doc(db, 'likes', likeId);
    const isLiked = likedPhotos.includes(item.photoHash);
    
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { 
          photoUrl: item.photoUrl, 
          photoHash: item.photoHash,
          userId: auth.currentUser.uid, 
          memberId: item.memberId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    }
  };

  const handleNext = () => {
    if (!currentSelectedPhoto) return;
    const currentIndex = allPhotos.findIndex(p => p.photoHash === currentSelectedPhoto.photoHash);
    if (currentIndex < allPhotos.length - 1) {
      setSelectedPhoto(allPhotos[currentIndex + 1]);
    } else {
      setSelectedPhoto(allPhotos[0]); // Loop to start
    }
  };

  const handlePrev = () => {
    if (!currentSelectedPhoto) return;
    const currentIndex = allPhotos.findIndex(p => p.photoHash === currentSelectedPhoto.photoHash);
    if (currentIndex > 0) {
      setSelectedPhoto(allPhotos[currentIndex - 1]);
    } else {
      setSelectedPhoto(allPhotos[allPhotos.length - 1]); // Loop to end
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedPhoto(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, allPhotos]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">Memuat data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-zinc-950 min-h-screen pt-32 pb-20 px-6 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-accent/10 border border-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest inline-block mb-4"
          >
            Galeri & Peringkat
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-8"
          >
            EKSPLORASI <span className="text-accent">KARYA</span>
          </motion.h1>

          {/* View Toggle */}
          <div className="flex justify-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit mx-auto">
            <button 
              onClick={() => setViewMode('feed')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                viewMode === 'feed' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <LayoutGrid className="w-4 h-4" /> Feed Foto
            </button>
            <button 
              onClick={() => setViewMode('leaderboard')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                viewMode === 'leaderboard' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {viewMode === 'leaderboard' ? (
            <motion.div 
              key="leaderboard"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              layout
              className="max-w-3xl mx-auto space-y-4"
            >
              {leaderboard.map((item, i) => (
                <motion.div 
                  key={item.photoHash}
                  layout
                  variants={itemVariants}
                  className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-accent/50 transition-all group"
                >
                  <div className="text-2xl font-black text-zinc-400 w-12 text-center group-hover:text-accent transition-colors">#{i + 1}</div>
                  <Link to={`/member/${item.memberId}`} className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl">
                    <img 
                      src={item.photoUrl} 
                      alt="Photo" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </Link>
                  <Link to={`/member/${item.memberId}`} className="flex-grow min-w-0 hover:text-accent transition-colors">
                    <p className="font-bold text-zinc-900 dark:text-white truncate" title={item.memberName}>{item.memberName}</p>
                  </Link>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleLike(item)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold shrink-0 transition-all",
                      likedPhotos.includes(item.photoHash) ? "bg-accent text-white" : "bg-accent/10 text-accent hover:bg-accent/20"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", likedPhotos.includes(item.photoHash) && "fill-current")} /> {item.likes}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="feed"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {allPhotos.map((item, i) => (
                <motion.div 
                  key={item.photoHash}
                  variants={itemVariants}
                  className="relative bg-zinc-50 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm hover:shadow-xl transition-all"
                >
                  <button 
                    onClick={() => setSelectedPhoto(item)}
                    className="relative aspect-square overflow-hidden block w-full text-left"
                  >
                    <img 
                      src={item.photoUrl} 
                      alt="Feed" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Maximize2 className="text-white w-8 h-8 scale-50 group-hover:scale-100 transition-transform duration-300" />
                    </div>
                  </button>
                  <button 
                    onClick={() => handleLike(item)}
                    className={cn(
                      "absolute top-4 right-4 p-3 rounded-2xl backdrop-blur-md transition-all active:scale-90 z-10",
                      likedPhotos.includes(item.photoHash) ? "bg-accent text-white" : "bg-white/20 text-white hover:bg-white/40"
                    )}
                  >
                    <Heart className={cn("w-6 h-6", likedPhotos.includes(item.photoHash) && "fill-current")} />
                  </button>
                  <div className="p-6 flex items-center justify-between">
                    <Link to={`/member/${item.memberId}`} className="flex items-center gap-3 min-w-0 hover:text-accent transition-colors group/member">
                      <img src={item.memberPhoto} className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 group-hover/member:border-accent transition-colors" referrerPolicy="no-referrer" />
                      <p className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover/member:text-accent">{item.memberName}</p>
                    </Link>
                    <div className="flex items-center gap-1 text-zinc-400 font-bold text-sm">
                      <Heart className="w-4 h-4 fill-current text-accent" /> {item.likes}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {currentSelectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl aspect-auto max-h-full flex flex-col items-center"
            >
              <div className="absolute top-0 right-0 -translate-y-full mb-4 flex gap-4">
                <button
                  onClick={() => handleDownload(currentSelectedPhoto.photoUrl, `cinegraph-${currentSelectedPhoto.photoHash}.jpg`)}
                  className="p-3 bg-white/10 hover:bg-accent text-white rounded-2xl transition-all flex items-center gap-2 font-bold"
                >
                  <Download className="w-6 h-6" />
                  <span className="hidden md:inline">Download</span>
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 flex items-center justify-center relative group/image">
                <img 
                  src={currentSelectedPhoto.photoUrl} 
                  alt="Full view" 
                  className="max-w-full max-h-[80vh] object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Navigation Buttons */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-accent text-white rounded-full backdrop-blur-md opacity-0 group-hover/image:opacity-100 transition-all active:scale-90"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-accent text-white rounded-full backdrop-blur-md opacity-0 group-hover/image:opacity-100 transition-all active:scale-90"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between w-full px-4">
                <Link 
                  to={`/member/${currentSelectedPhoto.memberId}`}
                  onClick={() => setSelectedPhoto(null)}
                  className="flex items-center gap-4 group"
                >
                  <img src={currentSelectedPhoto.memberPhoto} className="w-12 h-12 rounded-full object-cover border-2 border-accent" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-black text-white text-lg group-hover:text-accent transition-colors">{currentSelectedPhoto.memberName}</p>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Lihat Profil</p>
                  </div>
                </Link>

                <button 
                  onClick={() => handleLike(currentSelectedPhoto)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-95",
                    likedPhotos.includes(currentSelectedPhoto.photoHash) 
                      ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <Heart className={cn("w-6 h-6", likedPhotos.includes(currentSelectedPhoto.photoHash) && "fill-current")} />
                  <span className="font-black text-xl">{currentSelectedPhoto.likes}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
