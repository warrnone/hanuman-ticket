"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);

  const [form, setForm] = useState({
    name: "",
    agent_type: "TAXI", // TAXI | TOUR | HOTEL | COMPANY
    commission_rate: 0,
    status: "ACTIVE",
  });

  /* =========================
     LOAD AGENTS
  ========================= */
  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Load agents failed");

      const json = await res.json();
      setAgents(json.data || []);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Agent ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadAgents();
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
          status: form.status,
        }),
      });

      if (!res.ok) throw new Error("Add agent failed");

      swalSuccess("เพิ่ม Agent สำเร็จ");
      setForm({
        name: "",
        agent_type: "TAXI",
        commission_rate: 0,
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
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">ชื่อ</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">Commission</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3"></th>
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
                <td className="p-3 text-center">
                  {a.status === "ACTIVE" ? "✅ Active" : "⛔ Inactive"}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleStatus(a)}
                    className="text-blue-600 hover:underline"
                  >
                    Toggle
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
      </div>
    </div>
  );
}
