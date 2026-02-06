import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list agents
========================= */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("id, name, agent_type, commission_rate, phone, status")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET agents error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load agents" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create agent
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      agent_type,
      commission_rate = 0,
      phone = null,
      status = "ACTIVE",
    } = body;

    if (!name || !agent_type) {
      return NextResponse.json(
        { error: "Missing name or agent_type" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("agents")
      .insert({
        name,
        agent_type,
        commission_rate: Number(commission_rate),
        phone,
        status,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST agents error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create agent" },
      { status: 500 }
    );
  }
}
