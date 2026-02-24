"use client";

import { useEffect, useState } from "react";

export default function CommissionPage() {
  const [data, setData] = useState([]);
  const [date, setDate] = useState("");

  const loadData = async () => {
    const res = await fetch(
      `/api/admin/commission${date ? `?date=${date}` : ""}`
    );
    const json = await res.json();
    setData(json.data || []);
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const money = (n) =>
    Number(n).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        🚕 Commission Report
      </h1>

      <div className="mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Taxi</th>
              <th className="p-3 text-right">Orders</th>
              <th className="p-3 text-right">Total Sales</th>
              <th className="p-3 text-right">Commission</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{row.taxi}</td>
                <td className="p-3 text-right">
                  {row.total_orders}
                </td>
                <td className="p-3 text-right">
                  {money(row.total_sales)} ฿
                </td>
                <td className="p-3 text-right font-bold text-green-600">
                  {money(row.total_commission)} ฿
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No data
          </div>
        )}
      </div>
    </div>
  );
}