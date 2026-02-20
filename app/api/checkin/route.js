import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/*
|--------------------------------------------------------------------------
| API: POST /api/checkin
|--------------------------------------------------------------------------
| หน้าที่:
| 1) รับ qr_token จากเครื่อง scan
| 2) ตรวจสอบ order
| 3) ตรวจสอบ expire / double check
| 4) update checkin_status
| 5) generate taxi commission (ถ้ามี taxi)
|--------------------------------------------------------------------------
*/

export async function POST(req) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Missing QR token" },
        { status: 400 }
      );
    }

    /* =====================================
       1️⃣ หา order จาก qr_token
    ===================================== */

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("qr_token", token)
        .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Invalid QR code" },
        { status: 400 }
      );
    }

    /* =====================================
       2️⃣ เช็ค expire
    ===================================== */

    if (order.qr_expired_at) {
      const expired = new Date(order.qr_expired_at);
      if (expired < new Date()) {
        return NextResponse.json(
          { error: "QR code expired" },
          { status: 400 }
        );
      }
    }

    /* =====================================
       3️⃣ เช็คว่า check-in แล้วหรือยัง
    ===================================== */

    if (order.checkin_status === "checked_in") {
      return NextResponse.json(
        { error: "Already checked in" },
        { status: 400 }
      );
    }

    /* =====================================
       4️⃣ Update check-in
    ===================================== */

    const { error: updateError } =
      await supabaseAdmin
        .from("orders")
        .update({
          checkin_status: "checked_in",
          checked_in_at: new Date(),
        })
        .eq("id", order.id);

    if (updateError) {
      console.error("Check-in update error:", updateError);
      return NextResponse.json(
        { error: "Check-in failed" },
        { status: 500 }
      );
    }

    /* =====================================
       5️⃣ Generate Taxi Commission (ถ้ามี)
    ===================================== */

    if (order.taxi_id) {
      await handleTaxiCommission(order);
    }

    /* =====================================
       6️⃣ Success response
    ===================================== */

    return NextResponse.json({
      success: true,
      order_id: order.id,
      message: "Check-in successful",
    });

  } catch (err) {
    console.error("POST /api/checkin error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| Function: handleTaxiCommission
|--------------------------------------------------------------------------
| คำนวณ commission หลัง check-in สำเร็จ
| - ป้องกัน duplicate
|--------------------------------------------------------------------------
*/

async function handleTaxiCommission(order) {

  /* -------------------------------------
     1️⃣ เช็คว่า commission สร้างแล้วหรือยัง
  ------------------------------------- */

  const { data: existing } =
    await supabaseAdmin
      .from("taxi_commissions")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

  if (existing) {
    return; // กัน duplicate
  }

  /* -------------------------------------
     2️⃣ ดึงข้อมูล taxi
  ------------------------------------- */

  const { data: taxi, error: taxiError } =
    await supabaseAdmin
      .from("taxis")
      .select("commission_rate, agent_id")
      .eq("id", order.taxi_id)
      .single();

  if (taxiError || !taxi) {
    console.error("Taxi fetch error:", taxiError);
    return;
  }

  const rate = Number(taxi.commission_rate || 0);
  const baseAmount = Number(order.subtotal_amount || 0);

  const commissionAmount = (baseAmount * rate) / 100;

  /* -------------------------------------
     3️⃣ Insert commission
  ------------------------------------- */

  const { error: commissionError } =
    await supabaseAdmin
      .from("taxi_commissions")
      .insert({
        order_id: order.id,
        taxi_id: order.taxi_id,
        agent_id: taxi.agent_id,
        commission_rate: rate,
        base_amount: baseAmount,
        commission_amount: commissionAmount,
      });

  if (commissionError) {
    console.error("Insert commission error:", commissionError);
  }
}
/*****
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
  ทำ Dashboard Page React เต็มไฟล์
  ทำ Commission Settlement System
  ทำ Daily Close System
  
  หน้า React /checkin/[token]/page.jsx
  ระบบ scan ผ่านมือถือ
  ระบบ Dashboard Commission
  ระบบ Agent Settlement
  ระบบ Daily Close


 */