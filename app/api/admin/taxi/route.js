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

    console.log("📦 POST /api/admin/taxi body:", JSON.stringify(body, null, 2)); return

    const {
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
    } = body;

    // =========================
    // Normalize
    // =========================
    const normalizedCarNumber = car_number?.trim().toUpperCase();
    const normalizedPhone = driver_phone?.trim();
    const normalizedFirstTH = driver_first_name_th?.trim();
    const normalizedLastTH = driver_last_name_th?.trim();

    // =========================
    // Validation — required fields
    // =========================
    if (!car_number || !plate_color || !vehicle_type || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // =========================
    // Duplicate car_number check
    // =========================
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

    // =========================
    // Agent type check
    // =========================
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

    // =========================
    // Commission validation
    // =========================
    const isCommissionRequired = ["YELLOW", "GREEN"].includes(plate_color);

    if (isCommissionRequired) {
      if (!commission_type) {
        return NextResponse.json(
          { error: "Commission type is required" },
          { status: 400 }
        );
      }
      if (commission_value === undefined || commission_value === null) {
        return NextResponse.json(
          { error: "Commission value is required" },
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
    }

    // =========================
    // Generate taxi_code
    // =========================
    const { data: seqData, error: seqError } =
      await supabaseAdmin.rpc("get_next_taxi_code");

    if (seqError) throw seqError;

    const nextNumber = String(seqData).padStart(5, "0");
    const prefix = vehicle_type === "VAN" ? "VAN" : "TX";
    const taxi_code = `${prefix}${nextNumber}`;

    // =========================
    // Build insert data
    // =========================
    const insertData = {
      taxi_code,
      car_number: normalizedCarNumber,
      plate_color,
      vehicle_type,
      agent_id,
      driver_first_name_th: normalizedFirstTH,
      driver_last_name_th: normalizedLastTH,
      driver_first_name_en,
      driver_last_name_en,
      driver_phone: normalizedPhone,
      // ✅ null ชัดเจน ตรงกับ DB constraint
      commission_type: isCommissionRequired ? commission_type : null,
      commission_value: isCommissionRequired ? commission_value : null,
    };

    // =========================
    // Insert
    // =========================
    const { error } = await supabaseAdmin
      .from("taxis")
      .insert(insertData);

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