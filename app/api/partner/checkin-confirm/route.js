import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {

    /* =========================
      verify partner key
      (partner -> us)
    ========================= */

    const partnerKey = req.headers.get("x-partner-key");

    if (!partnerKey || partnerKey !== process.env.HANUMAN_PARTNER_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      external_order_id,
      checked_in,
      checked_in_at
    } = body;

    if (!external_order_id) {
      return NextResponse.json(
        { error: "Missing external_order_id" },
        { status: 400 }
      );
    }

    if (checked_in !== true) {
      return NextResponse.json(
        { error: "Invalid checked_in flag" },
        { status: 400 }
      );
    }

    /* =========================
      find order (guard ยิงซ้ำ)
    ========================= */

    const { data: order, error: findError } = await supabaseAdmin
      .from("orders")
      .select("id, checkin_status")
      .eq("id", external_order_id)
      .single();

    if (findError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ถ้าเคย check-in ไปแล้ว
    if (order.checkin_status === "checked_in") {
      return NextResponse.json({ success: true });
    }

    /* =========================
      update order
    ========================= */

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        checkin_status: "checked_in",
        checked_in_at: checked_in_at ?? new Date().toISOString()
      })
      .eq("id", external_order_id);

    if (updateError) {
      console.error("checkin-confirm update error:", updateError);
      return NextResponse.json(
        { error: "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (err) {
    console.error("POST /api/partner/checkin-confirm error:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}


/***
 * 
 * 
 * 1️⃣ แจ้งเช็คอินแล้ว   
    เราส่ง ไปหา เค้า เค้าส่งมา ว่า checkin แล้วยังงง 
    Endpoint (ฝั่งเรา)


    Header : x-partner-key
    POST : /api/partner/checkin-confirm
    Body :
    {
      "external_order_id": "uuid  orders.id",
      "checked_in": true,
      "checked_in_at": "2026-02-02T12:05:00Z"   
    }
 * 
 * 
 * 
 *   🎯 Key สำคัญที่สุดทั้งสองฝั่ง
    external_order_id
 * 
 * 
 */