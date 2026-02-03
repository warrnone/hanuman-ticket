"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalConfirm, swalError } from "@/app/components/Swal";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vat_rate: 7,
    discount_rate: 5,
    enable_discount: true,
  });

  /* ============================
     LOAD SETTINGS
  ============================ */
  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/settings");

      if (!res.ok) {
        throw new Error("Failed to load settings");
      }

      const data = await res.json();

      setForm({
        vat_rate: Number(data.vat_rate ?? 7),
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

  /* ============================
     SAVE SETTINGS
  ============================ */
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vat_rate: Number(form.vat_rate),
          discount_rate: Number(form.discount_rate),
          enable_discount: form.enable_discount,
        }),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      swalSuccess("บันทึกการตั้งค่าเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* ============================
          HEADER
      ============================ */}
      <div>
        <h1 className="text-2xl font-bold">⚙️ System Settings</h1>
        <p className="text-sm text-slate-500">
          ตั้งค่าภาษี (VAT) และส่วนลดสำหรับระบบขาย
        </p>
      </div>

      {/* ============================
          FORM
      ============================ */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* VAT */}
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
            className="w-full max-w-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
            className="w-full max-w-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            disabled={!form.enable_discount}
          />
        </div>

        {/* Enable discount */}
        <div className="flex items-center gap-3">
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
          <label
            htmlFor="enable_discount"
            className="text-sm font-medium"
          >
            เปิดใช้งานส่วนลด (Enable discount)
          </label>
        </div>

        {/* ============================
            FOOTER
        ============================ */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>

      {/* ============================
          NOTE
      ============================ */}
      <div className="text-xs text-slate-500">
        * ค่าที่ตั้งในหน้านี้ จะถูกนำไปใช้ตอนคำนวณราคาที่หน้า Sale
      </div>
    </div>
  );
}
