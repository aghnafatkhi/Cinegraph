import React from 'react';
import { Camera, Instagram, Youtube, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 pt-20 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
              <img 
                src="https://i.imgur.com/qbI4zPO.png" 
                alt="Cinegraph Nepal Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white">Cinegraph Nepal</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm leading-relaxed">
            Ekstrakurikuler Cinematography SMAN 1 Cileungsi. Wadah kreativitas siswa dalam seni visual dan perfilman.
          </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/cinegraphnepal/" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-accent transition-colors text-zinc-400 hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@cn_nepal" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-accent transition-colors text-zinc-400 hover:text-white">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="mailto:cinegraphnepalforever@gmail.com" className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-accent transition-colors text-zinc-400 hover:text-white">
                <Mail className="w-5 h-5" />
              </a>
            </div>
        </div>

        <div>
          <h4 className="text-zinc-900 dark:text-white font-bold mb-6">Navigasi</h4>
          <ul className="flex flex-col gap-4 text-sm text-zinc-500">
            <li><Link to="/" className="hover:text-accent transition-colors">Beranda</Link></li>
            <li><Link to="/gallery" className="hover:text-accent transition-colors">Galeri Foto</Link></li>
            <li><Link to="/members" className="hover:text-accent transition-colors">Portofolio Anggota</Link></li>
            <li><Link to="/projects" className="hover:text-accent transition-colors">Karya Video</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-zinc-900 dark:text-white font-bold mb-6">Kontak</h4>
          <ul className="flex flex-col gap-4 text-sm text-zinc-500">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-1" />
              <span>Jl. Pasar Lama No.66, Cileungsi, Kec. Cileungsi, Kabupaten Bogor, Jawa Barat 16820</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-accent shrink-0" />
              <span>cinegraphnepalforever@gmail.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-zinc-900 dark:text-white font-bold mb-6">Jam Ekskul</h4>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Setiap hari Senin pukul 15.30 - 17.00 WIB di Ruang Multimedia SMAN 1 Cileungsi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center md:text-left">
          © {new Date().getFullYear()} Cinegraph Nepal SMAN 1 Cileungsi. All rights reserved.
        </p>
        <p className="text-zinc-400 dark:text-zinc-600 text-xs">
          Dibuat dengan ❤️ oleh Tim IT Cinegraph Nepal
        </p>
      </div>
    </footer>
  );
}
