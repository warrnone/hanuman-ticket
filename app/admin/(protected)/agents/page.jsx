"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);

  const [form, setForm] = useState({
    name: "",
    agent_type: "TAXI", // TAXI | TOUR | HOTEL | COMPANY
    commission_rate: 0,
    phone: "",
    status: "ACTIVE",
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);


  /* =========================
     LOAD AGENTS
  ========================= */
  const loadAgents = async (pageNumber = page) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/agents?page=${pageNumber}&limit=${limit}`
      );

      if (!res.ok) throw new Error("Load agents failed");

      const json = await res.json();

      setAgents(json.data || []);
      setTotalPages(json.pagination.totalPages || 1);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Agent ได้");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAgents();
  }, []);

  /* =========================
     ADD AGENT
  ========================= */
  const addAgent = async () => {
    if (!form.name.trim()) {
      swalError("กรุณากรอกชื่อ Agent");
      return;
    }

    const ok = await swalConfirm(
      "เพิ่ม Agent",
      `ต้องการเพิ่ม Agent "${form.name}" ใช่หรือไม่`
    );
    if (!ok.isConfirmed) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          agent_type: form.agent_type,
          commission_rate: Number(form.commission_rate),
          phone:form.phone,
          status: form.status,
        }),
      });

      if (!res.ok) throw new Error("Add agent failed");

      swalSuccess("เพิ่ม Agent สำเร็จ");
      setForm({
        name: "",
        agent_type: "TAXI",
        commission_rate: 0,
        phone: "",
        status: "ACTIVE",
      });
      loadAgents();
    } catch (err) {
      console.error(err);
      swalError("เพิ่ม Agent ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     TOGGLE STATUS
  ========================= */
  const toggleStatus = async (agent) => {
    const ok = await swalConfirm(
      agent.status === "ACTIVE" ? "ปิดใช้งาน Agent" : "เปิดใช้งาน Agent",
      agent.name
    );
    if (!ok.isConfirmed) return;

    try {
      await fetch(`/api/admin/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: agent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });

      loadAgents();
    } catch (err) {
      console.error(err);
      swalError("อัปเดตสถานะไม่สำเร็จ");
    }
  };

    // Helper function สำหรับแสดงเบอร์โทร
  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Format: 087-654-4565
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Handler สำหรับ input เบอร์โทร
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^0-9]/g, '');
    
    // จำกัดไม่เกิน 10 หลัก
    if (cleaned.length <= 10) {
      setForm((f) => ({ ...f, phone: cleaned }));
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div>
        <h1 className="text-2xl font-bold">🤝 Agent Management</h1>
        <p className="text-sm text-slate-500">
          จัดการ Agent / Partner สำหรับ Commission
        </p>
      </div>

      {/* =========================
          ADD AGENT FORM
      ========================= */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 max-w-xl">
        <div>
          <label className="text-sm font-medium">ชื่อ Agent</label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            placeholder="เช่น Somchai Taxi / Green Van Phuket"
          />
        </div>

        <div>
          <label className="text-sm font-medium">เบอร์โทรศัพท์</label>
          <input
            value={formatPhoneDisplay(form.phone)}
            onChange={handlePhoneChange}
            className="w-full border rounded px-3 py-2"
            placeholder="087-654-4565"
            type="tel"
          />
          <p className="text-xs text-slate-400 mt-1">
            รูปแบบ: 0XX-XXX-XXXX (10 หลัก)
          </p>
        </div>


        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">ประเภท Agent</label>
            <select
              value={form.agent_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, agent_type: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="TAXI">Taxi</option>
              <option value="TOUR">Tour Agent</option>
              <option value="HOTEL">Hotel</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">Commission (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.commission_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, commission_rate: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={addAgent}
          disabled={saving}
          className="w-full bg-orange-500 text-white py-2 rounded font-medium"
        >
          {saving ? "Saving..." : "Add Agent"}
        </button>
      </div>

      {/* =========================
          AGENT LIST
      ========================= */}
      <div className="bg-white rounded-xl border shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-slate-200 rounded flex-1"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ):(
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">โทร</th>
                  <th className="p-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-medium">{a.name}</td>
                    <td className="p-3 text-center">{a.agent_type}</td>
                    <td className="p-3 text-center">
                      {Number(a.commission_rate).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {a.phone ? formatPhoneDisplay(a.phone) : "-"}
                    </td>
                    <td className="p-3 text-center">
                      {a.status === "ACTIVE" ? "✅ Active" : "⛔ Inactive"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleStatus(a)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${a.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}
                        `}
                        aria-label="Toggle status"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${a.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"}
                          `}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No agents registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4">
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => loadAgents(page - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    <IoIosArrowBack /> Prev
                  </button>

                  <button
                    disabled={page === totalPages}
                    onClick={() => loadAgents(page + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    Next <IoIosArrowForward />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
