"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminTaxiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxis, setTaxis] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");

  const [form, setForm] = useState({
    car_number: "",
    plate_color: "YELLOW", // YELLOW | GREEN
    vehicle_type: "TAXI",  // TAXI | VAN
  });

  /* =========================
     LOAD AGENTS
  ========================= */
  const loadAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents/taxi?status=ACTIVE");
      if (!res.ok) throw new Error("Load agents failed");

      const data = await res.json();
      setAgents(data.data || []);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Agent ได้");
    }
  };

  /* =========================
     LOAD TAXIS
  ========================= */
  const loadTaxis = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/taxi");
      if (!res.ok) throw new Error("Load taxis failed");

      const data = await res.json();
      setTaxis(data.data || []);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Taxi ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
    loadTaxis();
  }, []);

  /* =========================
     ADD TAXI
  ========================= */
  const addTaxi = async () => {
    if (!form.car_number.trim()) {
      swalError("กรุณากรอกเลขทะเบียนรถ");
      return;
    }

    if (!agentId) {
      swalError("กรุณาเลือก Agent");
      return;
    }

    const result = await swalConfirm(
      "เพิ่ม Taxi",
      `ต้องการเพิ่มรถ ${form.car_number} ใช่หรือไม่`
    );
    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin/taxi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_number: form.car_number.trim(),
          plate_color: form.plate_color,
          vehicle_type: form.vehicle_type,
          agent_id: agentId, // ✅ สำคัญมาก
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Add taxi failed");
      }

      swalSuccess("เพิ่ม Taxi สำเร็จ");

      setForm({
        car_number: "",
        plate_color: "YELLOW",
        vehicle_type: "TAXI",
      });
      setAgentId("");

      loadTaxis();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เพิ่ม Taxi ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     TOGGLE STATUS
  ========================= */
  const toggleStatus = async (taxi) => {
    const result = await swalConfirm(
      taxi.status === "ACTIVE" ? "ปิดใช้งาน Taxi" : "เปิดใช้งาน Taxi",
      taxi.car_number
    );
    if (!result.isConfirmed) return;

    try {
      await fetch(`/api/admin/taxi/${taxi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: taxi.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });

      loadTaxis();
    } catch (err) {
      console.error(err);
      swalError("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold">🚕 Taxi Registration</h1>
        <p className="text-sm text-slate-500">
          ลงทะเบียน Taxi / Van (ป้ายเหลือง, ป้ายเขียว)
        </p>
      </div>

      {/* ================= ADD FORM ================= */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 max-w-xl">
        <div>
          <label className="text-sm font-medium">เลขทะเบียนรถ</label>
          <input
            value={form.car_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, car_number: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            placeholder="เช่น ฆฉ-2357"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">ป้าย</label>
            <select
              value={form.plate_color}
              onChange={(e) =>
                setForm((f) => ({ ...f, plate_color: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="YELLOW">🟨 ป้ายเหลือง</option>
              <option value="GREEN">🟩 ป้ายเขียว</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">ประเภทรถ</label>
            <select
              value={form.vehicle_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicle_type: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="TAXI">Taxi</option>
              <option value="VAN">Van</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Agent</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select Agent --</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addTaxi}
          disabled={saving}
          className="w-full bg-orange-500 text-white py-2 rounded font-medium disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Taxi"}
        </button>
      </div>

      {/* ================= TAXI LIST ================= */}
      <div className="bg-white rounded-xl border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">ทะเบียน</th>
              <th className="p-3">ป้าย</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {taxis.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.car_number}</td>
                <td className="p-3 text-center">
                  {t.plate_color === "YELLOW" ? "🟨" : "🟩"}
                </td>
                <td className="p-3 text-center">{t.vehicle_type}</td>
                <td className="p-3 text-center">
                  {t.status === "ACTIVE" ? "✅ Active" : "⛔ Inactive"}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleStatus(t)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${t.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}
                    `}
                    aria-label="Toggle status"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${t.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"}
                      `}
                    />
                  </button>
                </td>
              </tr>
            ))}

            {!loading && taxis.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  No taxi registered
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
