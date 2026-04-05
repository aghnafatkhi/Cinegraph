import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Briefcase, Award, Instagram, Phone, Mail, Youtube, Video, Calendar, Camera, Heart } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  link: string;
  thumbnailUrl?: string;
  votes?: number;
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
  portfolio?: PortfolioItem[];
  bio?: string;
  joinYear?: string;
  tiktok?: string;
  youtube?: string;
  favoriteGear?: string;
  featuredPhotos?: string[];
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'members', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMember({ id: docSnap.id, ...docSnap.data() } as Member);
        } else {
          console.log("No such member!");
        }
      } catch (error) {
        console.error("Error fetching member:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">Memuat profil anggota...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Anggota tidak ditemukan</h2>
        <button onClick={() => navigate('/members')} className="text-accent hover:underline">Kembali ke daftar anggota</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 text-zinc-500 hover:text-accent font-bold mb-10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column - Profile Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-8 flex flex-col items-center text-center border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute top-0 left-0 w-full h-40 bg-[#F59E0B] opacity-20"></div>
              
              <div className="relative w-48 h-48 mb-6 z-10">
                <div className="absolute inset-0 bg-accent rounded-full blur-2xl opacity-20" />
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full border-4 border-white dark:border-zinc-900 relative z-10 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white relative z-10 capitalize">{member.name}</h1>
              <p className="text-accent font-bold text-sm uppercase tracking-widest mb-2 relative z-10">{member.role}</p>
              {member.kelas && (
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mb-8 relative z-10">{member.kelas}</p>
              )}
              {!member.kelas && <div className="mb-8"></div>}
              
              <div className="flex flex-col gap-3 w-full mb-8 relative z-10">
                {member.instagram && (
                  <a href={`https://instagram.com/${member.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-accent hover:text-white text-zinc-600 dark:text-zinc-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <Instagram className="w-5 h-5" /> @{member.instagram}
                  </a>
                )}
                {member.tiktok && (
                  <a href={`https://tiktok.com/@${member.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-black hover:text-white text-zinc-600 dark:text-zinc-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <Video className="w-5 h-5" /> @{member.tiktok}
                  </a>
                )}
                {member.youtube && (
                  <a href={member.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-600 dark:text-zinc-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <Youtube className="w-5 h-5" /> YouTube
                  </a>
                )}
                {member.phone && (
                  <a href={`https://wa.me/${member.phone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-green-500 hover:text-white text-zinc-600 dark:text-zinc-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <Phone className="w-5 h-5" /> {member.phone}
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-blue-500 hover:text-white text-zinc-600 dark:text-zinc-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <Mail className="w-5 h-5" /> Email
                  </a>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 relative z-10">
                {member.skills?.map((skill, i) => (
                  <span key={i} className="text-xs bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-4 py-2 rounded-full font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 space-y-10"
          >
            {/* About Section */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Tentang</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-6">
                {member.bio || `Anggota aktif Cinegraph Nepal SMAN 1 Cileungsi yang berfokus pada bidang ${member.role}. Berkontribusi dalam berbagai project kreatif sekolah dan terus mengembangkan kemampuan di bidang sinematografi.`}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                {member.joinYear && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bergabung Sejak</p>
                      <p className="text-zinc-900 dark:text-white font-medium">{member.joinYear}</p>
                    </div>
                  </div>
                )}
                {member.favoriteGear && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Peralatan Favorit</p>
                      <p className="text-zinc-900 dark:text-white font-medium">{member.favoriteGear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio Section */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Hasil Pekerjaan</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {member.portfolio && member.portfolio.length > 0 ? (
                  member.portfolio.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl transition-all group shadow-sm hover:shadow-xl overflow-hidden"
                    >
                      {item.thumbnailUrl && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <span className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2">{item.title}</span>
                          {item.votes !== undefined && item.votes > 0 && (
                            <div className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded-lg text-xs font-bold">
                              <Heart className="w-3 h-3 fill-current" /> {item.votes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 group-hover:text-accent transition-colors mt-auto">
                          Lihat Karya <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
                    <p className="text-zinc-400 dark:text-zinc-500 font-medium">Belum ada item portofolio yang ditambahkan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Photos Section */}
            {member.featuredPhotos && member.featuredPhotos.length > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Galeri Unggulan</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {member.featuredPhotos.map((photo, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm group">
                      <img 
                        src={photo} 
                        alt={`Featured ${i + 1}`} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
