import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';

const roleOrder: Record<string, number> = {
  'komisi': 1,
  'sekbid': 2,
  'ketua': 3,
  'wakil ketua': 4,
  'sekretaris': 5,
  'bendahara': 6,
  'div': 7,
  'anggota': 8
};

const getRolePriority = (role: string) => {
  const normalizedRole = role.toLowerCase();
  for (const [key, value] of Object.entries(roleOrder)) {
    if (normalizedRole.includes(key)) return value;
  }
  return 99; // Default for unknown roles
};

const ALL_SKILLS = [
  'Cinematography', 
  'Directing', 
  'Editing', 
  'Screenwriting', 
  'Lighting', 
  'Sound Design', 
  'Production Design', 
  'Color Grading'
];

interface PortfolioItem {
  title: string;
  link: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  kelas?: string;
  photoUrl: string;
  email?: string;
  instagram?: string;
  phone?: string;
  skills?: string[];
  featuredPhotos?: string[];
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      
      // Sort by role priority first, then by name
      memberData.sort((a, b) => {
        const priorityA = getRolePriority(a.role);
        const priorityB = getRolePriority(b.role);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.name.localeCompare(b.name);
      });

      setMembers(memberData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.kelas && member.kelas.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = !selectedSkill || (member.skills && member.skills.includes(selectedSkill));
    
    return matchesSearch && matchesSkill;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1 mb-3"
          >
            <span className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl bg-gradient-to-r from-accent via-[#FA983A] to-[#E55039] bg-clip-text text-transparent block leading-none font-black py-1">
              ANGGOTA
            </span>
          </motion.div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Kenali lebih dekat para talenta di balik layar Cinegraph Nepal SMAN 1 Cileungsi.
          </p>
        </header>

        {/* Search & Filter Bar */}
        <div className="max-w-4xl mx-auto mb-8 space-y-8">
          <div className="relative group max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Cari nama, role, atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-4 pl-14 pr-6 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {filteredMembers.length} Hasil
              </div>
            )}
          </div>

          {/* Skills Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedSkill(null)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                selectedSkill === null 
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-accent/50"
              )}
            >
              Semua Keahlian
            </button>
            {ALL_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  selectedSkill === skill 
                    ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-accent/50"
                )}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Memuat data tim...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => {
              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/member/${member.id}`)}
                  className="group cursor-pointer rounded-3xl p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all relative flex flex-col justify-between h-[240px] overflow-hidden"
                >
                  {/* Decorative background circle */}
                  <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-all duration-500" />
                  
                  <div>
                    {/* Role Badge and Kelas */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="bg-accent/10 dark:bg-accent/20 border border-accent/25 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider truncate max-w-[150px]" title={member.role}>
                        {member.role}
                      </span>
                      {member.kelas && (
                        <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">
                          {member.kelas}
                        </span>
                      )}
                    </div>

                    {/* Member Name */}
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white capitalize group-hover:text-accent transition-colors line-clamp-2">
                        {member.name}
                      </h3>
                    </div>
                  </div>

                  {/* Skills/Details preview */}
                  <div className="relative z-10 flex flex-wrap gap-1.5 mt-4">
                    {member.skills && member.skills.slice(0, 2).map((skill, i) => (
                      <span key={i} className="text-[10px] bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-zinc-100 dark:border-zinc-700/80">
                        {skill}
                      </span>
                    ))}
                    {(!member.skills || member.skills.length === 0) && (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                        Cinegraph Member
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-zinc-50 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Anggota tidak ditemukan</h3>
            <p className="text-zinc-500">Coba gunakan kata kunci pencarian lain.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
