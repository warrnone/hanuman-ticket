"use client";

export default function StatCard({ title, value, emoji }) {
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
