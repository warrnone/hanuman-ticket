"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import "../../login/login_button.css"; // reuse style
import SubmitLoading from "../../components/SubmitLoading";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // กัน admin login ซ้ำ
  useEffect(() => {
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("username");
    if (role === "admin" && user) {
      router.replace("/admin");
    }
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // mock delay
    setTimeout(() => {
      // 🔐 ADMIN LOGIN
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("role", "admin");
        localStorage.setItem("username", "Administrator");
        router.replace("/admin");
        return;
      }

      setError("Admin username หรือ password ไม่ถูกต้อง");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-800 to-purple-900">

      {loading && <SubmitLoading />}

      <form
        onSubmit={handleLogin}
        className="bg-white w-[380px] p-8 rounded-2xl shadow-2xl relative"
      >
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo/HANUMAN WORLD.png"
            alt="Hanuman World"
            width={110}
            height={110}
            priority
          />
        </div>

        {/* BADGE */}
        <div className="text-center mb-3">
          <span className="px-3 py-1 rounded-full text-sm font-semibold
            bg-purple-100 text-purple-700">
            Admin Login
          </span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Administrator
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Management & Configuration
        </p>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Admin Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          autoFocus
        />

        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="neon-btn w-full"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Login as Admin"}
        </button>
      </form>
    </div>
  );
}
