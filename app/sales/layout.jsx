"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SaleLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => {router.refresh();}, 5 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-emerald-50">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}