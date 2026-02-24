import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    let query = supabaseAdmin
      .from("orders")
      .select(`
        taxi_id,
        total_amount,
        commission_amount,
        taxis (
          car_number
        )
      `)
      .not("taxi_id", "is", null);

    if (date) {
      query = query.eq("service_date", date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 🔥 group in backend
    const summary = {};

    data.forEach((row) => {
      const taxiName = row.taxis?.car_number || "Unknown";

      if (!summary[taxiName]) {
        summary[taxiName] = {
          taxi: taxiName,
          total_orders: 0,
          total_sales: 0,
          total_commission: 0,
        };
      }

      summary[taxiName].total_orders += 1;
      summary[taxiName].total_sales += Number(row.total_amount || 0);
      summary[taxiName].total_commission += Number(row.commission_amount || 0);
    });

    return NextResponse.json({
      data: Object.values(summary),
    });

  } catch (err) {
    console.error("Commission API error:", err);
    return NextResponse.json({ data: [] });
  }
}