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
        item_id,
        item_code,
        item_name,
        price,
        quantity,
        media_type,
        sale_mode,
        pax_count,
        included_pax,
        extra_pax,
        base_price,
        extra_pax_price,
        pricing_note,
        orders (
          id,
          external_ref,
          guest_name,
          adult_count,
          child_count,
          service_date
        )
      `)
      .order("created_at", { ascending: false });

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
      console.error("Media report error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formatted = (data || []).map((row) => {
      const quantity = Number(row.quantity || 0);
      const unitPrice = Number(row.price || 0);

      const paxCount =
        row.pax_count != null
          ? Number(row.pax_count)
          : Number(row.orders?.adult_count || 0) +
            Number(row.orders?.child_count || 0);

      const includedPax = Number(row.included_pax || 0);

      const extraPax =
        row.extra_pax != null
          ? Number(row.extra_pax)
          : Math.max(paxCount - includedPax, 0);

      const basePrice = Number(row.base_price || 0);
      const extraPaxPrice = Number(row.extra_pax_price || 0);

      const steppedTotal =
        basePrice > 0 || extraPaxPrice > 0
          ? basePrice + extraPax * extraPaxPrice
          : unitPrice * quantity;

      return {
        id: row.id,
        created_at: row.created_at,
        service_date: row.orders?.service_date ?? null,

        order_id: row.orders?.id ?? null,
        order_number: row.orders?.external_ref ?? row.orders?.id ?? null,
        guest_name: row.orders?.guest_name ?? null,

        item_type: row.item_type,
        item_id: row.item_id ?? null,
        item_code: row.item_code ?? null,
        item_name: row.item_name,

        media_type: row.media_type ?? null,
        sale_mode: row.sale_mode ?? null,

        quantity,
        price: unitPrice,
        total_price: unitPrice * quantity,

        pax_count: paxCount,
        included_pax: includedPax,
        extra_pax: extraPax,

        base_price: basePrice,
        extra_pax_price: extraPaxPrice,
        stepped_total: steppedTotal,

        pricing_note:
          row.pricing_note ??
          (
            basePrice > 0 || extraPaxPrice > 0
              ? `${includedPax} included + ${extraPax} extra pax`
              : null
          ),
      };
    });

    return NextResponse.json({ data: formatted });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}