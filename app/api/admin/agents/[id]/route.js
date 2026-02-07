import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update agent status
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("agents")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH agent error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();

  const { name, agent_type, commission_rate, phone } = body;

  const { error } = await supabaseAdmin
    .from("agents")
    .update({
      name,
      agent_type,
      commission_rate,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  return NextResponse.json({ success: true });
}
