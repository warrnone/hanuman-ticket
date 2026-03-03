"use client";

import { useEffect, useState } from "react";
import {ResponsiveContainer,PieChart,Pie,Legend,} from "recharts";
import StatCard from "./components/StatCard";
import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [weeklyComparison, setWeeklyComparison] = useState(null);
  const [taxiHealth, setTaxiHealth] = useState(null);
  const [packageSummary, setPackageSummary] = useState([]);
  const [orderSource, setOrderSource] = useState({ taxi: 0, walkin: 0 });
  const [taxiStatusList, setTaxiStatusList] = useState([]);
  const [productChannelMatrix, setProductChannelMatrix] = useState([]);
  const [plateRevenue, setPlateRevenue] = useState(null);
  const [profitMargin, setProfitMargin] = useState([]);
  const [sourceChannelStats, setSourceChannelStats] = useState([]);
  const [topSources, setTopSources] = useState([]);
  const [taxiPerformance, setTaxiPerformance] = useState([]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats || {});
      setWeeklyComparison(data.weeklyComparison || null);
      setTaxiHealth(data.taxiHealth || null);
      setPackageSummary(data.packageSummary || []);
      setOrderSource(data.orderSource || { taxi: 0, walkin: 0 });
      setTaxiStatusList(data.taxiStatusList || []);
      setProductChannelMatrix(data.productChannelMatrix || []);
      setPlateRevenue(data.plateRevenue || null);
      setProfitMargin(data.profitMargin || []);
      setSourceChannelStats(data.sourceChannelStats || []);
      setTopSources(data.topSources || []);
      setTaxiPerformance(data.taxiPerformance || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await fetch("/api/admin/export-daily");
    const data = await res.json();

    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Report");

    XLSX.writeFile(wb, "Daily_Report.xlsx");
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const growth = weeklyComparison?.percentChange || 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center z-50">
        
        {/* Ambient glow */}
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-700" />

        {/* Logo / Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <span className="text-3xl">📊</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-transparent border-t-blue-400 border-r-blue-400/50 animate-spin" />
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl font-bold tracking-wide mb-1">
          CEO Dashboard
        </h1>
        <p className="text-slate-400 text-sm mb-10 tracking-widest uppercase">
          Loading your data...
        </p>

        {/* Skeleton cards */}
        <div className="grid grid-cols-3 gap-3 w-80 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                  animationDelay: `${i * 150}ms`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes shimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes progress {
            0%   { width: 0%;   margin-left: 0%; }
            50%  { width: 70%;  margin-left: 15%; }
            100% { width: 0%;   margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          🚖 Export Taxi Commission
        </button>
      </div>

      {/* ================= CEO HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold">
          📊 Business Intelligence Dashboard
        </h1>
        <p className="text-gray-500">
          Revenue · Profit · Partner Performance
        </p>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Revenue Today"
          value={`฿${Number(stats.revenueToday || 0).toLocaleString()}`}
          emoji="💰"
        />
        <StatCard
          title="Profit Today"
          value={`฿${Number(stats.profitToday || 0).toLocaleString()}`}
          emoji="📈"
        />
        <StatCard
          title="Taxi Commission"
          value={`฿${Number(stats.taxiCommissionToday || 0).toLocaleString()}`}
          emoji="💸"
        />
        {/** Weekly Growth คือการดู “แนวโน้มรายได้สัปดาห์นี้เทียบกับสัปดาห์ก่อน” */}
        <StatCard
          title="Weekly Growth"
          value={`${growth}%`}
          emoji={growth >= 0 ? "📈" : "📉"}
          valueClassName={
            growth > 0
              ? "text-green-600"
              : growth < 0
              ? "text-red-600"
              : "text-gray-600"
          }
        />
      </div>

      {/* ================= SOURCE CHANNEL PERFORMANCE ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">🏷 Agent / Source Channel Performance</h2>

        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-gray-500">
              <th className="text-left py-2 px-4">Channel</th>
              <th className="text-right py-2 px-4">Orders</th>
              <th className="text-right py-2 px-4">Revenue</th>
              <th className="text-right py-2 px-4">Commission</th>
            </tr>
          </thead>
          <tbody>
            {sourceChannelStats.map((s, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">
                  {s.name}
                </td>
                <td className="text-right py-2 px-4">
                  {s.orders}
                </td>
                <td className="text-right py-2 px-4">
                  ฿{Number(s.totalSales).toLocaleString()}
                </td>
                <td className="text-right py-2 px-4 font-semibold text-blue-600">
                  ฿{Number(s.totalCommission).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= TAXI HEALTH ================= */}
      {taxiHealth && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">🚦 Partner Performance Intelligence</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {taxiHealth.total}
              </p>
              <p className="text-gray-500 text-sm">Total Taxi</p>
            </div>
            <div className="text-green-600">
              <p className="text-2xl font-bold">
                {taxiHealth.green}
              </p>
              <p className="text-sm">Healthy</p>
            </div>
            <div className="text-yellow-500">
              <p className="text-2xl font-bold">
                {taxiHealth.yellow}
              </p>
              <p className="text-sm">Warning</p>
            </div>
            <div className="text-red-600">
              <p className="text-2xl font-bold">
                {taxiHealth.red}
              </p>
              <p className="text-sm">Risk</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= SOURCE MIX ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">🧭 Order Source Mix Today</h2>
         {orderSource.taxi === 0 && orderSource.walkin === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-blue-500">
              <p>ไม่มีข้อมูลวันนี้</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: "Taxi", value: orderSource.taxi },
                  { name: "Walk-in", value: orderSource.walkin },
                ]}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ================= TOP PACKAGES ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">🔥 Top Packages</h2>
        {packageSummary
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p, i) => (
            <div
              key={i}
              className="flex justify-between border-b py-2"
            >
              <span>
                {i + 1}. {p.package}
              </span>
              <span className="font-semibold">
                ฿{p.revenue.toLocaleString()}
              </span>
            </div>
        ))}
      </div>

      {/* ================= TOP SOURCE CHANNELS ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">🔥 Top Performing Channels</h2>

        {topSources.map((s, i) => (
          <div key={i} className="flex justify-between border-b py-2">
            <span>{i + 1}. {s.name}</span>
            <span className="font-semibold">
              ฿{Number(s.totalSales).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* ================= PACKAGE TABLE ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          📦 Package Performance
        </h2>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left">Package</th>
              <th>Orders</th>
              <th>Quantity</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {packageSummary.map((p, i) => (
              <tr key={i} className="border-b">
                <td className="text-left">{p.package}</td>
                <td className="text-center">{p.orders}</td>
                <td className="text-center">{p.quantity}</td>
                <td className="text-center">
                  ฿{p.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= TAXI STATUS ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">🚕 Taxi Performance Detail</h2>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-gray-500">
              <th className="text-left py-2 px-4">Taxi</th>
              <th className="text-left py-2 px-4">Status</th>
              <th className="text-right py-2 px-4">Orders (7d)</th>
              <th className="text-right py-2 px-4">Commission</th>
            </tr>
          </thead>
          <tbody>
            {taxiStatusList.map((t) => (
              <tr key={t.taxi_id} className="border-b hover:bg-gray-50">
                <td className="text-left py-2 px-4 font-medium">{t.car_number}</td>
                <td className="text-left py-2 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${t.status === "GREEN"  ? "bg-green-100 text-green-700"
                      : t.status === "YELLOW" ? "bg-yellow-100 text-yellow-700"
                      :                         "bg-red-100 text-red-700"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${t.status === "GREEN"  ? "bg-green-500"
                      : t.status === "YELLOW" ? "bg-yellow-500"
                      :                         "bg-red-500"}`}
                    />
                    {t.status}
                  </span>
                </td>
                <td className="text-right py-2 px-4">{t.orders_7d}</td>
                <td className="text-right py-2 px-4 font-medium">
                  ฿{Number(t.unpaid_commission).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= Product × Channel Matrix ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">📊 Product × Channel Matrix</h2>

        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-gray-500">
              <th className="text-left py-2 px-4">Package</th>
              <th className="text-right py-2 px-4">Yellow</th>
              <th className="text-right py-2 px-4">Green</th>
              <th className="text-right py-2 px-4">Walk-in</th>
              <th className="text-right py-2 px-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {productChannelMatrix.map((p, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="text-left py-2 px-4">{p.package}</td>
                <td className="text-right py-2 px-4">{p.yellow || "—"}</td>
                <td className="text-right py-2 px-4">{p.green || "—"}</td>
                <td className="text-right py-2 px-4">{p.walkin || "—"}</td>
                <td className="text-right py-2 px-4 font-semibold">{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= Revenue by Plate =================*/}
      {plateRevenue && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">
            🚕 Revenue by Plate Color
          </h2>
          <div className="flex justify-between">
            <div className="text-yellow-600 font-bold">
              Yellow: ฿{plateRevenue.yellow.toLocaleString()}
            </div>
            <div className="text-green-600 font-bold">
              Green: ฿{plateRevenue.green.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* ================= Profit Margin by Package ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          💰 Profit Margin by Package
        </h2>

        {profitMargin.map((p, i) => (
          <div key={i} className="flex justify-between border-b py-2">
            <span>{p.package}</span>
            <span className="font-semibold">
              {p.margin}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
