"use client";

import { useEffect, useState } from "react";
import OrderDetailModal from "../components/OrderDetailModal";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);



  const loadOrders = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setOrders([]);
        return;
      }

      const json = await res.json();
      setOrders(json.data || []);
    } catch (err) {
      const offlineNow =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offlineNow) return;

      console.error("loadOrders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateNetworkStatus = () => {
      if (typeof navigator !== "undefined") {
        setIsOffline(!navigator.onLine);
      }
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  useEffect(() => {
    loadOrders();
  }, [search, status]);

  useEffect(() => {
    if (!isOffline) {
      loadOrders();
    }
  }, [isOffline]);

  return (
    <div className="p-6">
      {isOffline && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          ไม่มีการเชื่อมต่ออินเทอร์เน็ต ข้อมูลออเดอร์อาจไม่อัปเดต
        </div>
      )}

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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-white border-b-slate-500 animate-spin" />
            <p className="text-sm text-slate-400 tracking-wide">Loading orders...</p>
          </div>
        ) : (
          <>
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
                    onClick={() => {
                      if (isOffline) return;
                      setSelectedOrderId(o.id);
                    }}
                    className={`border-t transition ${
                      isOffline
                        ? "cursor-not-allowed bg-gray-50"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-3">{o.guest_name || "-"}</td>
                    <td className="p-3 text-center">
                      {o.source_channels?.name || "-"}
                    </td>
                    <td className="p-3 text-center">
                      {o.agents?.name || "-"}
                    </td>
                    <td className="p-3 text-center">
                      ฿{Number(o.total_amount || 0).toLocaleString("th-TH")}
                    </td>
                    <td className="p-3 text-center">
                      {o.payment_status || "-"}
                    </td>
                    <td className="p-3 text-center">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                {isOffline ? "No internet connection" : "No orders found"}
              </div>
            )}

            {selectedOrderId && !isOffline && (
              <OrderDetailModal
                id={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}