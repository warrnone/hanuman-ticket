"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const stats = {
    users: 12,
    packages: 18,
    ordersToday: 0,
    revenueToday: 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card title="Users" value={stats.users} emoji="👥" />
        <Card title="Packages" value={stats.packages} emoji="📦" />
        <Card title="Orders Today" value={stats.ordersToday} emoji="🧾" />
        <Card title="Revenue Today" value={`฿${stats.revenueToday}`} emoji="💰" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users" className="btn">➕ Add User</Link>
          <Link href="/admin/packages" className="btn">➕ Add Package</Link>
          <Link href="/admin/settings" className="btn">⚙️ Settings</Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, emoji }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="text-3xl">{emoji}</div>
    </div>
  );
}
