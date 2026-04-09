import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocs, limit, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, ScanLine, CheckCircle2, AlertCircle, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: any;
  status: string;
  uangKas?: {
    amount: number;
    method: 'Cash' | 'QRIS' | 'Online';
  };
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Attendance() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<{ success: boolean, message: string, userId?: string, userName?: string } | null>(null);
  const [showKasModal, setShowKasModal] = useState(false);
  const [kasAmount, setKasAmount] = useState('2000');
  const [kasMethod, setKasMethod] = useState<'Cash' | 'QRIS' | 'Online'>('Cash');
  const [isPaying, setIsPaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);
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

  useEffect(() => {
    if (isAdmin) {
      // Fetch today's attendance
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

  const handleSaveAttendance = async (includeKas: boolean) => {
    if (!scanResult?.userId) return;
    
    setIsSubmitting(true);
    try {
      const attendanceData: any = {
        userId: scanResult.userId,
        userName: scanResult.userName,
        timestamp: serverTimestamp(),
        status: 'Hadir'
      };

      if (includeKas) {
        attendanceData.uangKas = {
          amount: parseInt(kasAmount),
          method: kasMethod
        };

        if (kasMethod === 'Online') {
          setIsPaying(true);
          const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: parseInt(kasAmount),
              orderId: `KAS-${Date.now()}`,
              customerDetails: {
                first_name: scanResult.userName,
                email: ''
              }
            })
          });
          
          const data = await response.json();
          if (data.token) {
            (window as any).snap.pay(data.token, {
              onSuccess: async (result: any) => {
                await addDoc(collection(db, 'attendance'), attendanceData);
                setShowKasModal(false);
                setScanResult({
                  success: true,
                  message: `Presensi & Pembayaran Online Berhasil: ${scanResult.userName}`
                });
                setIsPaying(false);
              },
              onPending: (result: any) => {
                alert("Pembayaran tertunda. Silakan selesaikan pembayaran.");
                setIsPaying(false);
              },
              onError: (result: any) => {
                alert("Pembayaran gagal.");
                setIsPaying(false);
              },
              onClose: () => {
                setIsPaying(false);
              }
            });
          }
          setIsSubmitting(false);
          return;
        }
      }

      await addDoc(collection(db, 'attendance'), {
        ...attendanceData
      });

      setShowKasModal(false);
      setScanResult({
        success: true,
        message: `Kehadiran ${scanResult.userName} berhasil dicatat! ${includeKas ? '(Termasuk Uang Kas)' : ''}`
      });
      
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setScanResult({ success: false, message: 'Gagal mencatat kehadiran.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (isAdmin && !loading) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(async (decodedText) => {
        // Prevent multiple rapid scans
        scanner.pause();
        
        try {
          const scannedUserId = decodedText;
          // Fetch the user's name from the members or users collection
          let userName = "Anggota (ID: " + scannedUserId.substring(0, 6) + ")";
          
          // 1. Try to find in members collection (where uid is a field)
          const memberQuery = query(
            collection(db, 'members'),
            where('uid', '==', scannedUserId),
            limit(1)
          );
          const memberSnapshot = await getDocs(memberQuery);
          
          if (!memberSnapshot.empty) {
            userName = memberSnapshot.docs[0].data().name;
          } else {
            // 2. Try to find in users collection (where uid is the document id)
            const userDoc = await getDoc(doc(db, 'users', scannedUserId));
            if (userDoc.exists()) {
              userName = userDoc.data().displayName || userDoc.data().email || userName;
            }
          }
          
          setScanResult({ 
            success: true, 
            message: `Berhasil! ${userName} telah hadir.`,
            userId: scannedUserId,
            userName: userName
          });
          setShowKasModal(true);
          
          setTimeout(() => {
            setScanResult(null);
            scanner.resume();
          }, 3000);

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
        // Ignore scan errors as they happen continuously when no QR is in view
      });

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isAdmin, loading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium">{authLoading ? 'Memeriksa autentikasi...' : 'Memuat sistem presensi...'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen pt-32 pb-20 px-6 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="bg-accent/10 border border-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
              Sistem Kehadiran
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">PRESENSI <span className="text-accent">QR CODE</span></h1>
          </motion.div>
        </header>

        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black">Scan QR Code</h2>
              </div>
              
              <div className="bg-white dark:bg-black rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-6">
                <div id="reader" className="w-full"></div>
              </div>

              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-center gap-3 font-bold ${scanResult.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                >
                  {scanResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {scanResult.message}
                </motion.div>
              )}

              {/* Uang Kas Modal */}
              {showKasModal && scanResult && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="text-2xl font-black mb-2">{scanResult.userName}</h3>
                      <p className="text-zinc-500">Berhasil discan. Catat uang kas?</p>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nominal Uang Kas</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rp</span>
                          <input
                            type="number"
                            value={kasAmount}
                            onChange={(e) => setKasAmount(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setKasMethod('Cash')}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm border transition-all",
                            kasMethod === 'Cash' 
                              ? "bg-accent border-accent text-white" 
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                          )}
                        >
                          Cash
                        </button>
                        <button
                          onClick={() => setKasMethod('QRIS')}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm border transition-all",
                            kasMethod === 'QRIS' 
                              ? "bg-accent border-accent text-white" 
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                          )}
                        >
                          QRIS
                        </button>
                        <button
                          onClick={() => setKasMethod('Online')}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm border transition-all",
                            kasMethod === 'Online' 
                              ? "bg-accent border-accent text-white" 
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                          )}
                        >
                          Online
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        disabled={isSubmitting || isPaying}
                        onClick={() => handleSaveAttendance(true)}
                        className="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting || isPaying ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          kasMethod === 'Online' ? 'Bayar & Simpan' : 'Simpan dengan Uang Kas'
                        )}
                      </button>
                      <button
                        disabled={isSubmitting || isPaying}
                        onClick={() => handleSaveAttendance(false)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-4 rounded-xl font-bold transition-all"
                      >
                        Hadir Saja (Tanpa Kas)
                      </button>
                      <button
                        onClick={() => {
                          setShowKasModal(false);
                          setScanResult(null);
                        }}
                        className="w-full py-2 text-zinc-400 text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* Recent Scans Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black">Kehadiran Hari Ini</h2>
              </div>

              {/* Uang Kas Summary Today */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Kas Hari Ini</p>
                  <p className="text-xl font-black text-accent">
                    Rp {recentScans.reduce((sum, a) => sum + (a.uangKas?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Hadir</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">
                    {recentScans.length} <span className="text-xs font-normal text-zinc-500">Anggota</span>
                  </p>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {recentScans.length > 0 ? (
                  recentScans.map((record) => (
                    <div key={record.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{record.userName}</p>
                          <p className="text-xs text-zinc-500">
                            {record.timestamp?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/20">
                        {record.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 py-10">
                    <CalendarIcon className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">Belum ada data kehadiran hari ini.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Member View - Show QR Code */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] p-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/20 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white dark:bg-zinc-950 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 border border-zinc-200 dark:border-zinc-800">
                <QrCode className="w-10 h-10 text-accent" />
              </div>
              
              <h2 className="text-2xl font-black mb-2">Kartu Presensi</h2>
              <p className="text-zinc-500 text-sm mb-8">Tunjukkan QR Code ini kepada admin saat kegiatan ekskul untuk mencatat kehadiran.</p>
              
              <div className="bg-white p-6 rounded-3xl shadow-inner inline-block border border-zinc-200">
                <QRCodeSVG 
                  value={user?.uid || 'unknown'} 
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
              
              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">ID Anggota</p>
                <p className="font-mono text-sm text-zinc-900 dark:text-white">{user?.uid}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
