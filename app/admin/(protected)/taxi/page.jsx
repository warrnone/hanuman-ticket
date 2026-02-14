"use client";

import { useEffect, useState , useRef } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";
import PlayfulLoading  from "@/app/components/PlayfulLoading";
import { useForm } from "react-hook-form";

export default function AdminTaxiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxis, setTaxis] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");

  // Filter ในการค้นหาเพิ่ม Form 
  const [agentSearch, setAgentSearch] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    car_number: "",
    plate_color: "YELLOW", // YELLOW | GREEN
    vehicle_type: "TAXI",  // TAXI | VAN
    driver_first_name_th: "",
    driver_last_name_th: "",
    driver_first_name_en: "",
    driver_last_name_en: "",
    driver_phone: "",
  });

  // Filter ค้นหาทั้งหมด
  const [taxiSearch, setTaxiSearch] = useState("");
  // Edit
  const [editingTaxi, setEditingTaxi] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const didInit = useRef(false);

  const { register, formState: { errors } } = useForm();
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
  const loadTaxis = async ({ initial = false } = {}) => {
    try {
      if (initial) setInitialLoading(true);
      else setRefreshing(true);

      const res = await fetch("/api/admin/taxi");
      if (!res.ok) throw new Error("Load taxis failed");

      const data = await res.json();
      setTaxis(data.data || []);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Taxi ได้");
    } finally {
      if (initial) setInitialLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadAgents();
    loadTaxis({ initial: true });
    searchInputRef.current?.focus();
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

  // highlight คำที่ค้น
  const highlightText = (text, keyword) => {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleKeyDown = (e, filteredAgents) => {
    if (!showAgentDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          i < filteredAgents.length - 1 ? i + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          i > 0 ? i - 1 : filteredAgents.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (filteredAgents[activeIndex]) {
          const a = filteredAgents[activeIndex];
          setAgentId(a.id);
          setAgentSearch(a.name);
          setShowAgentDropdown(false);
          setActiveIndex(-1);
        }
        break;

      case "Escape":
        setShowAgentDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowAgentDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTaxis = taxis.filter((t) =>
    t.car_number
      .toLowerCase()
      .includes(taxiSearch.toLowerCase())
  );

  // Edit  เลขทะเบียน 
  const saveEditTaxi = async () => {
    const ok = await swalConfirm(
      "ยืนยันแก้ไข",
      `บันทึกการแก้ไข ${editingTaxi.car_number} ?`
    );
    if (!ok.isConfirmed) return;

    await fetch(`/api/admin/taxi/${editingTaxi.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        car_number: editingTaxi.car_number,
        plate_color: editingTaxi.plate_color,
        vehicle_type: editingTaxi.vehicle_type,
        agent_id: agentId,
      }),
    });

    swalSuccess("แก้ไข Taxi สำเร็จ");
    setEditingTaxi(null);
    loadTaxis();
  };

  useEffect(() => {
    if (!editingTaxi) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setEditingTaxi(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [editingTaxi]);

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

        {/* ================= DRIVER INFORMATION ================= */}
        <div className="bg-gray-50 border rounded-xl p-5 mt-6 space-y-5">

          <h3 className="text-base font-semibold text-gray-800 border-b pb-2">
            🚕 Driver Information
          </h3>

          {/* ===== Thai Name ===== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                First Name (TH)
              </label>
              <input
                type="text"
                value={form.driver_first_name_th || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^ก-๙\s]/g, "");
                  setForm({ ...form, driver_first_name_th: value });
                }}
                placeholder="ชื่อภาษาไทย"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                          outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Last Name (TH)
              </label>
              <input
                type="text"
                value={form.driver_last_name_th || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^ก-๙\s]/g, "");
                  setForm({ ...form, driver_last_name_th: value });
                }}
                placeholder="นามสกุลภาษาไทย"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                          outline-none transition-all"
              />
            </div>
          </div>

          {/* ===== English Name ===== */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                First Name (EN)
              </label>
              <input
                type="text"
                value={form.driver_first_name_en || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                  setForm({ ...form, driver_first_name_en: value });
                }}
                placeholder="First name"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                          outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Last Name (EN)
              </label>
              <input
                type="text"
                value={form.driver_last_name_en || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                  setForm({ ...form, driver_last_name_en: value });
                }}
                placeholder="Last name"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                          outline-none transition-all"
              />
            </div>
          </div>

          {/* ===== Phone ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Driver Phone (Thailand)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.driver_phone || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, driver_phone: value });
              }}
              placeholder="0812345678"
              maxLength={10}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm 
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                        outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Thai mobile format (10 digits)
            </p>
          </div>

        </div>

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
          <label className="text-sm font-medium">Agent นอก</label>
            <div className="relative" ref={dropdownRef}>
              {/* SEARCH */}
              <input
                ref={inputRef}
                type="text"
                placeholder="ค้นหา Agent..."
                value={agentSearch}
                onChange={(e) => {
                  setAgentSearch(e.target.value);
                  setShowAgentDropdown(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setShowAgentDropdown(true)}
                onKeyDown={(e) =>
                  handleKeyDown(
                    e,
                    agents.filter((a) =>
                      a.name.toLowerCase().includes(agentSearch.toLowerCase())
                    )
                  )
                }
                className="w-full border rounded px-3 py-2"
              />

              {/* DROPDOWN */}
              {showAgentDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-y-auto">
                  {agents
                    .filter((a) =>
                      a.name.toLowerCase().includes(agentSearch.toLowerCase())
                    )
                    .map((a, i) => (
                      <div
                        key={a.id}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => {
                          setAgentId(a.id);
                          setAgentSearch(a.name);
                          setShowAgentDropdown(false);
                          setActiveIndex(-1);
                        }}
                        className={`px-3 py-2 cursor-pointer
                          ${i === activeIndex ? "bg-blue-100" : "hover:bg-slate-100"}
                        `}
                      >
                        {highlightText(a.name, agentSearch)}
                      </div>
                    ))}

                  {/* ไม่พบข้อมูล */}
                  {!agents.some((a) =>
                    a.name.toLowerCase().includes(agentSearch.toLowerCase())
                  ) && (
                    <div className="px-3 py-2 text-slate-400 text-sm">
                      ไม่พบ Agent
                    </div>
                  )}
                </div>
              )}
            </div>
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

        {initialLoading ? (
          <>
            <PlayfulLoading/>
          </>
          ): (
          <>
            {/* SEARCH TAXI */}
            <div className="p-4 border-b bg-slate-50">
              <input
                type="text"
                placeholder="ค้นหาเลขทะเบียน Taxi..."
                value={taxiSearch}
                onChange={(e) => setTaxiSearch(e.target.value)}
                className="w-full max-w-sm border rounded px-3 py-2"
              />
            </div>

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
                {filteredTaxis.map((t) => (
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
                      <div className="flex items-center justify-end gap-3">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingTaxi(t);
                            setAgentId(t.agent_id);
                            setAgentSearch(
                              agents.find(a => a.id === t.agent_id)?.name || ""
                            );
                          }}
                          className="px-4 py-2 text-sm font-medium bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>

                        {/* Status Toggle */}
                        <button
                          onClick={() => toggleStatus(t)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 shadow-sm
                            ${t.status === "ACTIVE" 
                              ? "bg-green-500 hover:bg-green-600" 
                              : "bg-gray-300 hover:bg-gray-400"
                            }
                          `}
                          aria-label={`Toggle status: ${t.status === "ACTIVE" ? "Active" : "Inactive"}`}
                          title={t.status === "ACTIVE" ? "Click to deactivate" : "Click to activate"}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
                              ${t.status === "ACTIVE" ? "translate-x-8" : "translate-x-1"}
                            `}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredTaxis.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      ไม่พบ Taxi ที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}          
      </div>

      {editingTaxi && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingTaxi(null)}
        >
          <form
            className="bg-white p-6 rounded-xl w-full max-w-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();   // 👈 กัน reload
              saveEditTaxi();       // 👈 Enter = Save
            }}
          >
            <h2 className="font-bold text-lg">แก้ไข Taxi</h2>

            <input
              autoFocus
              className="w-full border rounded px-3 py-2"
              value={editingTaxi.car_number}
              onChange={(e) =>
                setEditingTaxi({ ...editingTaxi, car_number: e.target.value })
              }
            />

            {/* plate_color / vehicle_type / agent dropdown ใช้ชุดเดิม */}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingTaxi(null)}
              >
                Cancel
              </button>

              <button
                type="submit"   // 👈 สำคัญ
                className="bg-orange-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
