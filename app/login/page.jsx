"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { loginApi } from "@/lib/authClient"; // ✅ ใช้จาก lib
import "./login_button.css";
import SubmitLoading from "../components/SubmitLoading";

export default function LoginPage() {
  const router = useRouter();

  // ======================
  // STATE
  // ======================
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);

  // ======================
  // CHECK ROLE (ต้องเลือก role มาก่อน)
  // ======================
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (!storedRole) {
      router.replace("/"); // หน้าเลือก role
      return;
    }
    setRole(storedRole);
  }, [router]);

  // ======================
  // LOGIN HANDLER
  // ======================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginApi({
        username,
        password,
        role, // "admin" | "sales"
      });

      // ✅ cookie ถูกตั้งโดย API แล้ว
      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "sales") {
        router.replace("/sales");
      }
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      {/* 🔥 FULL SCREEN LOADING */}
      {loading && <SubmitLoading />}

      <form
        onSubmit={handleLogin}
        className="bg-white w-[360px] p-8 rounded-2xl shadow-2xl relative"
      >
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo/HANUMAN WORLD.png"
            alt="Hanuman World Logo"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* ROLE BADGE */}
        {role && (
          <div className="text-center mb-3">
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
              Login as: {role.toUpperCase()}
            </span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-2">
          {role === "sales" && "Sales Login"}
          {role === "admin" && "Admin Login"}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Internal Booking Assist System
        </p>

        {/* USERNAME */}
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          disabled={loading}
        />

        {/* PASSWORD */}
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          className="neon-btn w-full"
          disabled={loading}
        >
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
    </div>
  );
}
