"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { swalSuccess, swalConfirm } from "@/app/components/Swal";
import Image from "next/image";

export default function SaleHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  /* ===============================
    LOAD USER
  =============================== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.error("Invalid user data");
    }
  }, []);

  /* ===============================
    DARK MODE (persist)
  =============================== */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  /* ===============================
    CLICK OUTSIDE → CLOSE MENU
  =============================== */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ===============================
    LOGOUT
  =============================== */
  const logout = async () => {
    const result = await swalConfirm(
      "ออกจากระบบ?",
      "คุณต้องการออกจากระบบใช่หรือไม่"
    );

    if (!result.isConfirmed) return;

    try {
      // 👉 ถ้ายังไม่มี api/logout ให้เปลี่ยนเป็น /api/admin/logout
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("logout error", e);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("role");

    swalSuccess("ออกจากระบบแล้ว");
    router.replace("/login");
  };

  /* ===============================
    BREADCRUMB
  =============================== */
  const segments = pathname.split("/")
    .filter(Boolean)
    .slice(1); // ตัด "sales"

  const closeTimer = useRef(null);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header
        className={`
          sticky top-0 z-40
          h-16 w-full
          bg-white/80 dark:bg-gray-900/80
          backdrop-blur
          border-b border-gray-200 dark:border-gray-700
        `}
      >
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            {/* HAMBURGER (MOBILE) */}
            <button
              className="md:hidden text-2xl text-gray-700 dark:text-gray-200"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>

            {/* BRAND (CLICK → /sales) */}
            <Link
              href="/sales"
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <Image
                src="/hanuman-logo.jpg"
                alt="Hanuman Ticket"
                width={36}
                height={36}
                className="rounded-lg shadow"
                priority
              />
              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                Hanuman Ticket
              </span>
            </Link>

            {/* BREADCRUMB (DESKTOP) */}
            <nav className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400">
              {segments.map((seg, i) => (
                <span key={i} className="flex items-center">
                  <span className="mx-1">/</span>
                  <span className="capitalize text-gray-700 dark:text-gray-200 font-medium">
                    {seg.replace("-", " ")}
                  </span>
                </span>
              ))}
            </nav>
          </div>


          {/* RIGHT */}
          <div className="flex items-center gap-4">
            
            {/* DARK MODE */}
            <button
              onClick={() => setDark(!dark)}
              className="text-xl"
              title="Toggle dark mode"
            >
              {dark ? "🌙" : "☀️"}
            </button>

            {/* USER MENU */}
            <div 
              className="relative" 
              onMouseEnter={() => {
                clearTimeout(closeTimer.current);
                setOpen(true);
              }}
              onMouseLeave={() => {
                closeTimer.current = setTimeout(() => {
                  setOpen(false);
                }, 150);
              }}
            >
              <button
                className={`
                  flex items-center gap-2
                  px-3 py-2 rounded-full
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full
                    bg-gray-200 dark:bg-gray-700
                    flex items-center justify-center
                    text-sm font-semibold text-gray-600 dark:text-gray-200
                  `}
                >
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.username || "User"}
                </span>
              </button>

              {/* DROPDOWN */}
              {open && (
                <div
                  className={`
                    absolute right-0 mt-2 w-56
                    bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    rounded-xl shadow-lg
                    overflow-hidden
                 `}
                >
                  <div className="px-4 py-3 border-b dark:border-gray-700">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {user?.username}
                    </p>
                  </div>

                  <Link
                    href="/sales/settings/pin"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    🔢 ตั้ง / เปลี่ยน PIN
                  </Link>

                  <Link
                    href="/sales/settings/password"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    🔐 เปลี่ยนรหัสผ่าน
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="
              absolute left-0 top-0 h-full w-72
              bg-white dark:bg-gray-900
              shadow-2xl
              flex flex-col
              animate-slide-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== HEADER ===== */}
            <div className="px-5 py-4 border-b dark:border-gray-700 flex items-center gap-3">
              <Image
                src="/hanuman-logo.jpg"
                alt="Hanuman Ticket"
                width={40}
                height={40}
                className="rounded-lg shadow"
              />
              <div>
                <p className="text-base font-semibold text-gray-800 dark:text-white">
                  Hanuman Ticket
                </p>
                <p className="text-xs text-gray-500">Sales Panel</p>
              </div>
            </div>

            {/* ===== MENU ===== */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              <Link
                href="/sales"
                onClick={() => setMobileOpen(false)}
                className="
                  flex items-center gap-3
                  px-4 py-3 rounded-lg
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition
                "
              >
                <span className="text-lg">🏠</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>

              <Link
                href="/sales/settings/pin"
                onClick={() => setMobileOpen(false)}
                className="
                  flex items-center gap-3
                  px-4 py-3 rounded-lg
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition
                "
              >
                <span className="text-lg">🔢</span>
                <span className="text-sm font-medium">PIN</span>
              </Link>

              <Link
                href="/sales/settings/password"
                onClick={() => setMobileOpen(false)}
                className="
                  flex items-center gap-3
                  px-4 py-3 rounded-lg
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition
                "
              >
                <span className="text-lg">🔐</span>
                <span className="text-sm font-medium">Password</span>
              </Link>
            </nav>

            {/* ===== FOOTER ===== */}
            <div className="px-4 py-4 border-t dark:border-gray-700">
              <button
                onClick={logout}
                className="
                  w-full
                  flex items-center gap-3
                  px-4 py-3 rounded-lg
                  text-red-600
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  transition
                  text-sm font-medium
                "
              >
                <span className="text-lg">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}
