"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "./components/StatCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    packages: 0,
    ordersToday: 0,
    revenueToday: 0,
  });

  const [salesChart, setSalesChart] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();

      setStats(data.stats);
      setSalesChart(data.salesChart);
      setLatestOrders(data.latestOrders);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          ภาพรวมระบบ Hanuman Ticket
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Users" value={stats.users} emoji="👥" />
        <StatCard title="Packages" value={stats.packages} emoji="📦" />
        <StatCard title="Orders Today" value={stats.ordersToday} emoji="🧾" />
        <StatCard
          title="Revenue Today"
          value={`฿${stats.revenueToday.toLocaleString()}`}
          emoji="💰"
        />
      </div>

      {/* SALES CHART */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold mb-4">📈 Daily Sales</h2>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={salesChart}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* LATEST ORDERS */}
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">🧾 Latest Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {latestOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">ยังไม่มี order วันนี้</p>
        ) : (
          <div className="space-y-3">
            {latestOrders.map((o) => (
              <div
                key={o.id}
                className="flex justify-between items-center border-b pb-2 text-sm"
              >
                <div>
                  <p className="font-medium">Order #{o.id}</p>
                  <p className="text-gray-500">
                    {new Date(o.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="font-semibold">
                  ฿{o.total_price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
