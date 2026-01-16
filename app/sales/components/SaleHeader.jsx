"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SaleHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  /* ----------------------------------
    LOAD USER
  ---------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Invalid user data");
    }
  }, []);

  /* ----------------------------------
    CLICK OUTSIDE → CLOSE MENU
  ---------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ----------------------------------
    LOGOUT
  ---------------------------------- */
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.replace("/login");
  };

  return (
    <header className="w-full h-14 bg-white border-b flex items-center justify-between px-4">
      {/* LEFT */}
      <div className="font-bold text-lg">
        Hanuman Ticket
      </div>

      {/* RIGHT */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
        >
          <span className="text-sm font-medium">
            {user?.username || "User"}
          </span>
          <span className="text-xl">⚙️</span>
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
            <Link
              href="/sale/settings/pin"
              className="block px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => setOpen(false)}
            >
              🔢 ตั้ง / เปลี่ยน PIN
            </Link>

            <Link
              href="/sale/settings/password"
              className="block px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => setOpen(false)}
            >
              🔐 เปลี่ยนรหัสผ่าน
            </Link>

            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
