"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { swalSuccess, swalConfirm } from "@/app/components/Swal";
import Image from "next/image";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Packages", href: "/admin/packages", icon: "📦" },
    { name: "Photo & Video", href: "/admin/photo", icon: "📸" },
    { name: "Categories", href: "/admin/categories", icon: "📁" },
  ];

  const handleLogout = async () => {
    const result = await swalConfirm(
      "ออกจากระบบ?",
      "คุณต้องการออกจากระบบ Admin ใช่หรือไม่"
    );

    if (!result.isConfirmed) return;

    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      swalSuccess("ออกจากระบบแล้ว");
      router.replace("/");
      router.refresh();
    }
  };

  /* ================================
     SIDEBAR CONTENT
  ================================= */
  const SidebarContent = (
    <>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* รูปโลโก้ */}
          <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-lg shadow-md border border-slate-700 bg-orange-500">
            <Image
              src="/hanuman-logo.jpg"
              alt="Hanuman Logo"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>

          {/* กลุ่มข้อความ */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white leading-none">
              Hanuman World
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] mt-1">
              Management Ticket System
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>


      {/* 🔹 เส้นคั่น */}
      <div className="px-4 py-2">
        <div className="border-t border-slate-700"></div>
      </div>

      {/* ✅  Taxi */}
      <div className="px-4 pb-2">
        <Link
          href="/admin/agents"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
            pathname === "/admin/agents"
              ? "bg-orange-500 text-white shadow-lg"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="text-lg">🧑‍💼</span>
          <span className="font-medium">Agent</span>
        </Link>
      </div>

      {/* 🔹 เส้นคั่น */}
      <div className="px-4 py-2">
        <div className="border-t border-slate-700"></div>
      </div>

      {/* ✅  Taxi */}
      <div className="px-4 pb-2">
        <Link
          href="/admin/taxi"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
            pathname === "/admin/taxi"
              ? "bg-orange-500 text-white shadow-lg"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="text-lg">🚗</span>
          <span className="font-medium">Taxi</span>
        </Link>
      </div>

      {/* 🔹 เส้นคั่น */}
      <div className="px-4 py-2">
        <div className="border-t border-slate-700"></div>
      </div>

      {/* ✅ SETTINGS ใกล้ Logout */}
      <div className="px-4 pb-2">
        <Link
          href="/admin/settings"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
            pathname === "/admin/settings"
              ? "bg-orange-500 text-white shadow-lg"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span className="font-medium">Settings</span>
        </Link>
      </div>

      {/* 🔹 เส้นคั่น */}
      <div className="px-4 py-2">
        <div className="border-t border-slate-700"></div>
      </div>

      <div className="px-4 pb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition"
        >
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-slate-50 flex text-slate-900 overflow-hidden">
      {/* ================================
          MOBILE OVERLAY
      ================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================================
          SIDEBAR (Desktop: static, Mobile: fixed)
      ================================= */}
      <aside
        className={`
          fixed lg:static z-40 top-0 left-0 h-full w-64
          bg-slate-900 text-white flex flex-col
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {SidebarContent}
      </aside>

      {/* ================================
          MAIN CONTENT AREA
      ================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* HEADER - ปักด้านบน */}
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur border-b px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* HAMBURGER (Mobile only) */}
            <button
              className="lg:hidden text-2xl"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>

            <div>
              <h2 className="font-bold capitalize">
                {menuItems.find((i) => i.href === pathname)?.name ||
                  "Admin Panel"}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Welcome back, Admin
              </p>
            </div>
          </div>

          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
            👤
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}