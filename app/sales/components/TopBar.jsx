"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function TopBar({  cart, onCartClick, onLogout }) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  /* ========================= SETTINGS DROPDOWN STATE ========================= */
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between lg:hidden">
      {/* Left: Logo & Title (แสดงบน tablet/mobile) */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link
          href="/sales"
          className="flex items-center gap-2 hover:opacity-90 transition"
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
            <Image
              src="/hanuman-logo.jpg"
              alt="Hanuman Ticket"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
          </div>

          <div className="hidden md:block text-sm leading-tight">
            <div className="font-bold">Hanuman Ticket</div>
            <div className="text-xs opacity-80">POS GRA</div>
          </div>
        </Link>
      </div>

      {/* Right: Menu (tablet/mobile only) */}
      <div className="lg:hidden flex items-center gap-2">
        {/* Settings Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Menu"
          >
            <span className="text-2xl">⚙️</span>
          </button>

          {/* Dropdown Menu */}
          {openMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200">
              <button
                onClick={() => {
                  setOpenMenu(false);
                  window.location.href = "/sales/settings/password";
                }}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition flex items-center gap-3"
              >
                <span>🔐</span>
                <span>Change Password</span>
              </button>

              <div className="border-t border-gray-200"></div>

              <button
                onClick={() => {
                  setOpenMenu(false);
                  onLogout();
                }}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 transition flex items-center gap-3"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Cart Button */}
        <button
          onClick={onCartClick}
          className="relative px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition"
        >
          <span>🛒</span>
          <span className="hidden sm:inline">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}