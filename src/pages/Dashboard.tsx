import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Briefcase, Award, Plus, Trash2, Save, LogOut, AlertCircle, CheckCircle2, Image as ImageIcon, ExternalLink, Upload } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';
import { resizeImage } from '../lib/imageUtils';

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
  uid?: string;
  skills?: string[];
  portfolio?: PortfolioItem[];
  bio?: string;
  joinYear?: string;
  tiktok?: string;
  youtube?: string;
  favoriteGear?: string;
  featuredPhotos?: string[];
}

export default function Dashboard() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  // Form State
  const [role, setRole] = useState('');
  const [kelas, setKelas] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [joinYear, setJoinYear] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [favoriteGear, setFavoriteGear] = useState('');
  const [featuredPhotos, setFeaturedPhotos] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const newPhotos = await Promise.all(files.map(file => resizeImage(file, 800)));
      setFeaturedPhotos([...featuredPhotos, ...newPhotos]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPhotos = await Promise.all(files.map(file => resizeImage(file, 800)));
      setFeaturedPhotos([...featuredPhotos, ...newPhotos]);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Find member by UID or Email
      const q = query(
        collection(db, 'members'),
        where('email', '==', user.email),
        limit(1)
      );

      const unsubscribeMember = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = { id: docData.id, ...docData.data() } as Member;
          setMember(data);
          setRole(data.role || '');
          setKelas(data.kelas || '');
          setPhotoUrl(data.photoUrl || '');
          setInstagram(data.instagram || '');
          setPhone(data.phone || '');
          setSkills(data.skills || []);
          setPortfolio(data.portfolio || []);
          setBio(data.bio || '');
          setJoinYear(data.joinYear || '');
          setTiktok(data.tiktok || '');
          setYoutube(data.youtube || '');
          setFavoriteGear(data.favoriteGear || '');
          setFeaturedPhotos(data.featuredPhotos || []);

          // Link UID if not already linked
          if (!data.uid) {
            updateDoc(doc(db, 'members', docData.id), { uid: user.uid });
          }
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching member profile:", error);
        setLoading(false);
      });

      return () => unsubscribeMember();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'members', member.id), {
        role,
        kelas,
        photoUrl,
        instagram,
        phone,
        skills,
        portfolio,
        bio,
        joinYear,
        tiktok,
        youtube,
        favoriteGear,
        featuredPhotos
      });
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil. ' + err.message });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addPortfolio = () => {
    setPortfolio([...portfolio, { title: '', link: '' }]);
  };

  const updatePortfolio = (index: number, field: keyof PortfolioItem, value: string) => {
    const newPortfolio = [...portfolio];
    newPortfolio[index] = { ...newPortfolio[index], [field]: value };
    setPortfolio(newPortfolio);
  };

  const removePortfolio = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    setPhotoUrl(croppedImageBase64);
    setCropImageSrc(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">Memuat dashboard...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 pt-20">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] text-center shadow-2xl">
          <div className="bg-red-600/10 border border-red-600/20 p-4 rounded-2xl w-fit mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black mb-4">Profil Tidak Ditemukan</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Email Anda ({auth.currentUser?.email}) belum terdaftar sebagai anggota di sistem kami. 
            Silakan hubungi Admin untuk menambahkan profil Anda.
          </p>
          <div className="flex flex-col gap-4">
            {auth.currentUser?.email === 'aghna1011@gmail.com' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-accent/20"
              >
                <User className="w-5 h-5" />
                Buka Admin Panel
              </button>
            )}
            <button
              onClick={() => auth.signOut()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white min-h-screen pt-32 pb-20 px-6">
      {/* Crop Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
          aspectRatio={3 / 4}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <img
              src={photoUrl || 'https://picsum.photos/seed/user/200/200'}
              alt={member.name}
              className="w-24 h-24 object-cover rounded-3xl border-4 border-zinc-900 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-3xl font-black tracking-tight">{member.name}</h1>
              <p className="text-accent font-bold uppercase tracking-widest text-sm">{member.role}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-accent/20"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
            <button
              onClick={() => auth.signOut()}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-3 transition-all border border-zinc-800"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </header>

        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mb-10 p-6 rounded-2xl flex items-center gap-4 border",
              message.type === 'success' ? "bg-green-600/10 border-green-600/20 text-green-500" : "bg-red-600/10 border-red-600/20 text-red-500"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-1 space-y-10">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <User className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold">Informasi Dasar</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Jabatan / Spesialisasi</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Contoh: Editor, Kameramen"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Kelas</label>
                  <input
                    type="text"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Contoh: X-1, XI-IPA"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Username tanpa @"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">TikTok</label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="Username tanpa @"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">YouTube</label>
                  <input
                    type="text"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="Link Channel YouTube"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Tahun Bergabung</label>
                  <input
                    type="text"
                    value={joinYear}
                    onChange={(e) => setJoinYear(e.target.value)}
                    placeholder="Contoh: 2023"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Peralatan Favorit</label>
                  <input
                    type="text"
                    value={favoriteGear}
                    onChange={(e) => setFavoriteGear(e.target.value)}
                    placeholder="Contoh: Sony A7III, Lensa 50mm"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Bio / Tentang Saya</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan sedikit tentang diri Anda..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold">Keahlian</h3>
                </div>
                <button onClick={addSkill} className="p-2 bg-zinc-800 hover:bg-accent rounded-lg transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      placeholder="Skill"
                      className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                    />
                    <button onClick={() => removeSkill(index)} className="p-3 bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold">Galeri Foto Unggulan</h3>
                </div>
              </div>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all mb-6 ${dragActive ? 'border-accent bg-accent/5' : 'border-zinc-800 bg-zinc-950 hover:border-accent/50'}`}
              >
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-2">Drag & drop foto ke sini, atau</p>
                <label className="cursor-pointer inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                  Pilih File
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {featuredPhotos.map((photo, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden aspect-video border border-zinc-800">
                    <img src={photo} alt={`Featured ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => {
                        const newPhotos = [...featuredPhotos];
                        newPhotos.splice(index, 1);
                        setFeaturedPhotos(newPhotos);
                      }} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {featuredPhotos.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-4">Belum ada foto unggulan.</p>
              )}
            </div>
          </div>

          {/* Right Column: Portfolio */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-3xl h-full">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-accent" />
                  <h3 className="text-xl font-bold">Hasil Pekerjaan / Portofolio</h3>
                </div>
                <button 
                  onClick={addPortfolio}
                  className="bg-accent/10 hover:bg-accent text-accent hover:text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-accent/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
              </div>

              <div className="space-y-6">
                {portfolio.length > 0 ? (
                  portfolio.map((item, index) => (
                    <div key={index} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl relative group">
                      <button 
                        onClick={() => removePortfolio(index)}
                        className="absolute top-4 right-4 p-2 bg-zinc-900 hover:bg-red-600/20 text-zinc-600 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Judul Project</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updatePortfolio(index, 'title', e.target.value)}
                            placeholder="Contoh: Editor Video Profil Sekolah"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Link Project (YouTube/Drive)</label>
                          <div className="relative">
                            <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              value={item.link}
                              onChange={(e) => updatePortfolio(index, 'link', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[2rem]">
                    <Briefcase className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 font-medium">Belum ada item portofolio. Klik tombol di atas untuk menambah.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
