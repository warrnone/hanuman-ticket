import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update rule
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params; // ⭐ Next.js 15+ ต้อง await
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    // 🛡️ whitelist fields
    const payload = {
      activity_category_id: body.activity_category_id,
      media_type: body.media_type,
      pax_min: body.pax_min,
      pax_max: body.pax_max,
      price: body.price,
      status: body.status ?? "active",
    };

    // 🎥 video only
    if (body.media_type === "video") {
      payload.video_type = body.video_type ?? null;
      payload.duration_value = body.duration_value ?? null;
      payload.duration_unit = body.duration_unit ?? null;
    } else {
      // ถ้าเปลี่ยนจาก video → photo ให้เคลียร์ field video
      payload.video_type = null;
      payload.duration_value = null;
      payload.duration_unit = null;
    }

    const { error } = await supabaseAdmin
      .from("photo_video_prices")
      .update(payload)
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
   DELETE: remove rule
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params; // ⭐ สำคัญมาก

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

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
