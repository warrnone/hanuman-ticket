import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 400 }
      );
    }

    /* =========================
       1. Fetch Order by qr_token
    ========================= */
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        total_amount,
        payment_status,
        qr_expired_at,
        created_at
      `)
      .eq("qr_token", token)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    /* =========================
       2. Check Already Paid
    ========================= */
    if (order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Order already paid" },
        { status: 400 }
      );
    }

    /* =========================
       3. Check Expiration
    ========================= */
    const now = new Date();
    const expiredAt = new Date(order.qr_expired_at);
    
    if (expiredAt < now) {
      // auto mark expired
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "expired" })
        .eq("id", order.id);

      return NextResponse.json(
        { success: false, error: "QR expired" },
        { status: 410 }
      );
    }

    /* =========================
       4. Calculate seconds left
    ========================= */
    const secondsLeft = Math.floor(
      (expiredAt.getTime() - now.getTime()) / 1000
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total_amount: order.total_amount,
      },
      seconds_left: secondsLeft,
    });

  } catch (err) {
    console.error("GET /api/payment/order error:", err);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}