"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CommissionDisplayPage() {
  const [data, setData] = useState([]);
  const [now, setNow] = useState(null); // ✅ แก้ hydration error
  const [latestId, setLatestId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const audioRef = useRef(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/display/commission");
      const json = await res.json();
      const newData = json.data || [];

      if (newData.length > 0) {
        const newest = newData[0].id;
        if (latestId && newest !== latestId) {
          audioRef.current?.play().catch(() => {});
        }
        setLatestId(newest);
      }

      setData(newData);
    } catch (err) {
      console.error("Load commission error:", err);
    }
  };

  const formatTime = (date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("commission-insert")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "taxi_commissions",
        },
        async (payload) => {
          const newId = payload.new.id;

          await loadData();

          // 🔔 เล่นเสียงเฉพาะ pending
          if (payload.new.status === "pending") {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }

          // ✨ ทำให้แถวกระพริบ
          setHighlightId(newId);

          setTimeout(() => {
            setHighlightId(null);
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ clock — set ครั้งแรกหลัง mount บน client เท่านั้น
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold">🚖 Taxi Commission Queue</h1>
        <div className="text-3xl">
          {now ? formatTime(now) : ""} {/* ✅ ไม่ render เวลาตอน SSR */}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 text-3xl font-semibold border-b border-gray-600 pb-4 mb-4">
        <div>Plate Number</div>
        <div>Commission</div>
        <div>Status</div>
      </div>

      {/* Rows */}
      {data.length === 0 && (
        <div className="text-3xl text-center mt-20 text-gray-400">
          No commission queue
        </div>
      )}

      {data.map((item) => (
        <div
          key={item.id}
          className={`grid grid-cols-3 text-4xl py-5 border-b border-gray-800 transition-all duration-300
            ${highlightId === item.id ? "flash-row text-black" : ""}
          `}
        >
          <div>{item.plate_number}</div>
          <div>{item.amount} ฿</div>
          <div>
            {item.status === "pending" && (
              <span className="text-yellow-400">🟡 PENDING</span>
            )}
            {item.status === "called" && (
              <span className="text-blue-400">🔵 CALLED</span>
            )}
            {item.status === "paid" && (
              <span className="text-green-400">🟢 PAID</span>
            )}
          </div>
        </div>
      ))}

      {/* 🔔 Sound */}
      <audio ref={audioRef} src="/sound/notify.mp3" preload="auto" />
    </div>
  );
}

/****
ผมสามารถเพิ่ม:
📢 Auto scroll
🎨 Layout 2 คอลัมน์สำหรับคิวเยอะ
🔐 Secret token สำหรับ TV เท่านั้น
 */