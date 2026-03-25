import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update rule
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const payload = {
      activity_category_id: body.activity_category_id,
      media_type: body.media_type,
      media_package: body.media_package,
      sale_mode: body.sale_mode,
      pax_min: body.pax_min,
      pax_max: body.pax_max,
      price: body.price ?? null,
      base_price: body.base_price ?? null,
      extra_pax_price: body.extra_pax_price ?? null,
      status: body.status ?? "active",
      image_url: body.image_url ?? null,
    };

    /* =========================
       video detail
       ใช้เฉพาะ media_package = video
    ========================= */
    if (body.media_package === "video") {
      payload.video_type = body.video_type ?? null;
      payload.duration_value = body.duration_value ?? null;
      payload.duration_unit = body.duration_unit ?? null;
    } else {
      payload.video_type = null;
      payload.duration_value = null;
      payload.duration_unit = null;
    }

    /* =========================
       pricing mode cleanup
    ========================= */
    if (body.sale_mode === "first_next") {
      payload.price = null;
    } else {
      payload.base_price = null;
      payload.extra_pax_price = null;
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
    const { id } = await params;

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