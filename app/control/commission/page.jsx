"use client";
// http://localhost:3000/control/commission?token=STAFF_SECRET_456

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function CommissionControlContent() {
  const [data, setData] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const callSoundRef = useRef(null);
  const paidSoundRef = useRef(null);

  /* ===============================
     🔐 Token Protection
  =============================== */
  useEffect(() => {
    const token = searchParams.get("token");
    if (token !== process.env.NEXT_PUBLIC_STAFF_TOKEN) {
      router.replace("/404");
    }
  }, []);

  /* ===============================
     📊 Load Data
  =============================== */
  const loadData = async () => {
    const res = await fetch("/api/display/commission?limit=100");
    const json = await res.json();
    setData(json.data || []);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("commission-control-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "taxi_commissions" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pending = data.filter((i) => i.status === "pending");
  const called = data.filter((i) => i.status === "called");

  /* ===============================
     🔵 Update Status
  =============================== */
  const updateStatus = async (id, status) => {
    await fetch("/api/commission/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (status === "called") {
      callSoundRef.current?.play().catch(() => {});
    }

    if (status === "paid") {
      paidSoundRef.current?.play().catch(() => {});
    }
  };

  /* ===============================
     ⌨️ Keyboard Shortcut
     Enter = Smart Action
  =============================== */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== "Enter") return;

      // ถ้ามี called → จ่ายเงินก่อน
      if (called.length > 0) {
        updateStatus(called[0].id, "paid");
        return;
      }

      // ถ้าไม่มี called แต่มี pending → เรียกคิว
      if (pending.length > 0) {
        updateStatus(pending[0].id, "called");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pending, called]);

  return (
    <div className="min-h-screen bg-black text-white p-16">
      <h1 className="text-5xl font-bold mb-16 tracking-wide">
        COMMISSION CONTROL
      </h1>

      {/* 🔵 CURRENTLY CALLING */}
      <div className="mb-16">
        <h2 className="text-3xl mb-6 text-blue-400">
          🔵 CURRENTLY CALLING
        </h2>

        {called.length === 0 && (
          <p className="text-gray-500 text-xl">No active call</p>
        )}

        {called.map((item) => (
          <div
            key={item.id}
            className="bg-blue-900 p-10 rounded-2xl mb-6 flex justify-between items-center"
          >
            <div className="text-5xl font-bold tracking-widest">
              {item.plate_number}
            </div>

            <button
              onClick={() => updateStatus(item.id, "paid")}
              className="bg-green-500 hover:bg-green-600 text-black text-3xl px-12 py-5 rounded-xl font-bold transition active:scale-95"
            >
              MARK AS PAID
            </button>
          </div>
        ))}
      </div>

      {/* 🟡 PENDING */}
      <div>
        <h2 className="text-3xl mb-6 text-yellow-400">
          🟡 WAITING QUEUE
        </h2>

        {pending.length === 0 && (
          <p className="text-gray-500 text-xl">No pending queue</p>
        )}

        {pending.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800 p-10 rounded-2xl mb-6 flex justify-between items-center"
          >
            <div className="text-4xl font-semibold tracking-wider">
              {item.plate_number}
            </div>

            <div className="text-4xl font-semibold tracking-wider">
              {item.amount}.-
            </div>

            <button
              onClick={() => updateStatus(item.id, "called")}
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-3xl px-12 py-5 rounded-xl font-bold transition active:scale-95"
            >
              CALL
            </button>
          </div>
        ))}
      </div>

      {/* 🔊 Sounds */}
      {/* <audio ref={callSoundRef} src="/sound/called.mp3" />
      <audio ref={paidSoundRef} src="/sound/notify.mp3" /> */}
    </div>
  );
}

export default function CommissionControlPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommissionControlContent />
    </Suspense>
  );
}

/***
 *
 *  1️⃣ เปิด /control/commission?token=...
 *  2️⃣ รถเข้ามา → กด Enter
    3️⃣ TV แสดง CALLED
    4️⃣ จ่ายเงิน → กด Enter อีกครั้ง
    5️⃣ รถถัดไป → กด Enter
 *
 */