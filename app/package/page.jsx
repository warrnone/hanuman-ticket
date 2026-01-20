'use client';

import { useState, useMemo } from 'react';

/* ============================
   MOCK DATA
============================ */
const CATEGORIES = [
  { id: 'package', name: 'Packages', icon: '📦' },
  { id: 'activity', name: 'Activities', icon: '🎢' },
  { id: 'photo', name: 'Photo', icon: '📷' },
  { id: 'video', name: 'Video', icon: '🎥' },
];

const ITEMS = [
  // Packages
  { id: 1, category: 'package', name: 'World A+', price: 3490 },
  { id: 2, category: 'package', name: 'World B+', price: 2990 },

  // Activities
  { id: 10, category: 'activity', name: 'Z10 Zipline', price: 1500 },
  { id: 11, category: 'activity', name: 'Luge 1 Ride', price: 790 },

  // Photo (price by pax)
  { id: 100, category: 'photo', name: 'Zipline Photo', prices: [
    { pax: '1', price: 800 },
    { pax: '2-4', price: 1200 },
    { pax: '5-7', price: 1400 },
    { pax: '8-10', price: 2000 },
  ]},

  // Video
  { id: 200, category: 'video', name: 'Zipline Video', prices: [
    { pax: '1', price: 1100 },
    { pax: '2', price: 1200 },
    { pax: '3', price: 1300 },
    { pax: '4', price: 1400 },
  ]},
];

/* ============================
   COMPONENT
============================ */
export default function SalePage() {
  const [activeCategory, setActiveCategory] = useState('package');
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = useMemo(
    () => ITEMS.filter(i => i.category === activeCategory),
    [activeCategory]
  );

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  /* ============================
     ACTIONS
  ============================ */
  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  return (
    <div className="h-screen flex bg-gray-100">

      {/* ================= Sidebar ================= */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          🐒 Hanuman POS
        </div>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSelectedItem(null);
            }}
            className={`px-4 py-3 text-left flex gap-2 items-center
              ${activeCategory === cat.id ? 'bg-orange-600' : 'hover:bg-gray-800'}
            `}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </aside>

      {/* ================= Product Area ================= */}
      <main className="flex-1 p-4 grid grid-cols-3 gap-4">

        {/* ===== Product List ===== */}
        <section className="col-span-2 bg-white rounded-xl p-4 shadow">
          <h2 className="text-lg font-bold mb-4">Items</h2>

          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.prices) {
                    setSelectedItem(item);
                  } else {
                    addToCart(item);
                  }
                }}
                className="border rounded-lg p-4 hover:bg-orange-50 text-left"
              >
                <div className="font-semibold">{item.name}</div>
                {!item.prices && (
                  <div className="text-orange-600 font-bold">
                    ฿{item.price.toLocaleString()}
                  </div>
                )}
                {item.prices && (
                  <div className="text-sm text-gray-500">
                    Select PAX
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ===== Cart ===== */}
        <aside className="bg-white rounded-xl p-4 shadow flex flex-col">
          <h2 className="text-lg font-bold mb-4">🛒 Order</h2>

          <div className="flex-1 space-y-2 overflow-auto">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    ฿{item.price.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-600">
                ฿{total.toLocaleString()}
              </span>
            </div>

            <button className="mt-3 w-full bg-orange-600 text-white py-3 rounded-lg text-lg">
              PAY
            </button>
          </div>
        </aside>
      </main>

      {/* ================= PAX SELECT MODAL ================= */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedItem.name}
            </h3>

            <div className="space-y-2">
              {selectedItem.prices.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addToCart({
                      name: `${selectedItem.name} (${p.pax} PAX)`,
                      price: p.price
                    });
                    setSelectedItem(null);
                  }}
                  className="w-full border rounded-lg p-3 text-left hover:bg-orange-50"
                >
                  <div className="flex justify-between">
                    <span>{p.pax} PAX</span>
                    <span className="font-bold">
                      ฿{p.price.toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="mt-4 w-full py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
