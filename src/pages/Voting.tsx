import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Heart, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface IndividualWork {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  link: string;
  thumbnailUrl?: string;
  votes: number;
}

export default function Voting() {
  const [works, setWorks] = useState<IndividualWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const voteDoc = await getDoc(doc(db, 'user_votes', u.uid));
        if (voteDoc.exists()) {
          setUserVote(voteDoc.data().workId);
        }
      }
    });

    const unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const allWorks: IndividualWork[] = [];
      snapshot.docs.forEach(memberDoc => {
        const memberData = memberDoc.data();
        if (memberData.portfolio && Array.isArray(memberData.portfolio)) {
          memberData.portfolio.forEach((item: any) => {
            allWorks.push({
              id: item.id,
              memberId: memberDoc.id,
              memberName: memberData.name,
              title: item.title,
              link: item.link,
              thumbnailUrl: item.thumbnailUrl || `https://picsum.photos/seed/${item.id}/400/225`,
              votes: item.votes || 0
            });
          });
        }
      });
      
      // Sort by votes descending
      allWorks.sort((a, b) => b.votes - a.votes);
      setWorks(allWorks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members for voting:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMembers();
    };
  }, []);

  const handleVote = async (workId: string, memberId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (userVote) {
      setMessage({ type: 'error', text: 'Anda sudah memberikan suara bulan ini!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      // 1. Record the user's vote
      await setDoc(doc(db, 'user_votes', user.uid), {
        workId,
        timestamp: serverTimestamp()
      });

      // 2. Increment the vote count in the member's portfolio
      const memberRef = doc(db, 'members', memberId);
      const memberDoc = await getDoc(memberRef);
      if (memberDoc.exists()) {
        const portfolio = memberDoc.data().portfolio || [];
        const updatedPortfolio = portfolio.map((item: any) => {
          if (item.id === workId) {
            return { ...item, votes: (item.votes || 0) + 1 };
          }
          return item;
        });
        await updateDoc(memberRef, { portfolio: updatedPortfolio });
      }

      setUserVote(workId);
      setMessage({ type: 'success', text: 'Terima kasih atas suara Anda!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error voting:", error);
      setMessage({ type: 'error', text: 'Gagal memberikan suara: ' + error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 font-sans transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="bg-accent/10 border border-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
              Karya Individu Terbaik
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">VOTING <span className="text-accent">KARYA</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Dukung karya individu favoritmu dari para anggota Cinegraph Nepal!
            </p>
          </motion.div>
        </header>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-md mx-auto mb-8 p-4 rounded-xl flex items-center gap-3 font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border transition-all relative group ${userVote === work.id ? 'border-accent shadow-lg shadow-accent/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-accent/50'}`}
            >
              {index === 0 && work.votes > 0 ? (
                <div className="absolute top-4 left-4 z-20 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Trophy className="w-3 h-3" /> Peringkat 1
                </div>
              ) : null}

              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={work.thumbnailUrl} 
                  alt={work.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-1 block">
                      Karya {work.memberName}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">{work.title}</h3>
                  </div>
                  <div className="flex flex-col items-center bg-black/50 backdrop-blur-md rounded-xl p-2 border border-white/10">
                    <Heart className={`w-5 h-5 ${userVote === work.id ? 'text-accent fill-accent' : 'text-white'}`} />
                    <span className="text-white font-bold text-sm">{work.votes}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <a 
                  href={work.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-accent transition-colors"
                >
                  Lihat Karya <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleVote(work.id, work.memberId)}
                  disabled={!!userVote}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                    userVote === work.id 
                      ? 'bg-accent text-white' 
                      : userVote 
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                        : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white'
                  }`}
                >
                  {userVote === work.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Suara Anda
                    </>
                  ) : userVote ? (
                    'Sudah Memilih'
                  ) : (
                    <>
                      <Heart className="w-4 h-4" /> Vote Karya Ini
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
