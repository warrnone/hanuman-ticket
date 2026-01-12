"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Admin Dashboard
      </h1>
    </div>
  );
}
