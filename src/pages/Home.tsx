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
        }
      },
      (error) => console.error("Error fetching latest events:", error),
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
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
    },
    {
      title: "Portofolio Anggota",
      description:
        "Kenali tim kreatif kami dan lihat hasil karya terbaik mereka.",
      icon: <Users className="w-8 h-8 text-accent" />,
      link: "/members",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
    },
    {
      title: "Aftermovie Kegiatan",
      description:
        "Tonton aftermovie kegiatan, acara sekolah, dan karya film pendek kami.",
      icon: <Play className="w-8 h-8 text-accent" />,
      link: "/projects",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
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
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden pt-32 pb-12 bg-zinc-50 dark:bg-zinc-950"
      >
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
            <h1 className="font-black tracking-tighter uppercase text-zinc-900 dark:text-white flex flex-col gap-1.5 w-full">
              <span className="text-[5.5vw] xs:text-[6.5vw] sm:text-2xl md:text-3xl font-bold tracking-[0.15em] sm:tracking-widest text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">
                Camera, Rolling, and
              </span>
              <motion.span
                className="text-[19vw] xs:text-[21vw] sm:text-7xl md:text-7xl lg:text-8xl text-accent block leading-none font-black"
                initial={{ filter: "blur(12px)", scale: 1.1, opacity: 0 }}
                animate={{
                  filter: ["blur(12px)", "blur(0px)", "blur(4px)", "blur(0px)"],
                  scale: [1.1, 1, 1.02, 1],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  times: [0, 0.4, 0.7, 1],
                  delay: 0.2,
                }}
              >
                Action!
              </motion.span>
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
            {heroEvents.length > 0 ? (
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-left flex flex-col justify-end z-20">
                    <div>
                      <span className="bg-accent text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-lg">
                        Terbaru
                      </span>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white drop-shadow-lg leading-tight mb-2 line-clamp-2">
                        {heroEvents[currentSlide].title}
                      </h3>
                      <p className="text-xs md:text-sm text-zinc-300 drop-shadow-md font-medium mb-4">
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
                      className="inline-flex items-center gap-2 text-white bg-accent hover:bg-accent/90 px-4 py-2 rounded-lg text-sm font-bold transition-all w-fit shadow-lg"
                    >
                      Lihat Dokumentasi{" "}
                      <ArrowRight className="w-4 h-4" />
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
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "p-10 rounded-3xl border border-zinc-100 dark:border-zinc-900 hover:border-accent/30 transition-all group shadow-sm hover:shadow-xl",
                feature.bg,
              )}
            >
              <div className="mb-8 p-4 bg-white dark:bg-zinc-950 rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-md">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-500 mb-8 leading-relaxed">
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

      {/* Stats Section */}
      <section className="py-32 bg-zinc-50 dark:bg-zinc-900/30 border-y border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl font-black text-zinc-900 dark:text-white mb-2">
              <Counter value={30} suffix="+" />
            </div>
            <div className="text-zinc-500 text-sm uppercase tracking-widest">
              Anggota Aktif
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-5xl font-black text-zinc-900 dark:text-white mb-2">
              <Counter value={25} suffix="+" />
            </div>
            <div className="text-zinc-500 text-sm uppercase tracking-widest">
              Aftermovie
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl font-black text-zinc-900 dark:text-white mb-2">
              <Counter value={5} suffix="+" />
            </div>
            <div className="text-zinc-500 text-sm uppercase tracking-widest">
              Penghargaan
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-5xl font-black text-zinc-900 dark:text-white mb-2">
              <Counter value="15k" suffix="+" />
            </div>
            <div className="text-zinc-500 text-sm uppercase tracking-widest">
              Foto (242GB)
            </div>
          </motion.div>
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
