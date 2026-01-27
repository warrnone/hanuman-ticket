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
      className={`w-16 md:w-48 h-full flex flex-col bg-gradient-to-b from-orange-800 to-orange-900 text-white border-r border-orange-900/40 flex-shrink-0`}
    >
      {/* ================= TOP / MENU ================= */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {/* LOGO */}
        <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
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

        {/* CATEGORY LIST */}
        <nav className="space-y-3">
          {filteredCategories.map((cat, index) => {
            const active = selected === cat;
            const isLast = index === filteredCategories.length - 1;

            return (
              <div key={cat}>
                <button
                  onClick={() => onSelect(cat)}
                  className={`
                    w-full
                    flex items-center gap-3
                    px-3 py-3
                    rounded-lg
                    transition
                    select-none
                    relative
                    ${
                      active
                        ? "bg-orange-600 shadow-inner"
                        : "hover:bg-orange-800/80"
                    }
                  `}
                >
                  <span className="text-xl w-6 text-center">
                    {ICONS[cat] || "📁"}
                  </span>

                  <span className="hidden md:inline text-sm font-medium truncate">
                    {cat}
                  </span>

                  {/* underline when active */}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/80 rounded-full" />
                  )}
                </button>

                {!isLast && (
                  <div className="mx-3 my-1 border-b border-orange-300/30" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ================= FOOTER ================= */}
      <div
        className="relative p-3 border-t border-orange-300/30"
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
              px-3 py-3
              rounded-lg
              text-sm font-medium
              text-orange-100
              hover:bg-orange-700/40
              transition
            `}
          >
            <span className="text-xl">⚙️</span>
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* DROPDOWN */}
          {openSetting && (
            <div
              className={`
                absolute left-full bottom-0 ml-2
                w-56
                bg-white text-gray-800
                rounded-xl
                shadow-xl
                overflow-hidden
                z-50
              `}
            >
              <button
                onClick={() => router.push("/sales/settings/pin")}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
              >
                🔢 Change PIN
              </button>

              <button
                onClick={() => router.push("/sales/settings/password")}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
              >
                🔐 Change Password
              </button>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-orange-300/30 my-2" />

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3
            px-3 py-3
            rounded-lg
            text-sm font-medium
            text-red-200
            hover:bg-red-600/20
            transition
          `}
        >
          <span className="text-xl">🚪</span>
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
