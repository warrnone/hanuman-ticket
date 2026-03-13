//  ข้อมูลที่จะส่งไป ยังระบบ Ifeel 
/*
  Header
  x-partner-key: IFEEL_SECRET_123_pATw0rd
  GET https://your-domain.com/api/payment/verify?token=xxxxx
*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    /* =========================
      API KEY AUTH
    ========================= */
    const partnerKey = req.headers.get("x-partner-key");
    if (partnerKey !== process.env.HANUMAN_PARTNER_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* =========================
      GET TOKEN
    ========================= */
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
  
    if (!token) {
      return NextResponse.json({
        success:false,
        error:"Missing token"
      });
    }

    /* =========================
      TOKEN VALIDATION
    ========================= */
    if (token.length < 20 || token.length > 80) {
      return NextResponse.json({
        success: false,
        error: "Invalid token",
      });
    }

    /* =========================
      GET ORDER
    ========================= */
    const { data:order, error: orderError  } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        guest_name,
        service_date,
        adult_count,
        child_count,
        total_amount,
        remark,
        payment_status,
        start_time,
        qr_expired_at
      `)
      .eq("qr_token", token)
      .single();
  
    if (orderError) {
      console.error("verify order error", orderError);
      return NextResponse.json({
        success: false,
        error: "Database error",
      });
    }
  
    if (!order) {
      return NextResponse.json({
        success:false,
        error:"Order not found"
      });
    }

    /* =========================
      QR EXPIRY CHECK
    ========================= */
    if (order.qr_expired_at && new Date(order.qr_expired_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: "QR expired",
      });
    }

    /* =========================
      ORDER STATUS CHECK
    ========================= */
    if (order.payment_status === "cancelled") {
      return NextResponse.json({
        success: false,
        error: "Order cancelled",
      });
    }

    /* =========================
      GET ORDER ITEMS
    ========================= */
    const { data:items , error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select(`
        item_name,
        price,
        quantity,
        item_type
      `)
      .eq("order_id", order.id)
      .ilike("item_type", "PACKAGE");
      //  ส่งแต่ package ไป
    if (itemsError) {
      console.error("verify items error", itemsError);
      return NextResponse.json({
        success: false,
        error: "Items fetch failed",
      });
    }

    return NextResponse.json({
      success:true,
      order:{
        ...order,
        items
      }
    });
      
  } catch (error) {
    console.error("verify fatal error", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}