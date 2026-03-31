"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError } from "@/app/components/Swal";

export default function AdminKnowPage() {
  /* =========================
     STATE
  ========================= */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [groupForm, setGroupForm] = useState({
    title: "",
    options: [],
  });
  const [newOptionText, setNewOptionText] = useState("");


  /* =========================
     NETWORK STATUS
  ========================= */
  useEffect(() => {
    const updateNetworkStatus = () => {
      if (typeof navigator !== "undefined") {
        setIsOffline(!navigator.onLine);
      }
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);




  /* =========================
     LOAD SURVEY
  ========================= */
  const loadSurvey = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/survey", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load survey");
      }

      const json = await res.json();
      setGroups(json.data || []);
    } catch (err) {
      const offlineNow =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offlineNow) return;

      console.error("loadSurvey error:", err);
      swalError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurvey();
  }, []);

  /* =========================
     RELOAD WHEN BACK ONLINE
  ========================= */
  useEffect(() => {
    if (!isOffline) {
      loadSurvey();
    }
  }, [isOffline]);

  /* =========================
     MODAL HELPERS
  ========================= */
  const resetModal = () => {
    setGroupForm({ title: "", options: [] });
    setNewOptionText("");
    setShowGroupModal(false);
  };

  /* =========================
     ADD OPTION (ENTER SUPPORT)
  ========================= */
  const addOption = () => {
    if (!newOptionText.trim()) return;

    setGroupForm((g) => ({
      ...g,
      options: [...g.options, { label: newOptionText.trim() }],
    }));

    setNewOptionText("");
  };

  /* =========================
     SAVE GROUP + OPTIONS
  ========================= */
  const saveGroup = async () => {
    if (!groupForm.title.trim()) {
      swalError("กรุณากรอกคำถาม");
      return;
    }

    if (groupForm.options.length === 0) {
      swalError("กรุณาเพิ่มอย่างน้อย 1 ตัวเลือก");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin/survey/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: groupForm.title.trim(),
          options: groupForm.options.map((o) => o.label),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save group");
      }

      swalSuccess("เพิ่มคำถามเรียบร้อย");
      resetModal();
      await loadSurvey();
    } catch (err) {
      const offlineNow =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offlineNow) {
        swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        return;
      }

      console.error("saveGroup error:", err);
      swalError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-8">
      {isOffline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ไม่มีการเชื่อมต่ออินเทอร์เน็ต ข้อมูลบางส่วนอาจไม่อัปเดต
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📝 Let Us Know</h1>
          <p className="text-sm text-slate-500">
            ตั้งค่าคำถาม Survey (เพิ่มอย่างเดียว ไม่มีแก้ไข)
          </p>
        </div>

        <button
          onClick={() => {
            setGroupForm({ title: "", options: [] });
            setNewOptionText("");
            setShowGroupModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
          disabled={isOffline}
        >
          + Add Question
        </button>
      </div>

      {/* ================= GROUP LIST ================= */}
      {loading && (
        <div className="flex items-center justify-center space-x-2 py-10">
          <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce" />
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="text-center text-slate-400">
          {isOffline ? "ไม่มีอินเทอร์เน็ต" : "ยังไม่มีคำถาม"}
        </div>
      )}

      {groups.map((group) => (
        <div
          key={group.id}
          className="bg-white border rounded-2xl shadow-sm"
        >
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">{group.title}</h2>
          </div>

          <div className="divide-y">
            {group.survey_options?.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ================= MODAL ================= */}
      {showGroupModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={resetModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">➕ Add Question</h2>

            <div>
              <label className="text-sm font-medium">Question</label>
              <input
                value={groupForm.title}
                onChange={(e) =>
                  setGroupForm((g) => ({
                    ...g,
                    title: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2"
                placeholder="How did you hear about us?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Options (เลือกได้หลายข้อ)
              </label>

              {groupForm.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border rounded px-3 py-2"
                >
                  <span>{opt.label}</span>
                  <button
                    onClick={() =>
                      setGroupForm((g) => ({
                        ...g,
                        options: g.options.filter((_, i) => i !== idx),
                      }))
                    }
                    className="text-red-500 text-sm"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
                className="flex-1 border rounded px-3 py-2"
                placeholder="เช่น Facebook / Taxi / Friend"
              />
              <button
                onClick={addOption}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveGroup}
                disabled={saving || isOffline}
                className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}