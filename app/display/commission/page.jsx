"use client";

// http://localhost:3000/display/commission?token=TV_SECRET_123

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 8;
const SLIDE_INTERVAL = 5000;
const MAX_RECORDS = 200; // กันโหลดทั้ง table

export default function CommissionDisplayPage() {
  const [data, setData] = useState([]);
  const [now, setNow] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [displayPending, setDisplayPending] = useState(0);
  const [explosions, setExplosions] = useState([]);
  const [scale, setScale] = useState(1);

  const audioPendingRef = useRef(null);
  const slideTimerRef = useRef(null);
  const debounceRef = useRef(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const pendingCount = data.filter((i) => i.status === "pending").length;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const pagedData = data.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  /* ===============================
     🔐 Token Protection
  =============================== */
  useEffect(() => {
    const token = searchParams.get("token");
    if (token !== process.env.NEXT_PUBLIC_TV_TOKEN) {
      router.replace("/404");
    }
  }, []);

  /* ===============================
     📊 Load Data (LIMITED)
  =============================== */
  const loadData = async () => {
    try {
      const res = await fetch(
        `/api/display/commission?limit=${MAX_RECORDS}`
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  /* ===============================
     🔄 Realtime (Debounced)
  =============================== */
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("commission-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "taxi_commissions" },
        () => {
          clearTimeout(debounceRef.current);

          debounceRef.current = setTimeout(() => {
            loadData();
            audioPendingRef.current?.play().catch(() => {});
            createExplosion();
          }, 400); // debounce 400ms
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(debounceRef.current);
    };
  }, []);

  /* ===============================
     📊 Animated Counter
  =============================== */
  useEffect(() => {
    let start = displayPending;
    const end = pendingCount;
    if (start === end) return;

    const duration = 400;
    const increment = (end - start) / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        start = end;
        clearInterval(timer);
      }
      setDisplayPending(Math.round(start));
    }, 16);

    return () => clearInterval(timer);
  }, [pendingCount]);

  /* ===============================
     ⏩ Auto Slide
  =============================== */
  useEffect(() => {
    if (totalPages <= 1) return;

    slideTimerRef.current = setInterval(() => {
      setCurrentPage((prev) =>
        prev + 1 >= totalPages ? 0 : prev + 1
      );
    }, SLIDE_INTERVAL);

    return () => clearInterval(slideTimerRef.current);
  }, [totalPages]);

  /* ===============================
     🕒 Clock
  =============================== */
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===============================
     🧠 Smart Auto Scale
  =============================== */
  useEffect(() => {
    const resize = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;
      const widthScale = window.innerWidth / baseWidth;
      const heightScale = window.innerHeight / baseHeight;
      setScale(Math.min(widthScale, heightScale));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ===============================
     🎆 Explosion (Limited)
  =============================== */
  const createExplosion = () => {
    const particles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: `${Math.random() * 150 - 75}px`,
      y: `${Math.random() * 150 - 75}px`,
    }));

    setExplosions(particles);
    setTimeout(() => setExplosions([]), 700);
  };

  /* ===============================
     🎨 Theme Logic
  =============================== */
  const themeClass = pendingCount < 5 ? "theme-low" : pendingCount < 15 ? "theme-medium" : "theme-high";
  const hour = now?.getHours() || 12;
  const modeClass = hour >= 6 && hour < 18 ? "mode-day" : "mode-night";

  return (
    <div
      className={`${modeClass} ${themeClass} text-white`}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {explosions.map((p) => (
        <div
          key={p.id}
          className="explosion"
          style={{
            left: "50%",
            top: "50%",
            "--x": p.x,
            "--y": p.y,
          }}
        />
      ))}

      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        className="p-20 flex flex-col"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-8xl font-extrabold tracking-widest">
            TAXI COMMISSION
          </h1>

          <div className="text-5xl opacity-80">
            {now?.toLocaleTimeString()}
          </div>

          <div className="text-5xl font-semibold">
            {displayPending} Pending
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-12">
          {pagedData.map((item) => (
            <div
              key={item.id}
              className="led-panel accent-border rounded-3xl p-12 transition-all duration-300"
            >
              <div className="text-8xl font-bold tracking-widest">
                {item.plate_number}
              </div>

              <div className="mt-6 text-4xl">
                {item.status.toUpperCase()}
              </div>

              {item.created_at && (
                <div className="mt-8 text-3xl opacity-60">
                  {new Date(item.created_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>

        <audio ref={audioPendingRef} src="/sound/notify.mp3" />
      </div>
    </div>
  );
}