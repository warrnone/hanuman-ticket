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


    // ================================================
    // Normalize inputs 
    const normalizedCarNumber = car_number?.trim().toUpperCase();
    const normalizedPhone = driver_phone?.trim();
    const normalizedFirstTH = driver_first_name_th?.trim();
    const normalizedLastTH = driver_last_name_th?.trim();

    // ================================================

    if (!car_number || !plate_color || !vehicle_type || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("taxis")
      .select("id")
      .ilike("car_number", normalizedCarNumber)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "เลขทะเบียนนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("agent_type")
      .eq("id", agent_id)
      .single();

    if (!agent || agent.agent_type !== "TAXI") {
      return NextResponse.json(
        { error: "Agent ต้องเป็นประเภท TAXI เท่านั้น" },
        { status: 400 }
      );
    }

    if (commission_value < 0) {
        return NextResponse.json(
          { error: "Commission ต้องมากกว่าหรือเท่ากับ 0" },
          { status: 400 }
        );
      }

    if (commission_type === "PERCENT" && commission_value > 100) {
      return NextResponse.json(
        { error: "Commission ต้องไม่เกิน 100%" },
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
        car_number: normalizedCarNumber,
        plate_color,
        vehicle_type,
        agent_id,
        commission_type,
        commission_value,
        driver_first_name_th: normalizedFirstTH,
        driver_last_name_th: normalizedLastTH,
        driver_first_name_en,
        driver_last_name_en,
        driver_phone: normalizedPhone,
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