"use client";

import { useState } from "react";

/* =========================
   MOCK DATA (เปลี่ยนเป็น API ทีหลัง)
========================= */
const CATEGORIES = [
  "World Packages",
  "Zipline",
  "Adventure",
  "Photo & Video",
  "Add-ons",
];

const PRODUCTS = [
  { id: 1, name: "World A+", price: 3490, category: "World Packages" },
  { id: 2, name: "World B+", price: 2990, category: "World Packages" },
  { id: 3, name: "Zipline 1 รอบ", price: 800, category: "Zipline" },
  { id: 4, name: "Photo 1 Pax", price: 600, category: "Photo & Video" },
  { id: 5, name: "Video 1 Pax", price: 900, category: "Photo & Video" },
];

/* =========================
   SALE POS PAGE
========================= */
export default function SalePage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [cart, setCart] = useState([]);

  /* =========================
     ADD TO CART
  ========================= */
  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  /* =========================
     TOTAL
  ========================= */
  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* =========================
          LEFT: CATEGORIES
      ========================= */}
      <div className="w-1/6 bg-[#6b4b3e] text-white flex flex-col">
        <div className="p-4 font-bold text-lg">Hanuman POS</div>

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-3 text-left hover:bg-[#5a3f34]
              ${activeCategory === cat ? "bg-[#5a3f34]" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* =========================
          CENTER: PRODUCTS
      ========================= */}
      <div className="w-3/6 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {activeCategory}
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {PRODUCTS.filter((p) => p.category === activeCategory).map(
            (p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white rounded-xl shadow p-4 text-left hover:ring-2 hover:ring-orange-400"
              >
                <div className="h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
                  📦
                </div>
                <div className="font-medium">{p.name}</div>
                <div className="text-orange-600 font-bold">
                  {p.price.toLocaleString()}฿
                </div>
              </button>
            )
          )}
        </div>
      </div>

      {/* =========================
          RIGHT: CART
      ========================= */}
      <div className="w-2/6 bg-white p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">🧾 Order</h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <p className="text-gray-400">ยังไม่มีสินค้า</p>
          ) : (
            cart.map((item, i) => (
              <div
                key={i}
                className="flex justify-between border-b pb-2"
              >
                <span>{item.name}</span>
                <span>{item.price.toLocaleString()}฿</span>
              </div>
            ))
          )}
        </div>

        {/* TOTAL */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{total.toLocaleString()}฿</span>
          </div>

          <button className="w-full bg-orange-500 text-white py-3 rounded-xl text-lg font-semibold hover:bg-orange-600">
            PAY
          </button>
        </div>
      </div>
    </div>
  );
}
