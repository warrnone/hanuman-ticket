"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const loadOrders = async () => {
    const res = await fetch(
      `/api/admin/orders?search=${search}&status=${status}`
    );
    const json = await res.json();
    setOrders(json.data || []);
  };

  useEffect(() => {
    loadOrders();
  }, [search, status]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        🧾 Orders Management
      </h1>

      {/* FILTER */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search guest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-60"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Guest</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Agent</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr 
                key={o.id} 
                onClick={() => router.push(`/admin/orders/${o.id}`)}
                className="border-t cursor-pointer hover:bg-gray-50 transition"
              >
                <td className="p-3">{o.guest_name}</td>
                <td className="p-3 text-center">
                  {o.source_channels?.name}
                </td>
                <td className="p-3 text-center">
                  {o.agents?.name}
                </td>
                <td className="p-3 text-center">
                  ฿{o.total_amount}
                </td>
                <td className="p-3 text-center">
                  {o.payment_status}
                </td>
                <td className="p-3 text-center">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}