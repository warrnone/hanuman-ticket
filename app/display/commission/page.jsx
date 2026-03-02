"use client";

// http://localhost:3000/display/commission?token=TV_SECRET_123

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 8;
const SLIDE_INTERVAL = 5000;

export default function CommissionDisplayPage() {
  const [data, setData] = useState([]);
  const [now, setNow] = useState(null);
  const [flashMap, setFlashMap] = useState({});
  const [statusFlashMap, setStatusFlashMap] = useState({});
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  const audioPendingRef = useRef(null);
  const audioCalledRef = useRef(null);
  const slideTimerRef = useRef(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const pendingCount = data.filter((i) => i.status === "pending").length;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const pagedData = data.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

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
     🔄 Realtime Subscribe (ตัวเดียวเท่านั้น)
  =============================== */
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("commission-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "taxi_commissions" },
        async (payload) => {
          console.log("🔥 REALTIME EVENT:", payload.eventType);

          await loadData();

          const id = payload.new?.id;

          if (!id) return;

          if (payload.eventType === "INSERT") {
            if (payload.new.status === "pending") {
              audioPendingRef.current?.play().catch(() => {});
            }

            setFlashMap((prev) => ({ ...prev, [id]: true }));
            setTimeout(() => {
              setFlashMap((prev) => ({ ...prev, [id]: false }));
            }, 5000);

            setCurrentPage(0);
          }

          if (payload.eventType === "UPDATE") {
            if (payload.new.status === "called") {
              audioCalledRef.current?.play().catch(() => {});
            }

            setStatusFlashMap((prev) => ({ ...prev, [id]: true }));
            setTimeout(() => {
              setStatusFlashMap((prev) => ({ ...prev, [id]: false }));
            }, 3000);
          }
        }
      )
      .subscribe((status) => {
        console.log("REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
     📺 Scale TV
  =============================== */
  useEffect(() => {
    const calculateScale = () => {
      const widthScale = window.innerWidth / 1920;
      const heightScale = window.innerHeight / 1080;
      setScale(Math.min(widthScale, heightScale));
    };
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

  const formatCardTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const getBgColor = (status) => {
    if (status === "pending") return "#b45309";
    if (status === "called") return "#1d4ed8";
    if (status === "paid") return "#15803d";
    return "#374151";
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
        className="p-10 text-white flex flex-col"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold">🚖 Taxi Commission Queue</h1>
          <div className="text-3xl">{now ? formatTime(now) : ""}</div>
          <div className="text-3xl text-yellow-400">
            Pending: {pendingCount}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {pagedData.length === 0 && (
            <div className="col-span-2 text-4xl text-gray-400 text-center">
              No commission queue
            </div>
          )}

          {pagedData.map((item) => {
            const isFlashing = flashMap[item.id];
            const isStatusChanged = statusFlashMap[item.id];

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: getBgColor(item.status),
                  border: isFlashing
                    ? "4px solid white"
                    : "4px solid transparent",
                  animation: isFlashing
                    ? "flashBlink 0.6s ease-in-out infinite"
                    : isStatusChanged
                    ? "statusPop 0.5s ease-in-out"
                    : "none",
                }}
                className="p-8 rounded-xl font-semibold"
              >
                <div className="text-6xl font-bold">
                  {item.plate_number}
                </div>

                <div className="mt-2 text-4xl">
                  {item.status === "pending" && "🟡 PENDING"}
                  {item.status === "called" && "🔵 CALLED"}
                  {item.status === "paid" && "🟢 PAID"}
                </div>

                {item.created_at && (
                  <div className="mt-3 text-2xl opacity-70">
                    🕐 รับเมื่อ {formatCardTime(item.created_at)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <audio ref={audioPendingRef} src="/sound/notify.mp3" />
        <audio ref={audioCalledRef} src="/sound/called.mp3" />
      </div>
    </div>
  );
}