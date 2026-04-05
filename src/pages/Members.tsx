import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ExternalLink, Briefcase, Award, X } from 'lucide-react';

interface PortfolioItem {
  title: string;
  link: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  skills?: string[];
  portfolio?: PortfolioItem[];
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(memberData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="bg-accent/10 border border-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
              Tim Kreatif Kami
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white">PORTOFOLIO <span className="text-accent">ANGGOTA</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Kenali lebih dekat para talenta di balik layar Cinegraph Nepal SMAN 1 Cileungsi.
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Memuat data tim...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedMember(member)}
                className="group cursor-pointer bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-6 border border-zinc-100 dark:border-zinc-800 hover:border-accent/50 hover:bg-white dark:hover:bg-zinc-900/80 transition-all text-center shadow-sm hover:shadow-xl"
              >
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-accent rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full border-4 border-zinc-100 dark:border-zinc-800 group-hover:border-accent transition-colors relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white group-hover:text-accent transition-colors">{member.name}</h3>
                <p className="text-zinc-500 dark:text-zinc-500 text-sm font-medium uppercase tracking-widest mb-6">{member.role}</p>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {member.skills?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                      {skill}
                    </span>
                  ))}
                </div>
                <button className="w-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-accent text-zinc-900 dark:text-white group-hover:text-white py-3 rounded-2xl font-bold text-sm transition-all">
                  Lihat Portofolio
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Member Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl z-10"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-accent rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5 text-zinc-900 dark:text-white" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-5">
                <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-800/50 p-10 flex flex-col items-center text-center">
                  <img
                    src={selectedMember.photoUrl}
                    alt={selectedMember.name}
                    className="w-40 h-40 object-cover rounded-3xl border-4 border-white dark:border-zinc-900 mb-6 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <h2 className="text-2xl font-black mb-1 text-zinc-900 dark:text-white">{selectedMember.name}</h2>
                  <p className="text-accent font-bold text-sm uppercase tracking-widest mb-6">{selectedMember.role}</p>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedMember.skills?.map((skill, i) => (
                      <span key={i} className="text-[10px] bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-zinc-100 dark:border-zinc-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3 p-10">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Briefcase className="w-5 h-5 text-accent" />
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Hasil Pekerjaan</h3>
                    </div>
                    <div className="space-y-4">
                      {selectedMember.portfolio && selectedMember.portfolio.length > 0 ? (
                        selectedMember.portfolio.map((item, i) => (
                          <a
                            key={i}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl transition-all group"
                          >
                            <span className="font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-accent transition-colors">{item.title}</span>
                            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-accent transition-colors" />
                          </a>
                        ))
                      ) : (
                        <p className="text-zinc-400 dark:text-zinc-600 text-sm italic">Belum ada item portofolio.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-5 h-5 text-accent" />
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tentang</h3>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-500 text-sm leading-relaxed">
                      Anggota aktif Cinegraph Nepal SMAN 1 Cileungsi yang berfokus pada bidang {selectedMember.role}. Berkontribusi dalam berbagai project kreatif sekolah.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
