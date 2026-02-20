import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list taxis
========================= */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("taxis")
      .select(`
        id,
        car_number,
        plate_color,
        vehicle_type,
        status,
        commission_type,
        commission_value,
        driver_phone,
        driver_first_name_th,
        driver_last_name_th,
        agent_id,
        agents (
          id,
          name
        )
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET taxis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load taxis" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create taxi
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      car_number,
      plate_color,
      vehicle_type,
      agent_id,
      commission_type = "FIXED_PER_HEAD",
      commission_value = null,
      driver_first_name_th,
      driver_last_name_th,
      driver_first_name_en,
      driver_last_name_en,
      driver_phone,
    } = body;

    if (!car_number || !plate_color || !vehicle_type || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* =========================
      Generate taxi_code (SAFE)
    ========================= */

    const { data: seqData, error: seqError } = await supabaseAdmin.rpc("get_next_taxi_code");

    if (seqError) throw seqError;

    const nextNumber = String(seqData).padStart(5, "0");

    const prefix = vehicle_type === "VAN" ? "VAN" : "TX";

    const taxi_code = `${prefix}${nextNumber}`;

    /* =========================
       Insert
    ========================= */

    const { error } = await supabaseAdmin
      .from("taxis")
      .insert({
        taxi_code,
        car_number,
        plate_color,
        vehicle_type,
        agent_id,
        commission_type,
        commission_value,
        driver_first_name_th,
        driver_last_name_th,
        driver_first_name_en,
        driver_last_name_en,
        driver_phone,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("POST taxi error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create taxi" },
      { status: 500 }
    );
  }
}