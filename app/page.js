"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import "./role.css";

export default function Home() {
  const router = useRouter();

  const goSales = () => {
    localStorage.setItem("role", "sales");
    router.push("/login");
  };

  const goAdmin = () => {
    localStorage.setItem("role", "admin");  // set ค่าใน localStorage 
    router.push("/login");   
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-[380px] text-center">

        {/* LOGO */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logo/HANUMAN WORLD.png"
            alt="Hanuman World"
            width={110}
            height={110}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Hanuman Ticket
        </h1>
        <p className="text-gray-500 mb-6">
          Internal Booking Assist System
        </p>

        {/* SALES BUTTON */}
        <button
          onClick={goSales}
          className="role-btn sales-btn w-full mb-4"
        >
          <span className="role-icon">🎟️</span>
          <span className="role-text">Sales</span>
        </button>

        {/* ADMIN BUTTON */}
        <button
          onClick={goAdmin}
          className="role-btn admin-btn w-full"
        >
          <span className="role-icon">🧑‍💼</span>
          <span className="role-text">Admin</span>
        </button>

      </div>
    </div>
  );
}
