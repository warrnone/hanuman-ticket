import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list taxi agents only
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status"); // ACTIVE | INACTIVE | null
    const search = searchParams.get("search"); // ค้นหาชื่อ agent

    let query = supabaseAdmin
      .from("agents")
      .select("id, name, phone, commission_rate, status")
      .eq("agent_type", "TAXI")
      .order("name", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET taxi agents error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load taxi agents" },
      { status: 500 }
    );
  }
}
