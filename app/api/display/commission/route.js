import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
  .from("taxi_commissions")
    .select(`
      id,
      commission_amount,
      status,
      created_at,
      taxis:taxi_id (
        id,
        car_number,
        taxi_code
      )
    `)
    .in("status", ["pending", "called"])
    .order("created_at", { ascending: true });

    if (error) throw error;

    const formatted = (data || []).map((row) => ({
      id: row.id,
      plate_number: row.taxis?.car_number ?? "-",
      amount: row.commission_amount,
      status: row.status,
      created_at: row.created_at,
    }));

    return NextResponse.json({ data: formatted });

  } catch (err) {
    console.error("Display commission error:", err);
    return NextResponse.json(
      { error: "Failed to load commission display" },
      { status: 500 }
    );
  }
}