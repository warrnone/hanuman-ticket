"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  // CHECK ROLE (ต้องเลือกมาก่อน)
  // ======================
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (!storedRole) {
      router.replace("/"); // กลับไปหน้าเลือก role
      return;
    }
    setRole(storedRole);
  }, [router]);

  // ======================
  // LOGIN HANDLER
  // ======================
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 🔐 SALES
    if (
      role === "sales" &&
      username === "sales" &&
      password === "1234"
    ) {
      localStorage.setItem("username", "Sales Staff");
      router.replace("/sales");
      return;
    }

    // 🔐 ADMIN
    if (
      role === "admin" &&
      username === "admin" &&
      password === "admin123"
    ) {
      localStorage.setItem("username", "Admin");
      router.replace("/admin");
      return;
    }

    // ❌ LOGIN FAIL
    setError("Invalid permissions or incorrect Username / Password.");
    setLoading(false);
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
            <span className="px-3 py-1 rounded-full text-sm font-semibold
              bg-blue-100 text-blue-700">
              Login as: {role.toUpperCase()}
            </span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-2">
          {role === "sales" && "Sales Login"}
          {role === "cashier" && "Cashier Login"}
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
