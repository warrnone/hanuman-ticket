import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type"); // PHOTO / VIDEO / ALL
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query = supabaseAdmin
      .from("order_items")
      .select(`
        item_name,
        item_type,
        media_type,
        sale_mode,
        price,
        quantity,
        created_at
      `);

    /* ===== Filter Type ===== */
    if (type === "PHOTO") {
      query = query.eq("media_type", "photo");
    } else if (type === "VIDEO") {
      query = query.eq("media_type", "video");
    } else if (type === "PHOTO_VIDEO") {
      query = query.in("media_type", ["photo+video", "photo_video", "photo-video"]);
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
      console.error("Top media report error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const grouped = {};

    (data || []).forEach((item) => {
      const itemName = item.item_name || "Unknown Item";
      const itemType = item.item_type || "";
      const mediaType = item.media_type || "";
      const saleMode = item.sale_mode || "";

      const key = `${itemName}__${itemType}__${mediaType}__${saleMode}`;

      if (!grouped[key]) {
        grouped[key] = {
          item_name: itemName,
          item_type: itemType,
          media_type: mediaType,
          sale_mode: saleMode,
          total_sold: 0,
          total_revenue: 0,
        };
      }

      grouped[key].total_sold += Number(item.quantity || 0);
      grouped[key].total_revenue +=
        Number(item.price || 0) * Number(item.quantity || 0);
    });

    const result = Object.values(grouped)
      .sort((a, b) => {
        if (b.total_sold !== a.total_sold) {
          return b.total_sold - a.total_sold;
        }
        return b.total_revenue - a.total_revenue;
      })
      .slice(0, 5);

    return NextResponse.json({ data: result });

  } catch (err) {
    console.error("Top media server error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}