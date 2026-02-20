import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("taxis")
      .select(`
        id,
        car_number,
        plate_color,
        vehicle_type,
        commission_type,
        commission_value,
        driver_phone,
        driver_first_name_en,
        driver_last_name_en,
        agent_id,
        agents (
          id,
          name
        )
      `)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });

  } catch (err) {
    console.error("GET ACTIVE TAXIS ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch taxis" },
      { status: 500 }
    );
  }
}
