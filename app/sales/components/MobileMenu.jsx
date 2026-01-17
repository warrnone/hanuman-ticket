"use client";

import Link from "next/link";

export default function MobileMenu({ open, onClose, logout }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-4">
        <div className="font-bold text-lg mb-6">Hanuman Ticket</div>

        <nav className="space-y-3">
          <Link href="/sales" onClick={onClose} className="block">
            🏠 Dashboard
          </Link>
          <Link href="/sales/settings/pin" onClick={onClose} className="block">
            🔢 PIN
          </Link>
          <Link
            href="/sales/settings/password"
            onClick={onClose}
            className="block"
          >
            🔐 Password
          </Link>
        </nav>

        <button
          onClick={logout}
          className="mt-6 text-red-600 text-sm"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
