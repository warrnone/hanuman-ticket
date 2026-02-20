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
    commission_rate: 20, // Default commission rate
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

  useEffect(() => {
    if (agents.length > 0 && !agentId) {
      const independent = agents.find(
        (a) => a.name === "Independent Taxi Driver"
      );

      if (independent) {
        setAgentId(independent.id);
        setAgentSearch(independent.name);
      }
    }
  }, [agents]);

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
          driver_first_name_th: form.driver_first_name_th,
          driver_last_name_th: form.driver_last_name_th,
          driver_first_name_en: form.driver_first_name_en,
          driver_last_name_en: form.driver_last_name_en,
          driver_phone: form.driver_phone,
          commission_rate: form.commission_rate ?? null,
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
        driver_first_name_th: "",
        driver_last_name_th: "",
        driver_first_name_en: "",
        driver_last_name_en: "",
        driver_phone: "",
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

  const filteredTaxis = taxis.filter((t) => {
    const keyword = taxiSearch.toLowerCase();

    return (
      t.car_number?.toLowerCase().includes(keyword) ||
      t.driver_first_name_th?.toLowerCase().includes(keyword) ||
      t.driver_last_name_th?.toLowerCase().includes(keyword) ||
      t.driver_first_name_en?.toLowerCase().includes(keyword) ||
      t.driver_last_name_en?.toLowerCase().includes(keyword) ||
      t.driver_phone?.toLowerCase().includes(keyword) ||
      t.plate_color?.toLowerCase().includes(keyword) ||
      t.vehicle_type?.toLowerCase().includes(keyword)
    );
  });

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
        driver_first_name_th: editingTaxi.driver_first_name_th,
        driver_last_name_th: editingTaxi.driver_last_name_th,
        driver_phone: editingTaxi.driver_phone,
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

  const formatPhone = (value) => {
    if (!value) return "";

    const cleaned = value.replace(/\D/g, "").slice(0, 10);

    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;

    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ================= HEADER ================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            🚕 Taxi Registration
          </h1>
          <p className="text-base text-slate-500 mt-2">
            ลงทะเบียน Taxi / Van (ป้ายเหลือง, ป้ายเขียว)
          </p>
        </div>

        {/* ================= ADD FORM ================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-200">
            เพิ่ม Taxi ใหม่
          </h2>

          <div className="space-y-8">
            {/* ================= DRIVER INFORMATION ================= */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 space-y-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-blue-200">
                <span className="text-2xl">👤</span>
                Driver Information
              </h3>

              {/* ===== Thai Name ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-red-500">*</span> First Name (TH)
                  </label>
                  <input
                    type="text"
                    value={form.driver_first_name_th || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^ก-๙\s]/g, "");
                      setForm({ ...form, driver_first_name_th: value });
                    }}
                    placeholder="ชื่อภาษาไทย"
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-red-500">*</span> Last Name (TH)
                  </label>
                  <input
                    type="text"
                    value={form.driver_last_name_th || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^ก-๙\s]/g, "");
                      setForm({ ...form, driver_last_name_th: value });
                    }}
                    placeholder="นามสกุลภาษาไทย"
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />
                </div>
              </div>

              {/* ===== English Name ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-red-500">*</span> First Name (EN)
                  </label>
                  <input
                    type="text"
                    value={form.driver_first_name_en || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                      setForm({ ...form, driver_first_name_en: value });
                    }}
                    placeholder="First name"
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-red-500">*</span> Last Name (EN)
                  </label>
                  <input
                    type="text"
                    value={form.driver_last_name_en || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                      setForm({ ...form, driver_last_name_en: value });
                    }}
                    placeholder="Last name"
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />
                </div>
              </div>

              {/* ===== Phone ===== */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="text-red-500">*</span> Driver Phone (Thailand)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatPhone(form.driver_phone || "")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setForm({ ...form, driver_phone: raw });
                  }}
                  placeholder="081-234-5678"
                  className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                            focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                            outline-none transition-all bg-white shadow-sm`}
                />
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  📱 Format: 081-234-5678
                </p>
              </div>
            </div>

            {/* ================= VEHICLE INFORMATION ================= */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 space-y-6 border border-amber-100">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-amber-200">
                <span className="text-2xl">🚗</span>
                Vehicle Information
              </h3>

              {/* Car Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="text-red-500">*</span> เลขทะเบียนรถ
                </label>
                <input
                  value={form.car_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, car_number: e.target.value }))
                  }
                  className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                            focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                            outline-none transition-all bg-white shadow-sm`}
                  placeholder="เช่น ฆฉ-2357"
                />
              </div>

              {/* Plate Color & Vehicle Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ป้าย
                  </label>
                  <select
                    value={form.plate_color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, plate_color: e.target.value }))
                    }
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                              outline-none transition-all bg-white shadow-sm cursor-pointer`}
                  >
                    <option value="YELLOW">🟨 ป้ายเหลือง</option>
                    <option value="GREEN">🟩 ป้ายเขียว</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ประเภทรถ
                  </label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicle_type: e.target.value }))
                    }
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                              outline-none transition-all bg-white shadow-sm cursor-pointer`}
                  >
                    <option value="TAXI">🚕 Taxi</option>
                    <option value="VAN">🚐 Van</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ================= COMMISSION & AGENT ================= */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 space-y-6 border border-green-100">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-green-200">
                <span className="text-2xl">💰</span>
                Commission & Agent
              </h3>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Commission Rate (%)
                  <span className="text-slate-400 text-xs font-normal ml-2">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.commission_rate ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      commission_rate:
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Leave blank to use Agent commission"
                  className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                            focus:border-green-500 focus:ring-4 focus:ring-green-100 
                            outline-none transition-all bg-white shadow-sm`}
                />
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  💡 If empty, system will use Agent commission rate
                </p>
              </div>

              {/* Agent */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Agent
                </label>
                <div className="relative" ref={dropdownRef}>
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
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-green-500 focus:ring-4 focus:ring-green-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />

                  {/* DROPDOWN */}
                  {showAgentDropdown && (
                    <div className="absolute z-20 mt-2 w-full bg-white border-2 border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
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
                            className={`px-4 py-3 cursor-pointer transition-colors
                              ${i === activeIndex 
                                ? "bg-green-100 text-green-800" 
                                : "hover:bg-slate-50"
                              }
                              ${i === 0 ? "rounded-t-xl" : ""}
                              ${i === agents.filter((a) => a.name.toLowerCase().includes(agentSearch.toLowerCase())).length - 1 ? "rounded-b-xl" : ""}
                            `}
                          >
                            {highlightText(a.name, agentSearch)}
                          </div>
                        ))}

                      {!agents.some((a) =>
                        a.name.toLowerCase().includes(agentSearch.toLowerCase())
                      ) && (
                        <div className="px-4 py-6 text-slate-400 text-sm text-center">
                          ❌ ไม่พบ Agent
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={addTaxi}
              disabled={saving}
              className={`w-fit bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg 
                disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 
                transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Taxi
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= TAXI LIST ================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              📋 Taxi List
            </h2>
            <input
              type="text"
              placeholder="🔍 ค้นหา Taxi..."
              value={taxiSearch}
              onChange={(e) => setTaxiSearch(e.target.value)}
              className={`w-full max-w-md border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                        focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                        outline-none transition-all bg-white shadow-sm`}
            />
          </div>

          {initialLoading ? (
            <div className="p-12">
              <PlayfulLoading />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      ทะเบียน
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      ป้าย
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      ประเภท
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      ชื่อ
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      นามสกุล
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      เบอร์โทร
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTaxis.map((t, index) => (
                    <tr 
                      key={t.id} 
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-5">
                        <span className="font-semibold text-slate-800 text-base">
                          {t.car_number}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-2xl">
                          {t.plate_color === "YELLOW" ? "🟨" : "🟩"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                          {t.vehicle_type === "TAXI" ? "🚕" : "🚐"} {t.vehicle_type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                          {t.driver_first_name_th}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                          {t.driver_last_name_th}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                          {t.driver_phone}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {t.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
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
                            className={`px-4 py-2.5 text-sm font-medium bg-orange-50 text-orange-600 
                                      rounded-lg hover:bg-orange-100 hover:shadow-md transition-all 
                                      duration-200 flex items-center gap-2 border border-orange-200`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          {/* Status Toggle */}
                          <button
                            onClick={() => toggleStatus(t)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all 
                                      duration-300 shadow-md hover:shadow-lg border-2
                              ${t.status === "ACTIVE" 
                                ? "bg-green-500 hover:bg-green-600 border-green-400" 
                                : "bg-slate-300 hover:bg-slate-400 border-slate-200"
                              }
                            `}
                            aria-label={`Toggle status: ${t.status === "ACTIVE" ? "Active" : "Inactive"}`}
                            title={t.status === "ACTIVE" ? "Click to deactivate" : "Click to activate"}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md 
                                        transition-transform duration-300
                                ${t.status === "ACTIVE" ? "translate-x-9" : "translate-x-1"}
                              `}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredTaxis.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-5xl">🔍</span>
                          <p className="text-slate-400 text-base">
                            ไม่พบ Taxi ที่ค้นหา
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= EDIT MODAL ================= */}
        {editingTaxi && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingTaxi(null)}
          >
            <form
              className={`bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden 
                        transform transition-all duration-300 scale-100`}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                saveEditTaxi();
              }}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไข Taxi
                </h2>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    เลขทะเบียนรถ
                  </label>
                  <input
                    autoFocus
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                              outline-none transition-all shadow-sm`}
                    value={editingTaxi.car_number}
                    onChange={(e) =>
                      setEditingTaxi({ ...editingTaxi, car_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ชื่อ
                  </label>
                  <input
                    autoFocus
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                              outline-none transition-all shadow-sm`}
                    value={editingTaxi.driver_first_name_th}
                    onChange={(e) =>
                      setEditingTaxi({ ...editingTaxi, driver_first_name_th: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    นามสกุล
                  </label>
                  <input
                    autoFocus
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                              outline-none transition-all shadow-sm`}
                    value={editingTaxi.driver_last_name_th}
                    onChange={(e) =>
                      setEditingTaxi({ ...editingTaxi, driver_last_name_th: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    เบอร์โทรศัพน์
                  </label>
                  <input
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    value={formatPhone(editingTaxi.driver_phone || "")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      setEditingTaxi({ ...editingTaxi, driver_phone: raw });
                    }}
                    placeholder="081-234-5678"
                    className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base 
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                              outline-none transition-all bg-white shadow-sm`}
                  />
                  <p className="text-xs text-slate-500 mt-2 ml-1">
                    📱 Format: 081-234-5678
                  </p>
                </div>

                {/* Add other fields like plate_color, vehicle_type, agent dropdown here */}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-8 py-6 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTaxi(null)}
                  className={`px-6 py-3 text-sm font-medium text-slate-700 bg-white border-2 
                            border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 
                            transition-all duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 text-sm font-medium text-white bg-gradient-to-r  from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                            rounded-xl shadow-md hover:shadow-lg transition-all duration-200  transform hover:scale-105`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
