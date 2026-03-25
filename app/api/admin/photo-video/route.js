import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list pricing rules
========================= */
export async function GET() {
  try {
    const { data: prices, error } = await supabaseAdmin
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
        status,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const categoryIds = [...new Set((prices || []).map((p) => p.activity_category_id))];

    let categoriesMap = {};
    if (categoryIds.length > 0) {
      const { data: categories, error: catError } = await supabaseAdmin
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);

      if (catError) throw catError;

      categoriesMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    }

    const data = (prices || []).map((p) => ({
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

    /* =========================
       required fields
    ========================= */
    if (!body.activity_category_id || !body.media_package || !body.sale_mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paxMin = Number(body.pax_min ?? 1);
    const paxMax = Number(body.pax_max ?? 1);

    if (Number.isNaN(paxMin) || Number.isNaN(paxMax)) {
      return NextResponse.json(
        { error: "Invalid pax value" },
        { status: 400 }
      );
    }

    if (paxMin > paxMax) {
      return NextResponse.json(
        { error: "PAX Min must not be greater than PAX Max" },
        { status: 400 }
      );
    }

    /* =========================
       base payload
    ========================= */
    const payload = {
      activity_category_id: body.activity_category_id,
      media_type: body.media_type,
      media_package: body.media_package,
      sale_mode: body.sale_mode,
      pax_min: paxMin,
      pax_max: paxMax,
      status: body.status ?? "active",
      image_url: body.image_url ?? null,
      price: null,
      base_price: null,
      extra_pax_price: null,
      video_type: null,
      duration_value: null,
      duration_unit: null,
    };

    /* =========================
       media_type fallback
       - photo => photo
       - video / photo_video => video
    ========================= */
    if (!payload.media_type) {
      payload.media_type =
        body.media_package === "photo" ? "photo" : "video";
    }

    /* =========================
       video-only details
       ใช้เฉพาะ media_package = video
    ========================= */
    if (body.media_package === "video") {
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

      const durationValue = Number(body.duration_value);

      if (Number.isNaN(durationValue) || durationValue <= 0) {
        return NextResponse.json(
          { error: "Invalid duration value" },
          { status: 400 }
        );
      }

      payload.video_type = body.video_type;
      payload.duration_value = durationValue;
      payload.duration_unit = body.duration_unit;
    }

    /* =========================
       pricing mode
    ========================= */
    if (body.sale_mode === "first_next") {
      const basePrice = Number(body.base_price);
      const extraPaxPrice = Number(body.extra_pax_price);

      if (Number.isNaN(basePrice) || Number.isNaN(extraPaxPrice)) {
        return NextResponse.json(
          { error: "Missing first/next pricing fields" },
          { status: 400 }
        );
      }

      if (basePrice < 0 || extraPaxPrice < 0) {
        return NextResponse.json(
          { error: "Price must be greater than or equal to 0" },
          { status: 400 }
        );
      }

      payload.base_price = basePrice;
      payload.extra_pax_price = extraPaxPrice;
      payload.price = null;
    } else {
      if (body.price == null) {
        return NextResponse.json(
          { error: "Missing price" },
          { status: 400 }
        );
      }

      const price = Number(body.price);

      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "Invalid price value" },
          { status: 400 }
        );
      }

      payload.price = price;
      payload.base_price = null;
      payload.extra_pax_price = null;
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