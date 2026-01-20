import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list pricing rules
========================= */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("photo_video_prices")
      .select(`
        id,
        media_type,
        pax_min,
        pax_max,
        price,
        status,
        categories (
          id,
          name
        )
      `)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET photo_video_prices error:", err);
    return NextResponse.json(
      { error: "Failed to fetch photo/video prices" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create rule
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const { error } = await supabaseAdmin
      .from("photo_video_prices")
      .insert(body);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST photo_video_prices error:", err);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
