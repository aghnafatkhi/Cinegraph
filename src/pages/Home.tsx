import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  animate,
  AnimatePresence,
} from "motion/react";
import {
  Play,
  Camera,
  Users,
  Image as ImageIcon,
  ArrowRight,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Helmet } from "react-helmet-async";

interface Event {
  id: string;
  title: string;
  date: string;
  coverImage: string;
  description?: string;
}

function Counter({
  value,
  suffix = "",
}: {
  value: number | string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  // Extract number from string if needed (e.g., "12k" -> 12)
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.]/g, ""))
      : value;
  const isK = typeof value === "string" && value.toLowerCase().includes("k");

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(0, numericValue, {
        duration: 2,
        ease: "easeOut",
        onUpdate(latest) {
          if (ref.current) {
            const formatted = isK
              ? latest.toFixed(1) + "k"
              : Math.floor(latest).toString();
            ref.current.textContent = formatted + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [inView, numericValue, isK, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function Home() {
  const [heroEvents, setHeroEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const targetRef = useRef(null);

  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroEvents.length]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      orderBy("date", "desc"),
      limit(3),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const eventsData = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Event,
          );
          setHeroEvents(eventsData);
        } else {
          setHeroEvents([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching latest events:", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const features = [
    {
      title: "Dokumentasi Acara",
      description:
        "Dokumentasi lengkap setiap momen berharga di SMAN 1 Cileungsi.",
      icon: <ImageIcon className="w-8 h-8 text-accent" />,
      link: "/gallery",
      bg: "bg-white/30 dark:bg-zinc-950/20 backdrop-blur-md border-zinc-200/50 dark:border-white/5",
    },
    {
      title: "Aftermovie Kegiatan",
      description:
        "Tonton aftermovie kegiatan, acara sekolah, dan karya film pendek kami.",
      icon: <Play className="w-8 h-8 text-accent" />,
      link: "/projects",
      bg: "bg-white/30 dark:bg-zinc-950/20 backdrop-blur-md border-zinc-200/50 dark:border-white/5",
    },
    {
      title: "Portofolio Anggota",
      description:
        "Kenali tim kreatif kami dan lihat hasil karya terbaik mereka.",
      icon: <Users className="w-8 h-8 text-accent" />,
      link: "/members",
      bg: "bg-white/30 dark:bg-zinc-950/20 backdrop-blur-md border-zinc-200/50 dark:border-white/5",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen transition-colors duration-300"
    >
      <Helmet>
        <title>
          Cinegraph Nepal - Ekstrakurikuler Cinematography SMAN 1 Cileungsi
        </title>
        <meta
          name="description"
          content="Website resmi Cinegraph Nepal SMAN 1 Cileungsi. Dokumentasi acara, portofolio anggota, dan kumpulan aftermovie kegiatan."
        />
        <meta
          name="keywords"
          content="Cinegraph Nepal, SMAN 1 Cileungsi, Cinematography, Ekstrakurikuler, Aftermovie, Film, Dokumentasi Sekolah"
        />
        <meta
          property="og:title"
          content="Cinegraph Nepal - Cinematography SMAN 1 Cileungsi"
        />
        <meta
          property="og:description"
          content="Eksplorasi kreativitas visual bersama Cinegraph Nepal. Lihat karya terbaru dan dokumentasi acara kami."
        />
        <meta
          property="og:image"
          content="https://picsum.photos/seed/cinema/1200/630"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Hero Section */}
      <section
        ref={targetRef}
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden pt-32 pb-12 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300"
      >
        {/* Glowing Neon Orbs for Glassmorphism Accent */}
        <div className="absolute top-12 left-[10%] w-[450px] h-[450px] bg-accent/8 dark:bg-accent/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-24 right-[5%] w-[400px] h-[400px] bg-[#FA983A]/8 dark:bg-[#FA983A]/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-[15%] w-[350px] h-[350px] bg-[#E55039]/5 dark:bg-[#E55039]/10 rounded-full blur-[110px] pointer-events-none" />

        {/* Background Subtle Pattern */}
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-transparent to-transparent" />
        </motion.div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start gap-4 md:gap-6 text-left"
          >
            <h1 className="font-black tracking-tighter uppercase text-zinc-900 dark:text-white flex flex-col gap-1 md:gap-2 w-full">
              <span className="text-[5.2vw] xs:text-[6.2vw] sm:text-2xl md:text-3xl font-extrabold tracking-[0.18em] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                Camera, Rolling, and
              </span>
              <span className="text-[19vw] xs:text-[21vw] sm:text-7xl md:text-7xl lg:text-8xl bg-gradient-to-r from-accent via-[#FA983A] to-[#E55039] bg-clip-text text-transparent block leading-none font-black drop-shadow-[0_2px_15px_rgba(250,152,58,0.15)] dark:drop-shadow-[0_4px_20px_rgba(250,152,58,0.2)]">
                Action!
              </span>
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
              Website resmi Cinegraph Nepal SMAN 1 Cileungsi. Tempat kami berbagi cerita melalui visual.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto mt-2">
              <Link
                to="/gallery"
                className="bg-accent hover:bg-accent/90 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20 text-sm md:text-base"
              >
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                Dokumentasi
              </Link>
              <Link
                to="/projects"
                className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-zinc-200 dark:border-zinc-800 shadow-lg text-sm md:text-base"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                Aftermovie
              </Link>
            </div>
          </motion.div>

          {/* Right: Auto-Sliding Event Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative w-full aspect-[4/3] lg:aspect-[4/4] flex items-center justify-center group"
          >
            {loading ? (
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <ImageIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4 animate-bounce" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            ) : heroEvents.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -50, rotateY: 10 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900"
                >
                  <img
                    src={
                      heroEvents[currentSlide].coverImage ||
                      "https://picsum.photos/seed/cinema/800/800"
                    }
                    alt={heroEvents[currentSlide].title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-left flex flex-col justify-end z-20">
                    <div>
                      <span className="bg-accent text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest mb-2 inline-block shadow-md">
                        Terbaru
                      </span>
                      <h3 className="text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-tight mb-1.5 line-clamp-2">
                        {heroEvents[currentSlide].title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] font-medium mb-3 sm:mb-4">
                        {new Date(
                          heroEvents[currentSlide].date,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Link
                      to="/gallery"
                      className="inline-flex items-center gap-1.5 sm:gap-2 text-white bg-accent hover:bg-accent/90 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all w-fit shadow-lg hover:scale-105 active:scale-95"
                    >
                      Lihat Dokumentasi{" "}
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center">
                <ImageIcon className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                  Belum ada dokumentasi acara.
                </p>
              </div>
            )}

            {/* Dots Indicator */}
            {heroEvents.length > 1 && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {heroEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentSlide === i
                        ? "bg-accent w-6"
                        : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600",
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Floating Stats Section inside Hero to serve as an elegant connector */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-16 sm:mt-20 md:mt-28">
          <div className="relative rounded-3xl overflow-hidden bg-white/40 dark:bg-zinc-950/30 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 sm:p-8 md:p-10">
            {/* Subtle radial light glow inside the stats card */}
            <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-accent/8 dark:bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-60 h-60 bg-[#FA983A]/8 dark:bg-[#FA983A]/12 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 sm:gap-8 md:gap-12 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-1 sm:mb-2">
                  <Counter value={30} suffix="+" />
                </div>
                <div className="text-zinc-500 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest font-semibold">
                  Anggota Aktif
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-1 sm:mb-2">
                  <Counter value={25} suffix="+" />
                </div>
                <div className="text-zinc-500 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest font-semibold">
                  Aftermovie
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-1 sm:mb-2">
                  <Counter value={5} suffix="+" />
                </div>
                <div className="text-zinc-500 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest font-semibold">
                  Penghargaan
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-1 sm:mb-2">
                  <Counter value="15k" suffix="+" />
                </div>
                <div className="text-zinc-500 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest font-semibold">
                  Foto (242GB)
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-10 md:pt-16 pb-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
        {/* Soft colorful background blur behind the features cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "p-10 rounded-3xl border hover:border-accent/30 dark:hover:border-accent/40 transition-all group shadow-md hover:shadow-2xl shadow-zinc-200/5 dark:shadow-black/10",
                feature.bg,
              )}
            >
              <div className="mb-8 p-4 bg-white/60 dark:bg-zinc-950/60 border border-zinc-200/20 dark:border-white/10 backdrop-blur-md rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-md">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                {feature.description}
              </p>
              <Link
                to={feature.link}
                className="flex items-center gap-2 text-accent font-bold group-hover:gap-4 transition-all"
              >
                Selengkapnya <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-accent to-accent/60 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-accent/20"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Camera className="w-96 h-96 -rotate-12 -translate-x-20 -translate-y-20 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 text-white">
            INGIN BERGABUNG DENGAN KAMI?
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto relative z-10">
            Jadilah bagian dari tim kreatif Cinegraph Nepal dan kembangkan bakat
            cinematographymu bersama kami.
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://forms.gle/tDVYctj1VceLGCPx9"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-accent px-10 py-5 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all inline-block relative z-10 shadow-xl"
          >
            Daftar Sekarang
          </motion.a>
        </motion.div>
      </section>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
