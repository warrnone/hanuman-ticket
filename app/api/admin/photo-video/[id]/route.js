import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params; // ⭐ สำคัญมาก
    const body = await req.json();

    const { error } = await supabaseAdmin
      .from("photo_video_prices")
      .update(body)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH photo_video_prices error:", err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params; // ⭐ สำคัญมาก

    const { error } = await supabaseAdmin
      .from("photo_video_prices")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE photo_video_prices error:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
