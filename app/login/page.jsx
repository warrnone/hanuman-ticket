"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import "./login_button.css";
import SubmitLoading from "../components/SubmitLoading";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

   

    setTimeout(() => {
       // 🔹 MOCK LOGIN
    if (username === "sales" && password === "1234") {
      localStorage.setItem("role", "sales");
      localStorage.setItem("username", "Sales Staff");
      router.replace("/sales");
      return; // ✅ redirect แล้ว component unmount เอง
    }

    if (username === "cashier" && password === "1234") {
      localStorage.setItem("role", "cashier");
      localStorage.setItem("username", "Cashier");
      router.replace("/cashier");
      return;
    }



 // ❌ Login ไม่ผ่าน
    setError("Username หรือ Password ไม่ถูกต้อง");
    setLoading(false);





    }, 9000);

   
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">

      {/* 🔥 FULL SCREEN SUBMIT LOADING */}
      {loading && <SubmitLoading />}

      <form
        onSubmit={handleLogin}
        className="bg-white w-[360px] p-8 rounded-2xl shadow-2xl relative"
      >
        {/* 🔵 LOGO */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo/HANUMAN WORLD.png"
            alt="Hanuman World Logo"
            width={120}
            height={120}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Hanuman Ticket
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Internal Booking Assist System
        </p>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          disabled={loading}
        />

        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Password"
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
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
    </div>
  );
}
