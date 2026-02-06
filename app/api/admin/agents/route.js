import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list agents
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from("agents")
      .select("id, name, agent_type, commission_rate, phone, status", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
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
