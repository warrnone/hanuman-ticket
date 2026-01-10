"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role"); // sales / cashier / admin

    if (!role) {
      router.replace("/login");
    } else if (role === "sales") {
      router.replace("/sales");
    } else if (role === "cashier") {
      router.replace("/cashier");
    } else if (role === "admin") {
      router.replace("/admin");
    }
  }, [router]);

  return null;
}
