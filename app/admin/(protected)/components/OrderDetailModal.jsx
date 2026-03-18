"use client";

import { useEffect, useState } from "react";

export default function OrderDetailModal({ id, onClose }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      setOrder(json.data);
    };
    load();
  }, [id]);

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded">Loading...</div>
      </div>
    );
  }

  return (
    <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
    >
      
      <div 
        className="bg-white w-[500px] rounded-2xl shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-xl"
        >
          ✖
        </button>

        <h1 className="text-xl font-bold mb-4">🧾 Order Detail</h1>

        {/* BASIC */}
        <div className="mb-4">
          <p><b>Guest:</b> {order.guest_name}</p>
          <p><b>Total:</b> ฿{order.total_amount}</p>
          <p><b>Status:</b> {order.payment_status}</p>
          <p><b>Channel:</b> {order.source_channels?.name}</p>
          <p><b>Agent:</b> {order.agents?.name}</p>
        </div>

        {/* ITEMS */}
        <div>
          <h2 className="font-semibold mb-2">Items</h2>
          {order.items.map((item) => (
            <div key={item.id} className="border-b py-2">
              {item.item_name} x {item.quantity} = ฿{item.price}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}