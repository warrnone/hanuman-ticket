"use client";

import SaleHeader from "./components/SaleHeader";

export default function SaleLayout({ children }) {
  return (
    <div className="h-screen flex flex-col">
      <SaleHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
