import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Save, LogOut, AlertCircle, CheckCircle2, 
  Image as ImageIcon, Film, Users, Calendar, ExternalLink, X, Edit2, Upload, Link as LinkIcon
} from 'lucide-react';
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

interface Project {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  category?: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  photoUrl: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'events' | 'projects' | 'members'>('events');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ collection: string, id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (editingItem) {
      setPreviewUrl(editingItem.coverImage || editingItem.thumbnailUrl || editingItem.photoUrl || '');
    } else {
      setPreviewUrl('');
    }
  }, [editingItem]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (!u || u.email !== 'aghna1011@gmail.com') {
        navigate('/login');
        return;
      }
      setUser(u);
    });

    // Fetch Data
    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'desc')), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Event[]);
    });

    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('title', 'asc')), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubEvents();
      unsubProjects();
      unsubMembers();
    };
  }, [navigate]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { collection: collectionName, id } = deleteConfirm;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setMessage({ type: 'success', text: 'Item berhasil dihapus!' });
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal menghapus: ' + err.message });
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Ensure image URL is from preview if drag-and-dropped
    if (activeTab === 'events') data.coverImage = previewUrl;
    if (activeTab === 'projects') data.thumbnailUrl = previewUrl;
    if (activeTab === 'members') data.photoUrl = previewUrl;

    if (!previewUrl) {
      setMessage({ type: 'error', text: 'Gambar/Foto wajib diisi!' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    try {
      if (editingItem) {
        await updateDoc(doc(db, activeTab, editingItem.id), data);
        setMessage({ type: 'success', text: 'Berhasil diperbarui!' });
      } else {
        await addDoc(collection(db, activeTab), data);
        setMessage({ type: 'success', text: 'Berhasil ditambahkan!' });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">Memuat panel admin...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-zinc-900 dark:text-white">PANEL <span className="text-accent">ADMIN</span></h1>
            <p className="text-zinc-500 dark:text-zinc-500">Kelola konten website Cinegraph Nepal secara langsung.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEditingItem(null);
                setPreviewUrl('');
                setIsModalOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent/20"
            >
              <Plus className="w-5 h-5" />
              Tambah {activeTab === 'events' ? 'Acara' : activeTab === 'projects' ? 'Project' : 'Anggota'}
            </button>
            <button
              onClick={() => auth.signOut()}
              className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </header>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md p-4 rounded-2xl flex items-center gap-4 border shadow-2xl",
              message.type === 'success' ? "bg-white dark:bg-zinc-900 border-green-500 text-green-600 dark:text-green-500" : "bg-white dark:bg-zinc-900 border-red-500 text-red-600 dark:text-red-500"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
            <span className="font-medium text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 shrink-0"><X className="w-4 h-4" /></button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 mb-12 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-full md:w-fit mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              "flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2",
              activeTab === 'events' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" /> Galeri Acara
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={cn(
              "flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2",
              activeTab === 'projects' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Film className="w-4 h-4 shrink-0" /> Project Video
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              "flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2",
              activeTab === 'members' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Users className="w-4 h-4 shrink-0" /> Daftar Anggota
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'events' && events.map(event => (
            <div key={event.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all">
              <div className="h-40 relative">
                <img src={event.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => { setEditingItem(event); setPreviewUrl(event.coverImage); setIsModalOpen(true); }} className="p-3 bg-white text-black rounded-full hover:bg-accent hover:text-white transition-all shadow-xl"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => setDeleteConfirm({ collection: 'events', id: event.id })} className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 truncate text-zinc-900 dark:text-white">{event.title}</h3>
                <p className="text-zinc-500 text-xs mb-4">{event.date}</p>
              </div>
            </div>
          ))}

          {activeTab === 'projects' && projects.map(project => (
            <div key={project.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all">
              <div className="h-40 relative">
                <img src={project.thumbnailUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => { setEditingItem(project); setPreviewUrl(project.thumbnailUrl); setIsModalOpen(true); }} className="p-3 bg-white text-black rounded-full hover:bg-accent hover:text-white transition-all shadow-xl"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => setDeleteConfirm({ collection: 'projects', id: project.id })} className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 truncate text-zinc-900 dark:text-white">{project.title}</h3>
                <p className="text-accent text-[10px] font-black uppercase tracking-widest">{project.category}</p>
              </div>
            </div>
          ))}

          {activeTab === 'members' && members.map(member => (
            <div key={member.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4 group shadow-sm hover:shadow-xl transition-all">
              <img src={member.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-zinc-800" referrerPolicy="no-referrer" />
              <div className="flex-grow min-w-0">
                <h3 className="font-bold truncate text-zinc-900 dark:text-white">{member.name}</h3>
                <p className="text-zinc-500 text-xs truncate">{member.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingItem(member); setPreviewUrl(member.photoUrl); setIsModalOpen(true); }} className="p-2 text-zinc-400 hover:text-accent transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setDeleteConfirm({ collection: 'members', id: member.id })} className="p-2 text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {((activeTab === 'events' && events.length === 0) || 
          (activeTab === 'projects' && projects.length === 0) || 
          (activeTab === 'members' && members.length === 0)) && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-900 rounded-[3rem]">
            <Plus className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Belum ada data. Klik tombol tambah untuk memulai.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">{editingItem ? 'Edit' : 'Tambah'} {activeTab === 'events' ? 'Acara' : activeTab === 'projects' ? 'Project' : 'Anggota'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="overflow-y-auto overflow-x-hidden p-6 custom-scrollbar overscroll-contain">
                <form onSubmit={handleSave} className="space-y-5">
                {activeTab === 'events' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Judul Acara</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Tanggal Acara
                        </label>
                        <div className="relative">
                          <input 
                            name="date" 
                            type="date" 
                            defaultValue={editingItem?.date} 
                            required 
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all [color-scheme:light] dark:[color-scheme:dark]" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Thumbnail / Cover</label>
                        <div 
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={cn(
                            "relative border-2 border-dashed rounded-xl transition-all overflow-hidden group",
                            dragActive ? "border-accent bg-accent/5" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-accent"
                          )}
                        >
                          {previewUrl ? (
                            <div className="relative aspect-video">
                              <img src={previewUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label className="cursor-pointer p-2 bg-white text-black rounded-lg hover:bg-accent hover:text-white transition-all">
                                  <Upload className="w-4 h-4" />
                                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <button type="button" onClick={() => setPreviewUrl('')} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                              <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Drop atau Klik</span>
                              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> URL Gambar (Opsional)
                      </label>
                      <input 
                        type="text"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        placeholder="https://i.imgur.com/..." 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all text-xs" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Link Google Drive</label>
                      <input name="googleDriveLink" defaultValue={editingItem?.googleDriveLink} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Deskripsi</label>
                      <textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                  </>
                )}

                {activeTab === 'projects' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Judul Project</label>
                      <input name="title" defaultValue={editingItem?.title} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Kategori</label>
                        <input name="category" defaultValue={editingItem?.category} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Thumbnail Project</label>
                        <div 
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={cn(
                            "relative border-2 border-dashed rounded-xl transition-all overflow-hidden group",
                            dragActive ? "border-accent bg-accent/5" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-accent"
                          )}
                        >
                          {previewUrl ? (
                            <div className="relative aspect-video">
                              <img src={previewUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label className="cursor-pointer p-2 bg-white text-black rounded-lg hover:bg-accent hover:text-white transition-all">
                                  <Upload className="w-4 h-4" />
                                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <button type="button" onClick={() => setPreviewUrl('')} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                              <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Drop atau Klik</span>
                              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> URL Thumbnail (Opsional)
                      </label>
                      <input 
                        type="text"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        placeholder="https://i.imgur.com/..." 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all text-xs" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">URL Video (YouTube)</label>
                      <input name="videoUrl" defaultValue={editingItem?.videoUrl} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Deskripsi</label>
                      <textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                  </>
                )}

                {activeTab === 'members' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nama Lengkap</label>
                      <input name="name" defaultValue={editingItem?.name} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email</label>
                      <input name="email" type="email" defaultValue={editingItem?.email} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Role Utama</label>
                        <input name="role" defaultValue={editingItem?.role} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Foto Profil</label>
                        <div 
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={cn(
                            "relative border-2 border-dashed rounded-xl transition-all overflow-hidden group h-32",
                            dragActive ? "border-accent bg-accent/5" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-accent"
                          )}
                        >
                          {previewUrl ? (
                            <div className="relative h-full">
                              <img src={previewUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label className="cursor-pointer p-2 bg-white text-black rounded-lg hover:bg-accent hover:text-white transition-all">
                                  <Upload className="w-4 h-4" />
                                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <button type="button" onClick={() => setPreviewUrl('')} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                              <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Drop Foto</span>
                              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> URL Foto (Opsional)
                      </label>
                      <input 
                        type="text"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        placeholder="https://i.imgur.com/..." 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-accent transition-all text-xs" 
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-accent/20"
                >
                  <Save className="w-5 h-5" />
                  Simpan Data
                </button>
              </form>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl z-10 p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white tracking-tight">Hapus Item?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus item ini dari database?</p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
