  "use client";

  import { useState, useRef, useEffect } from "react";
  import Image from "next/image";
  import Link from "next/link";
  import { useRouter } from "next/navigation";

  /* =========================
    ICON MAP
  ========================= */
  const ICONS = {
    "World Packages" : "📦",
    "Zipline" : "🪂",
    "Luge" : "🛼",
    "Roller" : "🎢",
    "SLING SHOT": "🎯",
    "SKY WALK" : "🌉",
  };

  export default function CategorySidebar({categories,selected,onSelect,onLogout,}) {
    const router = useRouter();
    const filteredCategories = categories.filter((cat) => cat !== "Photo & Video");
    /* =========================
      SETTINGS DROPDOWN STATE
    ========================= */
    const [openSetting, setOpenSetting] = useState(false);
    const settingRef = useRef(null);
    const closeTimer = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (settingRef.current && !settingRef.current.contains(e.target)) {
          setOpenSetting(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

  return (
    <aside
      className={`
        w-16 md:w-64 h-full flex flex-col 
        bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900
        text-white border-r border-slate-700/40 
        flex-shrink-0 shadow-2xl
      `}
    >
      {/* ================= TOP / MENU ================= */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5">
        {/* LOGO */}
        <div className="mb-8 pb-5 border-b border-slate-700/50">
          <Link
            href="/sales"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-200 justify-center md:justify-start group"
          >
            <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 transition-all duration-200 ring-2 ring-slate-700/50">
              <Image
                src="/hanuman-logo.jpg"
                alt="Hanuman Ticket"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
            </div>

            <div className="hidden md:block">
              <div className="font-bold text-base tracking-tight text-white">Hanuman Ticket</div>
              <div className="text-xs text-slate-400 font-medium">POS GRA System</div>
            </div>
          </Link>
        </div>

        {/* CATEGORY LIST */}
        <nav className="space-y-1">
          {filteredCategories.map((cat, index) => {
            const active = selected === cat;

            return (
              <div key={cat}>
                <button
                  onClick={() => onSelect(cat)}
                  className={`
                    w-full group
                    flex items-center gap-3
                    px-3.5 py-3.5
                    rounded-xl
                    transition-all duration-200
                    select-none
                    relative
                    font-medium
                    ${
                      active
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                        : "text-slate-300 hover:bg-slate-700/60 hover:text-white hover:shadow-md"
                    }
                  `}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg" />
                  )}

                  <span className={`
                    text-xl w-7 text-center flex-shrink-0 transition-transform duration-200
                    ${active ? "drop-shadow-md" : "group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"}
                  `}>
                    {ICONS[cat] || "📁"}
                  </span>

                  <span className="hidden md:inline text-sm truncate flex-1 text-left">
                    {cat}
                  </span>

                  {/* Badge หรือ notification (ถ้ามี) */}
                  {active && (
                    <span className="hidden md:block w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* ================= FOOTER ================= */}
      <div
        className="relative p-3 md:p-5 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm"
        ref={settingRef}
      >
        {/* SETTINGS (hover wrapper) */}
        <div
          onMouseEnter={() => {
            clearTimeout(closeTimer.current);
            setOpenSetting(true);
          }}
          onMouseLeave={() => {
            closeTimer.current = setTimeout(() => {
              setOpenSetting(false);
            }, 150);
          }}
          className="relative"
        >
          <button
            className={`
              w-full flex items-center gap-3
              px-3.5 py-3
              rounded-xl
              text-sm font-medium
              text-slate-300
              hover:bg-slate-700/60
              hover:text-white
              transition-all duration-200
              group
            `}
          >
            <span className="text-xl group-hover:rotate-90 transition-transform duration-300 grayscale-[30%] group-hover:grayscale-0">⚙️</span>
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* DROPDOWN */}
          {openSetting && (
            <div
              className={`
                absolute left-full bottom-0 ml-3
                w-60
                bg-white text-gray-900
                rounded-xl
                shadow-2xl border border-gray-100
                overflow-hidden
                z-50
                animate-slide-in
              `}
            >
              <div className="p-2">
                <button
                  onClick={() => router.push("/sales/settings/password")}
                  className="
                    flex items-center gap-3 w-full text-left 
                    px-4 py-3.5 text-sm font-medium
                    hover:bg-orange-50 rounded-lg
                    transition-all duration-200
                    group
                  "
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">🔐</span>
                  <span className="text-gray-700 group-hover:text-orange-600">Change Password</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-slate-700/50 my-3" />

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3
            px-3.5 py-3
            rounded-xl
            text-sm font-medium
            text-slate-300
            hover:bg-red-500/10
            hover:text-red-400
            transition-all duration-200
            group
          `}
        >
          <span className="text-xl group-hover:translate-x-1 transition-transform duration-200 grayscale-[30%] group-hover:grayscale-0">🚪</span>
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
