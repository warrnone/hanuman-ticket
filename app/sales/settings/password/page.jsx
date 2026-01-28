"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";


const LENGTH = 6;

export default function ChangePasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = ใส่รหัสใหม่, 2 = ยืนยัน
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [confirmDigits, setConfirmDigits] = useState(Array(LENGTH).fill(""));
  const inputsRef = useRef([]);
  const confirmInputsRef = useRef([]);

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ===============================
    UTIL
  =============================== */
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(200);
  };

  const isComplete = (arr) => arr.every((d) => d !== "");

  /* ===============================
    HANDLERS (OTP)
  =============================== */
  const handleChange = (arr, setArr, refs, index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...arr];
    next[index] = value;
    setArr(next);

    if (value && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (arr, refs, index, e) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e, setArr, refs) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").slice(0, LENGTH);
    if (!/^\d+$/.test(paste)) return;

    const next = paste.split("");
    setArr(next);
    refs.current[next.length - 1]?.focus();
  };

  /* ===============================
    STEP CONTROL
  =============================== */
  useEffect(() => {
    if (step === 1 && isComplete(digits)) {
      setStep(2);
    }
  }, [digits, step]);

  // ✅ โฟกัสช่องแรกของ confirm หลัง DOM render เสร็จ
  useEffect(() => {
    if (step === 2) {
      requestAnimationFrame(() => {
        confirmInputsRef.current[0]?.focus();
      });
    }
  }, [step]);

  useEffect(() => {
    if (step === 2 && isComplete(confirmDigits)) {
      submit();
    }
  }, [confirmDigits, step]);

  /* ===============================
    SUBMIT
  =============================== */
  const submit = async () => {
    setError("");

    const newPassword = digits.join("");
    const confirmPassword = confirmDigits.join("");

    if (newPassword !== confirmPassword) {
      vibrate();
      setError("รหัสผ่านไม่ตรงกัน");
      setConfirmDigits(Array(LENGTH).fill(""));
      requestAnimationFrame(() => {
        confirmInputsRef.current[0]?.focus();
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
        setLoading(false);
        return;
      }

      setSuccess("Password changed successfully. Logging out...");

      await fetch("/api/logout", { method: "POST" });
      localStorage.clear();

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch {
      setError("เกิดข้อผิดพลาดของระบบ");
      setLoading(false);
    }
  };

  /* ===============================
    UI
  =============================== */
  const activeDigits = step === 1 ? digits : confirmDigits;
  const activeSetDigits = step === 1 ? setDigits : setConfirmDigits;
  const activeRefs = step === 1 ? inputsRef : confirmInputsRef;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center pt-16 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg border dark:border-gray-700 p-6">

        {/* HEADER */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            🔐 Set a new password
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? "Set a 6-digit passcode"
              : "Confirm your password"}
          </p>
        </div>

        {/* ALERT */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-600 text-sm px-4 py-3 text-center">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-600 text-sm px-4 py-3 text-center">
            ✅ {success}
          </div>
        )}

        {/* OTP */}
        <div
          onPaste={(e) => handlePaste(e, activeSetDigits, activeRefs)}
          className="flex justify-center gap-2"
        >
          {activeDigits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                if (step === 1) inputsRef.current[i] = el;
                if (step === 2) confirmInputsRef.current[i] = el;
              }}
              type={show ? "text" : "password"}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) =>
                handleChange(
                  activeDigits,
                  activeSetDigits,
                  activeRefs,
                  i,
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                handleKeyDown(activeDigits, activeRefs, i, e)
              }
              className={`
                w-12 h-12 text-center text-lg font-semibold
                rounded-lg border
                focus:outline-none focus:ring-2
                ${
                  error && step === 2
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }
                dark:bg-gray-800 dark:border-gray-700 dark:text-white
              `}
            />
          ))}
        </div>

        {/* CONTROLS */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <span>{activeDigits.filter(Boolean).length}/{LENGTH}</span>
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="hover:underline"
          >
            {show ? "ซ่อน PIN" : "แสดง PIN"}
          </button>
        </div>

        {loading && (
          <p className="text-center text-sm text-gray-500 mt-4">
            กำลังบันทึก...
          </p>
        )}
      </div>
    </div>
  );
}
