"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const loadOrder = async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    const json = await res.json();
    setOrder(json.data);
  };

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  if (!order) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        🧾 Order Detail
      </h1>

      {/* BASIC INFO */}
      <div className="bg-white p-4 rounded shadow">
        <p><b>Guest:</b> {order.guest_name}</p>
        <p><b>Total:</b> ฿{order.total_amount}</p>
        <p><b>Status:</b> {order.payment_status}</p>
        <p><b>Channel:</b> {order.source_channels?.name}</p>
        <p><b>Agent:</b> {order.agents?.name}</p>
      </div>

      {/* ITEMS */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Items</h2>

        {order.items.map((item) => (
          <div key={item.id} className="border-b py-2">
            {item.item_name} x {item.quantity} = ฿{item.price}
          </div>
        ))}
      </div>
    </div>
  );
}