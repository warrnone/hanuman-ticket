"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function MediaReportPage() {
  const [type, setType] = useState("PHOTO");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataTop , setDataTop] = useState([]);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (type && type !== "ALL") params.append("type", type);
      if (startDate) params.append("start", startDate);
      if (endDate) params.append("end", endDate);

      const res = await fetch(
        `/api/admin/report/media?${params.toString()}`
      );

      // 🔥 กันกรณี API พังแล้วได้ HTML กลับมา
      const text = await res.text();

      if (!res.ok) {
        console.error("API Error:", text);
        return;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      setData(json.data || []);
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTop = async () => {
    try {
      const res = await fetch(`/api/admin/report/top-media?type=${type}`);
      const json = await res.json();
      setDataTop(json.data || []);
    } catch (err) {
      console.error("Top error:", err);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchTop();
  }, []);

  const totalRevenue = data.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  const totalCount = data.length;
  const average = totalCount > 0 ? totalRevenue / totalCount : 0;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Media Report");

    XLSX.writeFile(
      wb,
      `Media_Report_${type}_${startDate || "all"}_${endDate || "all"}.xlsx`
    );
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-10 text-white">

      <h1 className="text-3xl font-bold">
        📊 Media Sales Report
      </h1>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap gap-4 items-end bg-slate-800 p-6 rounded-xl">

        <div>
          <label className="block text-slate-300 text-sm mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-slate-900 text-white border border-slate-600 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PHOTO">PHOTO</option>
            <option value="VIDEO">VIDEO</option>
            <option value="ALL">ALL</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 text-white border border-slate-600 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 invert"
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 text-white border border-slate-600 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 invert"
          />
        </div>

        <button
          onClick={fetchReport}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold"
        >
          Filter
        </button>

        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
        >
          Export Excel
        </button>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">
            Total Revenue
          </p>
          <p className="text-2xl font-bold">
            ฿ {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">
            Total Orders
          </p>
          <p className="text-2xl font-bold">
            {totalCount}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">
            Average per Order
          </p>
          <p className="text-2xl font-bold">
            ฿{" "}
            {average.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* TOP 5 MEDIA */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">
          🔥 Top 5 {type} Best Sellers
        </h2>

        {dataTop.length === 0 ? (
          <p className="text-slate-400">No data</p>
        ) : (
          <div className="space-y-3">
            {dataTop.map((item, index) => (
              <div
                key={item.item_name}
                className="flex justify-between items-center bg-slate-900 p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-yellow-400">
                    {medals[index] || `#${index + 1}`}
                  </span>
                  <span className="font-semibold">
                    {item.item_name}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    Sold: {item.total_sold}
                  </div>
                  <div className="font-bold">
                    ฿ {item.total_revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-slate-800 p-6 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="wave-container">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="py-2">Date</th>
                <th>Order</th>
                <th>Type</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-700"
                >
                  <td className="py-2">
                    {new Date(
                      item.created_at
                    ).toLocaleDateString()}
                  </td>
                  <td>{item.item_name}</td>
                  <td>{item.item_type}</td>
                  <td>
                    ฿{" "}
                    {Number(
                      item.total_price
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}