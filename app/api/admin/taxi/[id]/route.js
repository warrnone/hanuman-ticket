import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: toggle taxi status
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
      .from("taxis")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH taxi error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update taxi" },
      { status: 500 }
    );
  }
}
