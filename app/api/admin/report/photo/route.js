import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const query = supabaseAdmin
      .from("order_items")
      .select(`
        id,
        item_type,
        total_price,
        created_at,
        orders:order_id (
          id,
          order_number
        )
      `)
      .eq("item_type", "PHOTO")
      .order("created_at", { ascending: false });

    if (start) query.gte("created_at", start);
    if (end) query.lte("created_at", end);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });

  } catch (err) {
    console.error("Photo report error:", err);
    return NextResponse.json(
      { error: "Failed to load photo report" },
      { status: 500 }
    );
  }
}