import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        created_at,
        adult_count,
        child_count,
        booking_type,
        referral_source,
        total_amount,
        taxis (
          car_number,
          plate_color,
          vehicle_type
        ),
        order_items (
          item_name,
          quantity
        )
      `)
      .not("taxi_id", "is", null)
      .order("created_at", { ascending: true });

    const rows = [];

    (orders || []).forEach((o, index) => {
      const pax = (o.adult_count || 0) + (o.child_count || 0);

      const services =
        o.order_items?.map(i => `${i.item_name} x${i.quantity}`).join(", ") || "";

      rows.push({
        NO: index + 1,
        TIME: new Date(o.created_at).toLocaleTimeString(),
        CAR_NO: o.taxis?.car_number || "",
        PAX: pax,
        TYPE: o.taxis?.vehicle_type || "",
        SERVICE: services,
        BOOKING: o.booking_type || "",
        PLATE_COLOR: o.taxis?.plate_color || "",
        REFERRAL: o.referral_source || "",
        TOTAL: o.total_amount
      });
    });

    return NextResponse.json({ data: rows });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
