"use client";
// http://localhost:3000/display/commission?token=TV_SECRET_123
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CommissionDisplayPage() {
  const [data, setData] = useState([]);
  const [now, setNow] = useState(null);
  const [flashMap, setFlashMap] = useState({});
  const [scale, setScale] = useState(1);
  const audioPendingRef = useRef(null);
  const audioCalledRef = useRef(null);
  const topRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pendingCount = data.filter((i) => i.status === "pending").length;

  /* ===============================
     🔐 TV Token Protection
  =============================== */
  useEffect(() => {
    const token = searchParams.get("token");
    if (token !== process.env.NEXT_PUBLIC_TV_TOKEN) {
      router.replace("/404");
    }
  }, []);

  /* ===============================
     📊 Load Data
  =============================== */
  const loadData = async () => {
    try {
      const res = await fetch("/api/display/commission");
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Load commission error:", err);
    }
  };

  /* ===============================
     🔄 Realtime Subscribe
  =============================== */
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("commission-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "taxi_commissions",
        },
        async (payload) => {
          await loadData();

          const newId = payload.new.id;

          // 🔔 pending sound
          if (payload.new.status === "pending") {
            audioPendingRef.current?.play().catch(() => {});
          }

          // ✨ Flash 5 sec
          setFlashMap((prev) => ({ ...prev, [newId]: true }));
          setTimeout(() => {
            setFlashMap((prev) => ({ ...prev, [newId]: false }));
          }, 5000);

          // 📢 scroll to top
          topRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "taxi_commissions",
        },
        async (payload) => {
          await loadData();

          if (payload.new.status === "called") {
            audioCalledRef.current?.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ===============================
     🕒 Clock (Hydration Safe)
  =============================== */
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===============================
     📺 Adaptive TV Scale
     Base design: 1920x1080
  =============================== */
  useEffect(() => {
    const calculateScale = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;

      const widthScale = window.innerWidth / baseWidth;
      const heightScale = window.innerHeight / baseHeight;

      setScale(Math.min(widthScale, heightScale));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const formatTime = (date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-black min-h-screen overflow-hidden">
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="p-10 text-white"
      >
        <div ref={topRef}></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-6xl font-bold">
            🚖 Taxi Commission Queue
          </h1>

          <div className="text-3xl">
            {now ? formatTime(now) : ""}
          </div>

          <div className="text-3xl text-yellow-400">
            Pending: {pendingCount}
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-2 gap-8">
          {data.length === 0 && (
            <div className="text-4xl text-gray-400">
              No commission queue
            </div>
          )}

          {data.map((item) => (
            <div
              key={item.id}
              className={`
                p-8 rounded-xl text-5xl font-semibold
                transition-all duration-300
                ${item.status === "pending" ? "bg-yellow-600" : ""}
                ${item.status === "called" ? "bg-blue-600" : ""}
                ${item.status === "paid" ? "bg-green-600" : ""}
                ${
                  flashMap[item.id]
                    ? "animate-pulse border-4 border-white"
                    : ""
                }
              `}
            >
              <div className="text-6xl font-bold">
                {item.plate_number}
              </div>

              <div className="mt-3">
                {item.amount} ฿
              </div>

              <div className="mt-2 text-4xl">
                {item.status === "pending" && "🟡 PENDING"}
                {item.status === "called" && "🔵 CALLED"}
                {item.status === "paid" && "🟢 PAID"}
              </div>
            </div>
          ))}
        </div>

        {/* Sounds */}
        <audio
          ref={audioPendingRef}
          src="/sound/pending.mp3"
          preload="auto"
        />
        <audio
          ref={audioCalledRef}
          src="/sound/called.mp3"
          preload="auto"
        />
      </div>
    </div>
  );
}