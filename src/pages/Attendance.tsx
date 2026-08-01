import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocs, limit, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, ScanLine, CheckCircle2, AlertCircle, Clock, Calendar as CalendarIcon, 
  User, Sun, Copy, Check, Search, Sparkles, ShieldCheck, Smartphone 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Skeleton, TableRowsSkeleton } from '../components/Skeleton';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: any;
  status: string;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Attendance() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<{ success: boolean, message: string, userId?: string, userName?: string } | null>(null);
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);
  const [memberProfile, setMemberProfile] = useState<{ name: string; kelas?: string; photoUrl?: string } | null>(null);
  const [todayStatus, setTodayStatus] = useState<AttendanceRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [adminMobileTab, setAdminMobileTab] = useState<'scan' | 'list'>('scan');
  const [searchQuery, setSearchQuery] = useState('');
  
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  // Fetch Member Details & Today Attendance Status for Member View
  useEffect(() => {
    if (user && !isAdmin) {
      // 1. Fetch Member Profile
      const fetchProfile = async () => {
        try {
          const q = query(collection(db, 'members'), where('uid', '==', user.uid), limit(1));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setMemberProfile({
              name: data.name || user.displayName || 'Anggota Cinegraph',
              kelas: data.kelas,
              photoUrl: data.photoUrl
            });
          } else {
            setMemberProfile({
              name: user.displayName || user.email?.split('@')[0] || 'Anggota Cinegraph'
            });
          }
        } catch (e) {
          console.error("Error fetching member profile:", e);
        }
      };
      fetchProfile();

      // 2. Subscribe to Today's Attendance for this user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const qStatus = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(qStatus, (snapshot) => {
        if (!snapshot.empty) {
          const rec = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceRecord;
          setTodayStatus(rec);
        } else {
          setTodayStatus(null);
        }
      }, (error) => {
        console.error("Error fetching user today status:", error);
      });

      return () => unsubscribe();
    }
  }, [user, isAdmin]);

  // Admin View: Fetch Today's Attendance for all members
  useEffect(() => {
    if (isAdmin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'attendance'),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];
        setRecentScans(records);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      });

      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleCopyId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveAttendance = async (scannedUserId: string, userName: string) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        userId: scannedUserId,
        userName: userName,
        timestamp: serverTimestamp(),
        status: 'Hadir'
      });

      setScanResult({
        success: true,
        message: `Kehadiran ${userName} berhasil dicatat!`
      });

      setTimeout(() => {
        setScanResult(null);
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 3000);
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      setScanResult({ success: false, message: 'Gagal mencatat kehadiran.' });
      setTimeout(() => {
        setScanResult(null);
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 3000);
    }
  };

  useEffect(() => {
    if (isAdmin && !loading) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(async (decodedText) => {
        scanner.pause();
        
        try {
          const scannedUserId = decodedText;
          let userName = "Anggota (ID: " + scannedUserId.substring(0, 6) + ")";
          
          const memberQuery = query(
            collection(db, 'members'),
            where('uid', '==', scannedUserId),
            limit(1)
          );
          const memberSnapshot = await getDocs(memberQuery);
          
          if (!memberSnapshot.empty) {
            userName = memberSnapshot.docs[0].data().name;
          } else {
            const userDoc = await getDoc(doc(db, 'users', scannedUserId));
            if (userDoc.exists()) {
              userName = userDoc.data().displayName || userDoc.data().email || userName;
            }
          }
          
          setScanResult({ 
            success: true, 
            message: `Mencatat kehadiran: ${userName}...`,
            userId: scannedUserId,
            userName: userName
          });
          
          await handleSaveAttendance(scannedUserId, userName);

        } catch (error: any) {
          console.error("Error recording attendance:", error);
          let errorMessage = 'Gagal mencatat kehadiran.';
          if (error.message?.includes('permission-denied')) {
            errorMessage = 'Error: Izin ditolak. Pastikan Anda adalah Admin.';
          }
          setScanResult({ success: false, message: errorMessage });
          setTimeout(() => {
            setScanResult(null);
            scanner.resume();
          }, 3000);
        }
      }, (error) => {
        // Ignore scan frame search errors
      });

      return () => {
        scanner.clear().catch(console.error);
        scannerRef.current = null;
      };
    }
  }, [isAdmin, loading]);

  if (authLoading || loading) {
    return (
      <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 font-sans transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-3">
            <Skeleton className="w-56 h-12 rounded-2xl mx-auto" />
            <Skeleton className="w-80 h-4 rounded-lg mx-auto" />
          </header>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6">
            <Skeleton className="w-48 h-6 rounded-lg" />
            <TableRowsSkeleton rows={4} cols={3} />
          </div>
        </div>
      </div>
    );
  }

  const filteredScans = recentScans.filter(r => 
    r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-3 sm:px-6 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 sm:mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1.5 mb-2"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight py-1">
              <span className="bg-gradient-to-r from-accent via-[#FA983A] to-[#E55039] bg-clip-text text-transparent inline-block">
                PRESENSI
              </span>
            </h1>
          </motion.div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed px-2">
            {isAdmin ? 'Pindai QR Code anggota untuk mencatat kehadiran kegiatan.' : 'Kartu identitas presensi digital anggota Cinegraph Nepal.'}
          </p>
        </header>

        {isAdmin ? (
          /* ========================================= */
          /* ADMIN VIEW - MOBILE OPTIMIZED SCANNER     */
          /* ========================================= */
          <div className="space-y-6">
            {/* Mobile Tab Segmented Toggle */}
            <div className="flex md:hidden p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full">
              <button
                onClick={() => setAdminMobileTab('scan')}
                className={cn(
                  "relative flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 z-10",
                  adminMobileTab === 'scan' ? "text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {adminMobileTab === 'scan' && (
                  <motion.div 
                    layoutId="adminMobileTab" 
                    className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/20 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <ScanLine className="w-4 h-4" />
                Kamera Scan
              </button>
              <button
                onClick={() => setAdminMobileTab('list')}
                className={cn(
                  "relative flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 z-10",
                  adminMobileTab === 'list' ? "text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {adminMobileTab === 'list' && (
                  <motion.div 
                    layoutId="adminMobileTab" 
                    className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/20 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Clock className="w-4 h-4" />
                Daftar Hadir
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                  adminMobileTab === 'list' ? "bg-white text-accent" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                )}>
                  {recentScans.length}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Scanner Section */}
              <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "bg-zinc-50 dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden",
                  adminMobileTab === 'list' ? "hidden md:block" : "block"
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 bg-accent text-white rounded-xl sm:rounded-2xl shadow-lg shadow-accent/20">
                      <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-black tracking-tight">Kamera Scan</h2>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Poin ke QR Code</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-black">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Aktif
                  </span>
                </div>
                
                <div className="relative group mb-4 sm:mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-accent/20 via-transparent to-accent/20 rounded-2xl sm:rounded-[2rem] blur-sm opacity-50"></div>
                  
                  <div className="relative bg-black rounded-2xl sm:rounded-[2rem] overflow-hidden border-2 sm:border-4 border-white dark:border-zinc-800 shadow-2xl">
                    <div id="reader" className="w-full aspect-square"></div>
                    
                    {/* Scanner Framing Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-accent rounded-tl-lg sm:rounded-tl-xl drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"></div>
                      <div className="absolute top-6 right-6 sm:top-10 sm:right-10 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-accent rounded-tr-lg sm:rounded-tr-xl drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"></div>
                      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-accent rounded-bl-lg sm:rounded-bl-xl drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"></div>
                      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-accent rounded-br-lg sm:rounded-br-xl drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"></div>
                      
                      {!scanResult && (
                        <motion.div 
                          animate={{ top: ['20%', '80%', '20%'] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                          className="absolute left-[10%] right-[10%] h-0.5 bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.9)] z-20"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {scanResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 font-bold shadow-lg border relative z-10",
                      scanResult.success 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      scanResult.success ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    )}>
                      {scanResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-widest opacity-70 font-black">Hasil Scan</span>
                      <span className="text-xs sm:text-sm font-black truncate">{scanResult.message}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Recent Scans Section */}
              <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "bg-zinc-50 dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col min-h-[420px]",
                  adminMobileTab === 'scan' ? "hidden md:flex" : "flex"
                )}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2.5 sm:p-3 bg-accent/10 rounded-xl sm:rounded-2xl text-accent">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-black">Daftar Hadir</h2>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Hari Ini</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-right">
                    <p className="text-[9px] font-black uppercase text-zinc-400">Total</p>
                    <p className="text-sm sm:text-lg font-black text-accent">{recentScans.length} <span className="text-xs font-normal text-zinc-500">Anggota</span></p>
                  </div>
                </div>

                {/* Search Filter */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari anggota hadir..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex-grow overflow-y-auto pr-1 space-y-2.5 max-h-[350px] sm:max-h-[420px] custom-scrollbar">
                  {filteredScans.length > 0 ? (
                    filteredScans.map((record) => (
                      <div key={record.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent shrink-0 font-bold text-sm">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm truncate text-zinc-900 dark:text-white">{record.userName}</p>
                            <p className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-zinc-400 inline" />
                              {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Baru saja'} WIB
                            </p>
                          </div>
                        </div>
                        <div className="bg-green-500/10 text-green-500 px-2.5 py-1 rounded-lg text-[10px] font-black border border-green-500/20 shrink-0">
                          {record.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-zinc-500 space-y-3 py-8">
                      <CalendarIcon className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-medium text-center">
                        {searchQuery ? 'Tidak ditemukan anggota dengan kata kunci tersebut.' : 'Belum ada data presensi hari ini.'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* ========================================= */
          /* MEMBER VIEW - MOBILE OPTIMIZED QR CARD    */
          /* ========================================= */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-zinc-50 dark:bg-zinc-900 rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden"
          >
            {/* Top Glossy Gradient */}
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-accent/20 via-accent/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 text-center">
              {/* Profile / Status Header */}
              <div className="mb-6">
                <div className="relative inline-block mb-3">
                  {memberProfile?.photoUrl ? (
                    <img 
                      src={memberProfile.photoUrl} 
                      alt={memberProfile.name} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover mx-auto shadow-xl border-2 border-white dark:border-zinc-800"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 border border-accent/20 rounded-2xl shadow-xl flex items-center justify-center mx-auto text-accent">
                      <QrCode className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                  )}
                  {todayStatus && (
                    <span className="absolute -bottom-1 -right-1 p-1 bg-green-500 text-white rounded-full ring-4 ring-zinc-50 dark:ring-zinc-900 shadow-md" title="Sudah Absen Hari Ini">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {memberProfile?.name || user?.displayName || 'Anggota Cinegraph'}
                </h2>
                
                <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                  {memberProfile?.kelas && (
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                      {memberProfile.kelas}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold border border-accent/20">
                    Cinegraph Member
                  </span>
                </div>

                {/* Today Attendance Status Indicator */}
                <div className="mt-4">
                  {todayStatus ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                      <span>Sudah Presensi ({todayStatus.timestamp?.toDate ? todayStatus.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Hari ini'})</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Belum Presensi Hari Ini</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* QR Code Canvas Frame - High Contrast Light Container for flawless scanning */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl inline-block border border-zinc-200 dark:border-zinc-700 mb-5 relative group">
                <QRCodeSVG 
                  value={user?.uid || 'unknown'} 
                  size={190}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={false}
                  className="w-full h-auto max-w-[190px] sm:max-w-[210px] mx-auto"
                />
              </div>

              {/* Brightness Tip Banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium mb-6 max-w-sm mx-auto">
                <Sun className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="text-left text-[11px] leading-tight">
                  <strong>Tips:</strong> Naikkan kecerahan layar HP agar QR Code mudah terbaca oleh kamera admin.
                </span>
              </div>
              
              {/* ID Section with Copy Button */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-left bg-white/50 dark:bg-zinc-950/50 p-3.5 rounded-2xl">
                <div className="min-w-0 flex-grow">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">ID Digital</p>
                  <p className="font-mono text-xs font-bold text-zinc-900 dark:text-white truncate">{user?.uid}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyId}
                  className="shrink-0 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-accent hover:text-white dark:hover:bg-accent text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Salin ID Anggota"
                >
                  {copiedId ? (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-green-500 font-black">
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </motion.div>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

