"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalConfirm, swalError } from "@/app/components/Swal";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vat_rate: 7,
    enable_vat: false,        // ✅ เพิ่ม
    discount_rate: 5,
    enable_discount: true,
  });

  /* =========================
     LOAD SETTINGS
  ========================= */
  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");

      const data = await res.json();

      setForm({
        vat_rate: Number(data.vat_rate ?? 7),
        enable_vat: Boolean(data.enable_vat),           // ✅ เพิ่ม
        discount_rate: Number(data.discount_rate ?? 5),
        enable_discount: Boolean(data.enable_discount),
      });
    } catch (err) {
      console.error(err);
      swalError("ไม่สามารถโหลดค่าระบบได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /* =========================
     SAVE SETTINGS
  ========================= */
  const handleSave = async () => {
    const result = await swalConfirm(
      "บันทึกการตั้งค่า",
      "ต้องการบันทึกค่า VAT และ Discount ใช่หรือไม่"
    );
    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vat_rate: Number(form.vat_rate),
          enable_vat: form.enable_vat,                  // ✅ เพิ่ม
          discount_rate: Number(form.discount_rate),
          enable_discount: form.enable_discount,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      swalSuccess("บันทึกการตั้งค่าเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {/* Outer ring */}
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
            {/* Inner ring */}
            <div className="absolute inset-0 m-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-purple-400 animation-delay-150" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">Loading settings</p>
            <p className="text-sm text-slate-400">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div>
        <h1 className="text-2xl font-bold">⚙️ System Settings</h1>
        <p className="text-sm text-slate-500">
          ตั้งค่าภาษี (VAT) และส่วนลดสำหรับระบบขาย
        </p>
      </div>

      {/* =========================
          FORM
      ========================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* Enable VAT */}
        <div className="flex items-center gap-3">
          <input
            id="enable_vat"
            type="checkbox"
            checked={form.enable_vat}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                enable_vat: e.target.checked,
              }))
            }
            className="w-4 h-4 accent-orange-500"
          />
          <label htmlFor="enable_vat" className="text-sm font-medium">
            เปิดใช้งาน VAT
          </label>
        </div>

        {/* VAT rate */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            VAT (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.vat_rate}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                vat_rate: e.target.value,
              }))
            }
            disabled={!form.enable_vat}   // ✅ ปิด input ถ้าไม่เปิด VAT
            className="w-full max-w-xs border rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-orange-400
              disabled:bg-slate-100"
          />
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Discount (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discount_rate}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discount_rate: e.target.value,
              }))
            }
            disabled={!form.enable_discount}
            className="w-full max-w-xs border rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-orange-400
              disabled:bg-slate-100"
          />
        </div>

        {/* Enable discount */}
        <div className="flex flex-row items-center gap-3">
          <input
            id="enable_discount"
            type="checkbox"
            checked={form.enable_discount}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                enable_discount: e.target.checked,
              }))
            }
            className="w-4 h-4 accent-orange-500"
          />
          <label htmlFor="enable_discount" className="text-sm font-medium">
            เปิดใช้งานส่วนลด (Enable discount)
          </label>
        </div>

        {/* =========================
            FOOTER
        ========================= */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-orange-500 text-white
              font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>

      {/* =========================
          NOTE
      ========================= */}
      <div className="text-xs text-slate-500">
        * ค่าที่ตั้งในหน้านี้ จะถูกนำไปใช้ตอนคำนวณราคาที่หน้า Sale
      </div>
    </div>
  );
}
