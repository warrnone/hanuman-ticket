import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const activityCategoryId = searchParams.get("activity_category_id");

    if (!activityCategoryId) {
      return NextResponse.json(
        { error: "Missing activity_category_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("photo_video_prices")
      .select(`
        id,
        activity_category_id,
        media_type,
        media_package,
        sale_mode,
        video_type,
        duration_value,
        duration_unit,
        pax_min,
        pax_max,
        price,
        base_price,
        extra_pax_price,
        image_url,
        status
      `)
      .eq("activity_category_id", activityCategoryId)
      .eq("status", "active")
      .order("media_package", { ascending: true })
      .order("pax_min", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("GET /api/sale/photo-video-rules error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch media rules" },
      { status: 500 }
    );
  }
}