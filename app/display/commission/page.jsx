"use client";

import { useEffect, useState } from "react";

export default function CommissionDisplayPage() {
  const [data, setData] = useState([]);
  const [now, setNow] = useState(new Date());

  const loadData = async () => {
    try {
      const res = await fetch("/api/display/commission");
      const json = await res.json();
      setData(json.data || []);
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
    const interval = setInterval(loadData, 5000); // refresh ทุก 5 วิ
    return () => clearInterval(interval);
  }, []);

  // clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold">
          🚖 Taxi Commission Queue
        </h1>
        <div className="text-3xl">
          {formatTime(now)}
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
          className="grid grid-cols-3 text-4xl py-5 border-b border-gray-800"
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
    </div>
  );
}

/****
ผมสามารถเพิ่ม:
🔔 เสียงแจ้งเตือนเมื่อมีคิวใหม่
⚡ Supabase Realtime (ไม่ต้อง refresh)
📢 Auto scroll
🎨 Layout 2 คอลัมน์สำหรับคิวเยอะ
🔐 Secret token สำหรับ TV เท่านั้น
 */