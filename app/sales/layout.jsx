"use client";

export default function SaleLayout({ children }) {
  return (
    <div className="h-screen flex flex-col bg-emerald-50">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
