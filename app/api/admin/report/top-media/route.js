import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type"); // PHOTO / VIDEO

    if (!type) {
      return NextResponse.json(
        { error: "Missing type" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("order_items")
      .select("item_name, price, quantity")
      .eq("item_type", type);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 🔥 group by ใน JS
    const grouped = {};

    data.forEach((item) => {
      if (!grouped[item.item_name]) {
        grouped[item.item_name] = {
          item_name: item.item_name,
          total_sold: 0,
          total_revenue: 0
        };
      }

      grouped[item.item_name].total_sold += item.quantity;
      grouped[item.item_name].total_revenue +=
        item.price * item.quantity;
    });

    const result = Object.values(grouped)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    return NextResponse.json({ data: result });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}