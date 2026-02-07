"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import * as XLSX from "xlsx";

const VALID_TYPES = ["TAXI", "TOUR", "HOTEL", "COMPANY"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);

  const [form, setForm] = useState({
    name: "",
    agent_type: "TAXI",
    commission_rate: 0,
    phone: "",
    status: "ACTIVE",
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  //  import Agent  excell
  const [importRows, setImportRows] = useState([]);   // ข้อมูลจาก Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Filter Search
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  /* =========================
     LOAD AGENTS
  ========================= */
  const loadAgents = async (pageNumber = page) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pageNumber,
        limit,
      });

      if (search) params.append("search", search);
      if (filterType) params.append("agent_type", filterType);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`/api/admin/agents?${params.toString()}`);

      if (!res.ok) throw new Error("Load agents failed");

      const json = await res.json();

      setAgents(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Agent ได้");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAgents(1);
  }, [search, filterType, filterStatus]);

  /* =========================
     PHONE FORMAT
  ========================= */
  const formatPhoneDisplay = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, "");
    if (cleaned.length <= 10) {
      setForm((f) => ({ ...f, phone: cleaned }));
    }
  };

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
          ...form,
          commission_rate: Number(form.commission_rate),
        }),
      });

      if (!res.ok) throw new Error();

      swalSuccess("เพิ่ม Agent สำเร็จ");
      setForm({
        name: "",
        agent_type: "TAXI",
        commission_rate: 0,
        phone: "",
        status: "ACTIVE",
      });
      loadAgents(1);
    } catch {
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

    await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: agent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    });

    loadAgents(page);
  };

  /* =========================
     SAVE EDIT
  ========================= */
  const saveEdit = async () => {
    await fetch(`/api/admin/agents/${editingAgent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingAgent),
    });

    swalSuccess("แก้ไข Agent สำเร็จ");
    setEditingAgent(null);
    loadAgents(page);
  };

  // Export เฉพาะหน้าปัจจุบัน
  const exportCurrentPage = () => {
    const data = agents.map((a) => ({
      name: a.name,
      agent_type: a.agent_type,
      commission_rate: a.commission_rate,
      phone: a.phone,
      status: a.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");

    XLSX.writeFile(wb, `agents_page_${page}.xlsx`);
  };

  // Export ทั้งหมด (ยิง API ใหม่)
  const exportAllAgents = async () => {
    const res = await fetch("/api/admin/agents?all=true");
    const json = await res.json();

    const data = json.data.map((a) => ({
      name: a.name,
      agent_type: a.agent_type,
      commission_rate: a.commission_rate,
      phone: a.phone,
      status: a.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");

    XLSX.writeFile(wb, "agents_all.xlsx");
  };

  // #region   import File Excel
  const importExcel = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const isDuplicate = agents.some((a) => a.name.trim().toLowerCase() === form.name.trim().toLowerCase());

      if (isDuplicate) {
        swalError("ชื่อ Agent นี้มีอยู่แล้ว");
        return;
      }

      if (!rows.length) {
        swalError("ไฟล์ว่าง");
        return;
      }

      const normalized = rows.map((r, i) => {
        const type = String(r.agent_type || "").trim().toUpperCase();
        const status = String(r.status || "ACTIVE").trim().toUpperCase();

        return {
          _row: i + 2,
          name: r.name || r.Name || "",   // ✅ FIX สำคัญ
          agent_type: VALID_TYPES.includes(type) ? type : "",
          commission_rate: Number(r.commission_rate || 0),
          phone: String(r.phone || "").replace(/[^0-9]/g, ""),
          status: VALID_STATUS.includes(status) ? status : "ACTIVE",
        };
      });

      setImportRows(normalized);
      setShowImportModal(true);
    } catch (err) {
      console.error(err);
      swalError("อ่านไฟล์ไม่สำเร็จ");
    }
  };

  // const confirmImport = async () => {
  //   const validRows = importRows.filter(
  //     (r) => r.name && VALID_TYPES.includes(r.agent_type)
  //   );

  //   if (!validRows.length) {
  //     swalError("ไม่มีข้อมูลที่ถูกต้อง");
  //     return;
  //   }

  //   const ok = await swalConfirm(
  //     "ยืนยันนำเข้า",
  //     `นำเข้า ${validRows.length} รายการ ?`
  //   );
  //   if (!ok.isConfirmed) return;

  //   try {
  //     setImporting(true);
  //     const res = await fetch("/api/admin/agents/import", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(validRows),
  //     });

  //     const json = await res.json();
  //     if (!res.ok) throw new Error(json.error);

  //     setShowImportModal(false);
  //     setImportRows([]);
  //     loadAgents(page);
  //   } catch {
  //     swalError("Import ไม่สำเร็จ");
  //   } finally {
  //     setImporting(false);
  //   }
  // };

  const confirmImport = async () => {
    // 1️⃣ กรองข้อมูลพื้นฐาน
    const validRows = importRows.filter(
      (r) => r.name && VALID_TYPES.includes(r.agent_type)
    );

    if (!validRows.length) {
      swalError("ไม่มีข้อมูลที่ถูกต้อง");
      return;
    }

    // 2️⃣ 🔥 เช็คชื่อซ้ำกับข้อมูลที่มีอยู่แล้ว (frontend)
    const existingNames = new Set(
      agents.map(a => a.name.trim().toLowerCase())
    );

    const duplicated = validRows.filter(r =>
      existingNames.has(r.name.trim().toLowerCase())
    );

    const readyToInsert = validRows.filter(r =>
      !existingNames.has(r.name.trim().toLowerCase())
    );

    if (!readyToInsert.length) {
      swalError("ข้อมูลทั้งหมดซ้ำกับในระบบแล้ว");
      return;
    }

    // 3️⃣ แจ้ง user ก่อน import
    const ok = await swalConfirm(
      "ยืนยันนำเข้า",
      `ข้อมูลทั้งหมด ${validRows.length} รายการ\n` +
      `❌ ซ้ำ: ${duplicated.length} รายการ\n` +
      `✅ จะนำเข้า: ${readyToInsert.length} รายการ`
    );

    if (!ok.isConfirmed) return;

    try {
      setImporting(true);

      const res = await fetch("/api/admin/agents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readyToInsert),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      swalSuccess(
        `นำเข้า ${json.inserted} รายการ` +
        (json.skipped ? ` (ข้าม ${json.skipped} รายการ)` : "")
      );
      swalSuccess(`นำเข้า ${json.inserted} รายการ`);
      setShowImportModal(false);
      setImportRows([]);
      loadAgents(page);

    } catch (err) {
      console.error(err);
      swalError("Import ไม่สำเร็จ");
    } finally {
      setImporting(false);
    }
  };
  // #endregion 

  return (
    <div className="space-y-6">
      <div className="flex gap-3 mb-4">
        <button
          onClick={exportCurrentPage}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export หน้านี้
        </button>

        <button
          onClick={exportAllAgents}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export ทั้งหมด
        </button>
        <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) {
                importExcel(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      {/* IMPORT REVIEW MODAL */}
      {showImportModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-4xl rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg">📥 Review ก่อน Import</h2>
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th>ชื่อ</th>
                  <th>ประเภท</th>
                  <th>Commission</th>
                  <th>โทร</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((r, i) => (
                  <tr key={i} className={!r.agent_type ? "bg-red-50" : ""}>
                    <td>
                      <input
                        value={r.name}
                        onChange={(e) => {
                          const n = [...importRows];
                          n[i].name = e.target.value;
                          setImportRows(n);
                        }}
                      />
                    </td>
                    <td>
                      <select
                        value={r.agent_type}
                        onChange={(e) => {
                          const n = [...importRows];
                          n[i].agent_type = e.target.value;
                          setImportRows(n);
                        }}
                      >
                        <option value="">--เลือก--</option>
                        {VALID_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td>{r.commission_rate}</td>
                    <td>{formatPhoneDisplay(r.phone)}</td>
                    <td>
                      <select
                        value={r.status}
                        onChange={(e) => {
                          const n = [...importRows];
                          n[i].status = e.target.value;
                          setImportRows(n);
                        }}
                      >
                        {VALID_STATUS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowImportModal(false)}>Cancel</button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="bg-orange-500 text-white px-4 py-2 rounded"
              >
                {importing ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold">🤝 Agent Management</h1>
      {/* ADD FORM */}
      <div className="bg-white p-6 rounded-xl border shadow-sm max-w-xl space-y-4">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="ชื่อ Agent นอก"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="087-654-4565"
          value={formatPhoneDisplay(form.phone)}
          onChange={handlePhoneChange}
        />

        <div className="flex gap-3">
          <select
            className="flex-1 border px-3 py-2 rounded"
            value={form.agent_type}
            onChange={(e) =>
              setForm({ ...form, agent_type: e.target.value })
            }
          >
            <option value="TAXI">Taxi</option>
            <option value="TOUR">Tour</option>
            <option value="HOTEL">Hotel</option>
            <option value="COMPANY">Company</option>
          </select>

          <input
            type="number"
            className="flex-1 border px-3 py-2 rounded"
            placeholder="Commission %"
            value={form.commission_rate}
            onChange={(e) =>
              setForm({ ...form, commission_rate: e.target.value })
            }
          />
        </div>

        <button
          onClick={addAgent}
          disabled={saving}
          className="w-full bg-orange-500 text-white py-2 rounded"
        >
          {saving ? "Saving..." : "Add Agent"}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-3 items-end">

        {/* SEARCH */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-500">ค้นหา</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ชื่อ Agent / เบอร์โทร"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="text-xs text-slate-500">ประเภท</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">ทั้งหมด</option>
            <option value="TAXI">Taxi</option>
            <option value="TOUR">Tour</option>
            <option value="HOTEL">Hotel</option>
            <option value="COMPANY">Company</option>
          </select>
        </div>

        {/* STATUS */}
        <div>
          <label className="text-xs text-slate-500">สถานะ</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">ทั้งหมด</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </div>

        {/* RESET */}
        <button
          onClick={() => {
            setSearch("");
            setFilterType("");
            setFilterStatus("");
            loadAgents(1);
          }}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          ล้างตัวกรอง
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm">
        {loading? (
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
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">ชื่อ</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">Commission</th>
                <th className="p-3">โทร</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.name}</td>
                  <td className="p-3 text-center">{a.agent_type}</td>
                  <td className="p-3 text-center">
                    {Number(a.commission_rate).toFixed(2)}%
                  </td>
                  <td className="p-3 text-center">
                    {formatPhoneDisplay(a.phone)}
                  </td>
                  <td className="p-3 text-center">
                    {a.status === "ACTIVE" ? "✅ ใช้งาน" : "⛔ ปิดใช้งาน"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingAgent(a)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 
                                  bg-orange-50 rounded-lg border border-orange-200
                                  hover:bg-orange-100 hover:border-orange-300 
                                  active:scale-95 transition-all duration-200`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        แก้ไข
                      </button>

                      <button
                        onClick={() => toggleStatus(a)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out
                                  shadow-inner hover:shadow-md active:scale-95
                                  ${a.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}
                        `}
                        aria-label="Toggle status"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out
                                    ${a.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"}
                          `}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="text-sm text-slate-600 font-medium">
              หน้า <span className="text-blue-600 font-semibold">{page}</span> จาก {totalPages}
            </div>

            <div className="flex gap-3">
              <button
                disabled={page === 1}
                onClick={() => loadAgents(page - 1)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg 
                          hover:bg-slate-50 hover:border-slate-400 active:scale-95
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                          transition-all duration-200 shadow-sm hover:shadow"
              >
                <IoIosArrowBack className="text-lg" />
                <span className="font-medium">ก่อนหน้า</span>
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => loadAgents(page + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                          hover:bg-blue-700 active:scale-95
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                          transition-all duration-200 shadow-sm hover:shadow"
              >
                <span className="font-medium">ถัดไป</span>
                <IoIosArrowForward className="text-lg" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
            <h2 className="font-bold">แก้ไข Agent</h2>

            <input
              className="w-full border px-3 py-2 rounded"
              value={editingAgent.name}
              onChange={(e) =>
                setEditingAgent({ ...editingAgent, name: e.target.value })
              }
            />

            <input
              className="w-full border px-3 py-2 rounded"
              value={formatPhoneDisplay(editingAgent.phone || "")}
              onChange={(e) =>
                setEditingAgent({
                  ...editingAgent,
                  phone: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
            />

            <button
              onClick={saveEdit}
              className="bg-orange-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
