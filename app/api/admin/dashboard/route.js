import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       USERS
    ========================= */
    const { count: usersCount, error: usersError } =
      await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    /* =========================
       PACKAGES (ACTIVE)
    ========================= */
    const { count: packagesCount, error: packagesError } =
      await supabaseAdmin
        .from("packages")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

    if (packagesError) throw packagesError;

    /* =========================
       ❗ ยังไม่มี ORDERS TABLE
       → ส่งค่า default
    ========================= */
    const ordersToday = 0;
    const revenueToday = 0;

    /* =========================
       ❗ ยังไม่มีข้อมูลกราฟ / order
    ========================= */
    const salesChart = [];
    const latestOrders = [];

    /* =========================
       RESPONSE (สำคัญที่สุด)
    ========================= */
    return NextResponse.json({
      stats: {
        users: usersCount || 0,
        packages: packagesCount || 0,
        ordersToday,
        revenueToday,
      },
      salesChart,
      latestOrders,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
