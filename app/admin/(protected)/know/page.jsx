"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminKnowPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);

  /* =========================
     LOAD SURVEY (GROUP + OPTION)
  ========================= */
  const loadSurvey = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/survey");
      if (!res.ok) throw new Error();

      const json = await res.json();
      setGroups(json.data || []);
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดข้อมูล Survey ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadSurvey();
  }, []);

  /* =========================
     ADD QUESTION (GROUP)
  ========================= */
  const addGroup = async () => {
    const result = await swalConfirm(
      "เพิ่มคำถามใหม่",
      "กรอกข้อความคำถาม",
      {
        input: "text",
        inputPlaceholder: "เช่น How did you hear about us?",
        showCancelButton: true,
      }
    );

    if (!result.isConfirmed || !result.value) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/survey/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.value.trim(),
        }),
      });

      if (!res.ok) throw new Error();

      swalSuccess("เพิ่มคำถามเรียบร้อย");
      loadSurvey();
    } catch {
      swalError("เพิ่มคำถามไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     ADD OPTION
  ========================= */
  const addOption = async (groupId) => {
    const result = await swalConfirm(
      "เพิ่มตัวเลือก",
      "กรอกข้อความของตัวเลือก",
      {
        input: "text",
        inputPlaceholder: "เช่น Facebook / Taxi / Friend",
        showCancelButton: true,
      }
    );

    if (!result.isConfirmed || !result.value) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/survey/option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          label: result.value.trim(),
        }),
      });

      if (!res.ok) throw new Error();

      swalSuccess("เพิ่มตัวเลือกเรียบร้อย");
      loadSurvey();
    } catch {
      swalError("เพิ่มตัวเลือกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     TOGGLE OPTION STATUS
  ========================= */
  const toggleOption = async (option) => {
    try {
      await fetch(`/api/admin/survey/option/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !option.is_active,
        }),
      });
      loadSurvey();
    } catch {
      swalError("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📝 Survey Configuration</h1>
          <p className="text-sm text-slate-500">
            จัดการคำถามและตัวเลือก (แทนฟอร์มกระดาษ)
          </p>
        </div>

        <button
          onClick={addGroup}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          + Add Question
        </button>
      </div>

      {/* ================= GROUP LIST ================= */}
      {loading && (
        <div className="text-center text-slate-400">Loading...</div>
      )}

      {!loading && groups.length === 0 && (
        <div className="text-center text-slate-400">
          ยังไม่มีคำถามในระบบ
        </div>
      )}

      {groups.map((group) => (
        <div
          key={group.id}
          className="bg-white border rounded-2xl shadow-sm"
        >
          {/* GROUP HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="font-semibold text-lg">{group.title}</h2>
              {group.description && (
                <p className="text-xs text-slate-500">
                  {group.description}
                </p>
              )}
            </div>

            <button
              onClick={() => addOption(group.id)}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              + Add option
            </button>
          </div>

          {/* OPTIONS */}
          <div className="divide-y">
            {group.options?.length === 0 && (
              <div className="p-6 text-center text-slate-400">
                ยังไม่มีตัวเลือก
              </div>
            )}

            {group.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{option.label}</span>
                  {!option.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      inactive
                    </span>
                  )}
                </div>

                {/* TOGGLE */}
                <button
                  onClick={() => toggleOption(option)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${
                      option.is_active
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }
                  `}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${
                        option.is_active
                          ? "translate-x-6"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/******
 * 
 * 1️⃣ SQL / Supabase schema (copy วางได้ทันที)
2️⃣ API /api/sales/survey + /api/admin/survey
 * 
 * 
 */