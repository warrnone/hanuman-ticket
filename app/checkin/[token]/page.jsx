"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CheckinPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus(data.error || "Check-in failed");
          return;
        }

        // ✅ ถ้าสำเร็จ redirect ไป partner
        window.location.href =
          `https://partner.com/checkin?order=${data.order_id}`;

      } catch (err) {
        setStatus("Network error");
      }
    };

    if (token) verify();
  }, [token]);

  return (
    <div className="flex items-center justify-center h-screen text-lg">
      {status}
    </div>
  );
}



/****
 * 
 * 
 * 
 * 
    ลูกค้าสแกน
    ⬇
    GET /checkin/{token}
    ⬇
    ยิง POST /api/checkin
    ⬇
    update order + commission
    ⬇
    redirect ไป partner
 */