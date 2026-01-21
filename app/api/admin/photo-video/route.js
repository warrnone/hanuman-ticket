import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list pricing rules
   (safe version - no implicit join)
========================= */
export async function GET() {
  try {
    // 1️⃣ ดึง pricing ก่อน (ไม่ join)
    const { data: prices, error } = await supabaseAdmin
      .from("photo_video_prices")
      .select(`
        id,
        activity_category_id,
        media_type,
        video_type,
        duration_value,
        duration_unit,
        pax_min,
        pax_max,
        price,
        status,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 2️⃣ ดึง categories แยก
    const categoryIds = [
      ...new Set(prices.map(p => p.activity_category_id)),
    ];

    let categoriesMap = {};
    if (categoryIds.length > 0) {
      const { data: categories, error: catError } = await supabaseAdmin
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);

      if (catError) throw catError;

      categoriesMap = Object.fromEntries(
        categories.map(c => [c.id, c])
      );
    }

    // 3️⃣ merge ให้เหมือน join
    const data = prices.map(p => ({
      ...p,
      categories: categoriesMap[p.activity_category_id] ?? null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET photo_video_prices error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch photo/video prices" },
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

    // ✅ validate required
    if (
      !body.activity_category_id ||
      !body.media_type ||
      body.price == null
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🛡️ base payload (ตรง schema 100%)
    const payload = {
      activity_category_id: body.activity_category_id,
      media_type: body.media_type,
      pax_min: Number(body.pax_min ?? 1),
      pax_max: Number(body.pax_max ?? 1),
      price: Number(body.price),
      status: body.status ?? "active",
    };

    // ❗ กัน NaN
    if (
      Number.isNaN(payload.pax_min) ||
      Number.isNaN(payload.pax_max) ||
      Number.isNaN(payload.price)
    ) {
      return NextResponse.json(
        { error: "Invalid number value" },
        { status: 400 }
      );
    }

    // 🎥 video only
    if (body.media_type === "video") {
      if (
        !body.video_type ||
        body.duration_value == null ||
        !body.duration_unit
      ) {
        return NextResponse.json(
          { error: "Missing video fields" },
          { status: 400 }
        );
      }

      payload.video_type = body.video_type;
      payload.duration_value = Number(body.duration_value);
      payload.duration_unit = body.duration_unit;
    }

    const { error } = await supabaseAdmin
      .from("photo_video_prices")
      .insert(payload);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST photo_video_prices error:", err);
    return NextResponse.json(
      { error: err.message ?? "Create failed" },
      { status: 500 }
    );
  }
}
