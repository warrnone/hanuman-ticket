"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const TYPE_OPTIONS = [
  { value: "PHOTO", label: "PHOTO" },
  { value: "VIDEO", label: "VIDEO" },
  { value: "PHOTO_VIDEO", label: "PHOTO + VIDEO" },
  { value: "ALL", label: "ALL" },
];

export default function MediaReportPage() {
  const [type, setType] = useState("PHOTO");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [dataTop, setDataTop] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
  const [dateError, setDateError] = useState("");

  const isInvalidDateRange =
    startDate && endDate && new Date(startDate) > new Date(endDate);

  useEffect(() => {
    if (isInvalidDateRange) {
      setDateError("Start Date ต้องไม่มากกว่า End Date");
    } else {
      setDateError("");
    }
  }, [startDate, endDate, isInvalidDateRange]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (type && type !== "ALL") params.append("type", type);
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);
    return params.toString();
  };

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/report/media?${buildParams()}`);
      const text = await res.text();

      if (!res.ok) {
        console.error("API Error:", text);
        setData([]);
        return;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON:", text);
        setData([]);
        return;
      }

      setData(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Report error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTop = async () => {
    try {
      setTopLoading(true);

      const res = await fetch(`/api/admin/report/top-media?${buildParams()}`);
      const text = await res.text();

      if (!res.ok) {
        console.error("Top API Error:", text);
        setDataTop([]);
        return;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("Top Invalid JSON:", text);
        setDataTop([]);
        return;
      }

      setDataTop(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Top error:", err);
      setDataTop([]);
    } finally {
      setTopLoading(false);
    }
  };

  const handleFilter = async () => {
    if (isInvalidDateRange) return;
    await Promise.all([fetchReport(), fetchTop()]);
  };

  useEffect(() => {
    handleFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  }, [data]);

  const totalOrders = useMemo(() => {
    const uniqueOrders = new Set(
      data.map((item) => item.order_number || item.order_id).filter(Boolean)
    );
    return uniqueOrders.size;
  }, [data]);

  const totalItems = data.length;

  const totalPax = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.pax_count || 0), 0);
  }, [data]);

  const averagePerItem = totalItems > 0 ? totalRevenue / totalItems : 0;
  const averagePerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const medals = ["🥇", "🥈", "🥉"];

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("th-TH");
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("th-TH");
  };

  const reportTitle = type === "PHOTO_VIDEO" ? "PHOTO + VIDEO" : type === "ALL" ? "ALL MEDIA" : type;

  const exportRows = data.map((item, index) => ({
    No: index + 1,
    Date: formatDate(item.created_at),
    ServiceDate: item.service_date || "",
    OrderNumber: item.order_number || "",
    GuestName: item.guest_name || "",
    ItemType: item.item_type || "",
    MediaType: item.media_type || "",
    SaleMode: item.sale_mode || "",
    ItemCode: item.item_code || "",
    ItemName: item.item_name || "",
    Quantity: Number(item.quantity || 0),
    UnitPrice: Number(item.price || 0),
    TotalPrice: Number(item.total_price || 0),
    PaxCount: Number(item.pax_count || 0),
    IncludedPax: Number(item.included_pax || 0),
    ExtraPax: Number(item.extra_pax || 0),
    BasePrice: Number(item.base_price || 0),
    ExtraPaxPrice: Number(item.extra_pax_price || 0),
    SteppedTotal: Number(item.stepped_total || 0),
    PricingNote: item.pricing_note || "",
  }));

  const handleExport = () => {
    if (exportRows.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Media Report");

    XLSX.writeFile(
      wb,
      `Media_Report_${type}_${startDate || "all"}_${endDate || "all"}.xlsx`
    );
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">📊 Media Sales Report</h1>
        <p className="text-sm text-slate-400">
          รายงาน Photo / Video / Photo+Video พร้อม breakdown แบบ stepping pax
        </p>
      </div>

      <div className="rounded-2xl bg-slate-800 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className={`invert rounded-lg border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
                isInvalidDateRange
                  ? "border-red-500 bg-slate-900 focus:ring-red-500"
                  : "border-slate-600 bg-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={`invert rounded-lg border px-3 py-2 text-white focus:outline-none focus:ring-2 ${
                isInvalidDateRange
                  ? "border-red-500 bg-slate-900 focus:ring-red-500"
                  : "border-slate-600 bg-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>

          <button
            onClick={handleFilter}
            disabled={isInvalidDateRange}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Filter
          </button>

          <button
            onClick={handleExport}
            disabled={exportRows.length === 0 || isInvalidDateRange}
            className="rounded-lg bg-green-600 px-6 py-2 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Excel
          </button>
        </div>

        {dateError ? (
          <p className="mt-3 text-sm text-red-400">{dateError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold">฿ {formatCurrency(totalRevenue)}</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Total Orders</p>
          <p className="mt-1 text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Total Items</p>
          <p className="mt-1 text-2xl font-bold">{totalItems}</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Total Pax</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalPax)}</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-5">
          <p className="text-sm text-slate-400">Average / Order</p>
          <p className="mt-1 text-2xl font-bold">
            ฿{" "}
            {averagePerOrder.toLocaleString("th-TH", {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold">🔥 Top 5 {reportTitle} Best Sellers</h2>

        {topLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : dataTop.length === 0 ? (
          <p className="text-slate-400">No data</p>
        ) : (
          <div className="space-y-3">
            {dataTop.map((item, index) => (
              <div
                key={`${item.item_name}-${item.item_type}-${item.media_type}-${item.sale_mode}-${index}`}
                className="flex items-center justify-between rounded-xl bg-slate-900 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-yellow-400">
                    {medals[index] || `#${index + 1}`}
                  </span>

                  <div>
                    <div className="font-semibold">{item.item_name}</div>
                    <div className="text-xs text-slate-400">
                      {item.item_type || "-"}
                      {item.media_type ? ` • ${item.media_type}` : ""}
                      {item.sale_mode ? ` • ${item.sale_mode}` : ""}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    Sold: {Number(item.total_sold || 0).toLocaleString("th-TH")}
                  </div>
                  <div className="font-bold">
                    ฿ {Number(item.total_revenue || 0).toLocaleString("th-TH")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-slate-800 p-6">
        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading report...</div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-slate-400">No report data</div>
        ) : (
          <table className="w-full min-w-[1800px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-300">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Service Date</th>
                <th className="py-3 pr-4">Order No.</th>
                <th className="py-3 pr-4">Guest</th>
                <th className="py-3 pr-4">Item</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Media</th>
                <th className="py-3 pr-4">Sale Mode</th>
                <th className="py-3 pr-4">Qty</th>
                <th className="py-3 pr-4">Pax</th>
                <th className="py-3 pr-4">Included</th>
                <th className="py-3 pr-4">Extra</th>
                <th className="py-3 pr-4">Base Price</th>
                <th className="py-3 pr-4">Extra/Pax</th>
                <th className="py-3 pr-4">Unit Price</th>
                <th className="py-3 pr-4">Stepped Total</th>
                <th className="py-3 pr-4">Final Total</th>
                <th className="py-3 pr-4">Note</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="align-top border-b border-slate-700">
                  <td className="whitespace-nowrap py-3 pr-4">
                    {formatDate(item.created_at)}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.service_date || "-"}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.order_number || "-"}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.guest_name || "-"}
                  </td>

                  <td className="min-w-[220px] py-3 pr-4">
                    <div className="font-semibold">{item.item_name || "-"}</div>
                    <div className="text-xs text-slate-400">
                      {item.item_code || "-"}
                    </div>
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.item_type || "-"}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.media_type || "-"}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {item.sale_mode || "-"}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {Number(item.quantity || 0).toLocaleString("th-TH")}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {Number(item.pax_count || 0).toLocaleString("th-TH")}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {Number(item.included_pax || 0).toLocaleString("th-TH")}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    {Number(item.extra_pax || 0).toLocaleString("th-TH")}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    ฿ {formatCurrency(item.base_price)}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    ฿ {formatCurrency(item.extra_pax_price)}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    ฿ {formatCurrency(item.price)}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4">
                    ฿ {formatCurrency(item.stepped_total)}
                  </td>

                  <td className="whitespace-nowrap py-3 pr-4 font-semibold text-emerald-400">
                    ฿ {formatCurrency(item.total_price)}
                  </td>

                  <td className="min-w-[220px] py-3 pr-4 text-slate-300">
                    {item.pricing_note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl bg-slate-800 p-5">
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <span className="text-slate-400">Average / Item: </span>
            <span className="font-semibold">
              ฿{" "}
              {averagePerItem.toLocaleString("th-TH", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-400">Rows: </span>
            <span className="font-semibold">{totalItems}</span>
          </div>

          <div>
            <span className="text-slate-400">Filtered Type: </span>
            <span className="font-semibold">{reportTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}