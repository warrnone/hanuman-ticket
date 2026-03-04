import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query = supabaseAdmin
      .from("order_items")
      .select(`
        id,
        created_at,
        item_type,
        item_name,
        price,
        quantity,
        orders (
          id,
          external_ref
        )
      `)
      .order("created_at", { ascending: false });

    /* ===== Filter Type ===== */
    if (type && type !== "ALL") {
      query = query.eq("item_type", type);
    }

    /* ===== Filter Date ===== */
    if (start) {
      query = query.gte("created_at", `${start}T00:00:00`);
    }

    if (end) {
      query = query.lte("created_at", `${end}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Media report error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formatted = (data || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      item_type: row.item_type,
      item_name: row.item_name,
      quantity: row.quantity,
      price: row.price,
      total_price: row.price * row.quantity,
      order_number: row.orders?.external_ref ?? row.orders?.id
    }));

    return NextResponse.json({ data: formatted });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}