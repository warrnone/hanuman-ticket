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
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: 0,
    packages: 0,
    ordersToday: 0,
    revenueToday: 0,
    taxiOrdersToday: 0,
    taxiRevenueToday: 0,
  });

  const [salesChart, setSalesChart] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [topTaxis, setTopTaxis] = useState([]);
  const [orderSource, setOrderSource] = useState({
    taxi: 0,
    walkin: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Dashboard fetch failed");

      const data = await res.json();

      setStats(data.stats || {});
      setSalesChart(data.salesChart || []);
      setLatestOrders(data.latestOrders || []);
      setTopTaxis(data.topTaxis || []);
      setOrderSource(data.orderSource || { taxi: 0, walkin: 0 });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          ภาพรวมระบบ Hanuman Ticket
        </p>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Users" value={stats.users} emoji="👥" />
        <StatCard title="Packages" value={stats.packages} emoji="📦" />
        <StatCard title="Orders Today" value={stats.ordersToday} emoji="🧾" />
        <StatCard
          title="Revenue Today"
          value={`${Number(stats.revenueToday || 0).toLocaleString()}฿`}
          emoji="💰"
        />
        <StatCard
          title="Taxi Orders"
          value={stats.taxiOrdersToday}
          emoji="🚕"
        />
        <StatCard
          title="Taxi Revenue"
          value={`${stats.taxiRevenueToday.toLocaleString()}฿`}
          emoji="💸"
        />
      </div>

      {/* ================= SALES CHART ================= */}
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
            <Line
              type="monotone"
              dataKey="taxi"
              stroke="#f97316"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-slate-400 mt-2">
          🔵 Total Sales | 🟠 Taxi Sales
        </p>
      </div>

      {/* ================= TAXI INSIGHT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP TAXI */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">🚕 Top Taxi Today</h2>

          {topTaxis.length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีข้อมูล Taxi</p>
          ) : (
            <div className="space-y-2 text-sm">
              {topTaxis.map((t, idx) => (
                <div
                  key={t.taxi_id}
                  className="flex justify-between border-b pb-2"
                >
                  <span>
                    {idx + 1}. {t.car_number}
                  </span>
                  <span className="font-medium">
                    {t.orders} orders · ฿{t.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORDER SOURCE */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">🧭 Order Source</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>🚕 Taxi</span>
              <span className="font-medium">{orderSource.taxi}%</span>
            </div>
            <div className="flex justify-between">
              <span>🚶 Walk-in</span>
              <span className="font-medium">{orderSource.walkin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LATEST ORDERS ================= */}
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
                  <p className="font-medium">
                    Order #{o.order_code || o.id}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {o.taxi
                      ? `🚕 ${o.taxi.car_number}`
                      : "🚶 Walk-in"}
                  </p>
                </div>
                <div className="font-semibold">
                  ฿{o.total_amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
