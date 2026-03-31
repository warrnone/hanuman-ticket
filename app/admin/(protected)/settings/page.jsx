"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalConfirm, swalError } from "@/app/components/Swal";

/* ===========================================
   TOGGLE SWITCH
=========================================== */
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <div
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      style={{
        width: 48,
        height: 26,
        borderRadius: 99,
        background: checked
          ? "linear-gradient(135deg, #f97316, #fb923c)"
          : "#e2e8f0",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.25s ease",
        flexShrink: 0,
        boxShadow: checked ? "0 2px 8px rgba(249,115,22,0.35)" : "none",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 25 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          transition: "left 0.22s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

/* ===========================================
   NUMBER INPUT WITH PREFIX
=========================================== */
function NumberInput({ value, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: disabled ? "#f8fafc" : "#fff",
        border: "1.5px solid",
        borderColor: disabled ? "#e2e8f0" : "#fed7aa",
        borderRadius: 10,
        overflow: "hidden",
        maxWidth: 160,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(249,115,22,0.08)",
      }}
    >
      <span
        style={{
          padding: "10px 14px",
          background: disabled ? "#f1f5f9" : "#fff7ed",
          color: disabled ? "#94a3b8" : "#f97316",
          fontWeight: 700,
          fontSize: 14,
          borderRight: "1.5px solid",
          borderColor: disabled ? "#e2e8f0" : "#fed7aa",
          userSelect: "none",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        %
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          border: "none",
          outline: "none",
          padding: "10px 12px",
          fontSize: 15,
          fontWeight: 600,
          color: disabled ? "#94a3b8" : "#1e293b",
          background: "transparent",
          width: "100%",
          fontFamily: "'DM Mono', monospace",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

/* ===========================================
   SETTING CARD ROW
=========================================== */
function SettingCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
  disabled = false,
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1.5px solid",
        borderColor: enabled ? "#fed7aa" : "#f1f5f9",
        background: enabled ? "#fff7ed" : "#fafafa",
        padding: "20px 22px",
        transition: "all 0.28s ease",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: enabled ? "#fff" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              border: "1.5px solid",
              borderColor: enabled ? "#fed7aa" : "#e2e8f0",
              boxShadow: enabled ? "0 2px 8px rgba(249,115,22,0.10)" : "none",
              transition: "all 0.25s",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1e293b",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {description}
            </div>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} disabled={disabled} />
      </div>

      <div
        style={{
          maxHeight: enabled ? 100 : 0,
          overflow: "hidden",
          transition:
            "max-height 0.32s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, margin 0.28s ease",
          opacity: enabled ? 1 : 0,
          marginTop: enabled ? 18 : 0,
        }}
      >
        <div style={{ paddingLeft: 54 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            กำหนดอัตรา
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===========================================
   LOADING SCREEN
=========================================== */
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: 260,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto 20px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid #f1f5f9",
              borderTopColor: "#f97316",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              border: "3px solid #f1f5f9",
              borderTopColor: "#fb923c",
              animation: "spin 1.2s linear infinite reverse",
            }}
          />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#475569", margin: 0 }}>
          กำลังโหลดค่าระบบ
        </p>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
          Please wait a moment...
        </p>
      </div>
    </div>
  );
}

/* ===========================================
   MAIN PAGE
=========================================== */
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [form, setForm] = useState({
    vat_rate: 7,
    enable_vat: false,
    discount_rate: 5,
    enable_discount: true,
  });

  /* ---------- NETWORK STATUS ---------- */
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

  /* ---------- LOAD ---------- */
  const fetchSettings = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/settings", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load settings");

      const data = await res.json();
      setForm({
        vat_rate: Number(data.vat_rate ?? 7),
        enable_vat: Boolean(data.enable_vat),
        discount_rate: Number(data.discount_rate ?? 5),
        enable_discount: Boolean(data.enable_discount),
      });
    } catch (err) {
      const offlineNow =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offlineNow) return;

      console.error("fetchSettings error:", err);
      swalError("ไม่สามารถโหลดค่าระบบได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /* ---------- RELOAD WHEN BACK ONLINE ---------- */
  useEffect(() => {
    if (!isOffline) {
      fetchSettings();
    }
  }, [isOffline]);

  /* ---------- SAVE ---------- */
  const handleSave = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
      return;
    }

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
          enable_vat: form.enable_vat,
          discount_rate: Number(form.discount_rate),
          enable_discount: form.enable_discount,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      swalSuccess("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const offlineNow =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offlineNow) {
        swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        return;
      }

      console.error("handleSave error:", err);
      swalError("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .settings-wrap * { box-sizing: border-box; }
        .settings-wrap input[type=number]::-webkit-inner-spin-button,
        .settings-wrap input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        .save-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ea6c0a, #f97316) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(249,115,22,0.35) !important;
        }
        .save-btn:active:not(:disabled) { transform: translateY(0) !important; }
        .save-btn { transition: all 0.2s ease !important; }
      `}</style>

      <div
        className="settings-wrap"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          maxWidth: 580,
          animation: "fadeIn 0.4s ease",
        }}
      >
        {isOffline && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              color: "#b45309",
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ไม่มีการเชื่อมต่ออินเทอร์เน็ต ข้อมูลบางส่วนอาจไม่อัปเดต
          </div>
        )}

        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #f97316, #fb923c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    boxShadow: "0 4px 14px rgba(249,115,22,0.32)",
                    flexShrink: 0,
                  }}
                >
                  ⚙️
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#1e293b",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    System Settings
                  </h1>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, marginTop: 2 }}>
                    ตั้งค่าภาษี (VAT) และส่วนลดสำหรับระบบขาย
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1.5px solid #f1f5f9",
                boxShadow: "0 4px 32px rgba(15,23,42,0.07)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <SettingCard
                icon="🧾"
                title="ภาษีมูลค่าเพิ่ม (VAT)"
                description="คำนวณ VAT อัตโนมัติในใบแจ้งหนี้และใบเสร็จ"
                enabled={form.enable_vat}
                disabled={isOffline || saving}
                onToggle={(val) => setForm((p) => ({ ...p, enable_vat: val }))}
              >
                <NumberInput
                  value={form.vat_rate}
                  disabled={!form.enable_vat || isOffline || saving}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vat_rate: e.target.value }))
                  }
                />
              </SettingCard>

              <SettingCard
                icon="🏷️"
                title="ส่วนลด (Discount)"
                description="เปิดใช้การหักส่วนลดอัตโนมัติจากยอดขาย"
                enabled={form.enable_discount}
                disabled={isOffline || saving}
                onToggle={(val) =>
                  setForm((p) => ({ ...p, enable_discount: val }))
                }
              >
                <NumberInput
                  value={form.discount_rate}
                  disabled={!form.enable_discount || isOffline || saving}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, discount_rate: e.target.value }))
                  }
                />
              </SettingCard>

              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  * ค่าที่ตั้งจะถูกนำไปใช้ตอนคำนวณราคาที่หน้า Sale
                </p>

                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={saving || isOffline}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 11,
                    border: "none",
                    background: saved
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : saving
                      ? "#fdba74"
                      : isOffline
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #f97316, #fb923c)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: saving || isOffline ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: saved
                      ? "0 4px 14px rgba(34,197,94,0.3)"
                      : "0 4px 16px rgba(249,115,22,0.28)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {saved ? (
                    <>
                      <span>✓</span> บันทึกแล้ว!
                    </>
                  ) : saving ? (
                    <>
                      <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>
                        ⏳
                      </span>
                      กำลังบันทึก...
                    </>
                  ) : isOffline ? (
                    <>
                      <span>📡</span> Offline
                    </>
                  ) : (
                    <>
                      <span>💾</span> บันทึกการตั้งค่า
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}