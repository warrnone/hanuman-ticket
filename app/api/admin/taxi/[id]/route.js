import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: toggle taxi status
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("taxis")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH taxi error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update taxi status" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT: edit taxi
========================= */
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      car_number,
      plate_color,
      vehicle_type,
      driver_first_name_th,
      driver_last_name_th,
      driver_first_name_en,
      driver_last_name_en,
      driver_phone,
      commission_type,
      commission_value,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing taxi id" },
        { status: 400 }
      );
    }

    /* =========================
       Normalize
    ========================= */
    const normalizedCarNumber = car_number?.trim().toUpperCase();
    const normalizedPlateColor = plate_color?.trim().toUpperCase();
    const normalizedVehicleType = vehicle_type?.trim().toUpperCase();
    const normalizedFirstTH = driver_first_name_th?.trim();
    const normalizedLastTH = driver_last_name_th?.trim();
    const normalizedFirstEN = driver_first_name_en?.trim() || null;
    const normalizedLastEN = driver_last_name_en?.trim() || null;
    const normalizedPhone = driver_phone?.trim();

    /* =========================
       Validation
    ========================= */
    if (
      !normalizedCarNumber ||
      !normalizedPlateColor ||
      !normalizedVehicleType ||
      !normalizedFirstTH ||
      !normalizedLastTH ||
      !normalizedPhone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["YELLOW", "GREEN", "BLACK", "APP"].includes(normalizedPlateColor)) {
      return NextResponse.json(
        { error: "plate_color ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!["TAXI", "VAN"].includes(normalizedVehicleType)) {
      return NextResponse.json(
        { error: "vehicle_type ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก" },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate car_number check
    ========================= */
    const { data: existing, error: duplicateError } = await supabaseAdmin
      .from("taxis")
      .select("id")
      .ilike("car_number", normalizedCarNumber)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (existing) {
      return NextResponse.json(
        { error: "เลขทะเบียนนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    /* =========================
       Commission validation
    ========================= */
    const isCommissionRequired = ["YELLOW", "GREEN"].includes(normalizedPlateColor);

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

      if (Number(commission_value) < 0) {
        return NextResponse.json(
          { error: "Commission ต้องมากกว่าหรือเท่ากับ 0" },
          { status: 400 }
        );
      }

      if (commission_type === "PERCENT" && Number(commission_value) > 100) {
        return NextResponse.json(
          { error: "Commission ต้องไม่เกิน 100%" },
          { status: 400 }
        );
      }
    }

    /* =========================
       Update
    ========================= */
    const updateData = {
      car_number: normalizedCarNumber,
      plate_color: normalizedPlateColor,
      vehicle_type: normalizedVehicleType,
      driver_first_name_th: normalizedFirstTH,
      driver_last_name_th: normalizedLastTH,
      driver_first_name_en: normalizedFirstEN,
      driver_last_name_en: normalizedLastEN,
      driver_phone: normalizedPhone,
      commission_type: isCommissionRequired ? commission_type : null,
      commission_value: isCommissionRequired ? Number(commission_value) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("taxis")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT taxi error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update taxi" },
      { status: 500 }
    );
  }
}