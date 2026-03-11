//  ข้อมูลที่จะส่งไป ยังระบบ Ifeel 
/*
  Get ข้อมูลเรา 
  Header
  x-partner-key: IFEEL_SECRET_123
  GET https://your-domain.com/api/payment/verify?token=xxxxx
*/
/*
  ส่งให้เค้าา 
  Header
  x-partner-key: IFEEL_SECRET_123
  GET https://your-domain.com/api/payment/verify?token=xxxxx

  Header
  x-partner-key: IFEEL_SECRET_123
  Content-Type: application/json
  POST https://your-domain.com/api/payment/confirm
  Body
  {
    "token": "9766639e6034892a5a0cd1369b4ece52"
  }
*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  const partnerKey = req.headers.get("x-partner-key");
  if (partnerKey !== process.env.HANUMAN_PARTNER_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({
      success:false,
      error:"Missing token"
    });
  }

  const { data:order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      guest_name,
      service_date,
      adult_count,
      child_count,
      total_amount,
      payment_status,
      qr_expired_at
    `)
    .eq("qr_token", token)
    .single();

  if (!order) {
    return NextResponse.json({
      success:false,
      error:"Order not found"
    });
  }

  const { data:items } = await supabaseAdmin
    .from("order_items")
    .select(`
      item_name,
      price,
      quantity,
      item_type
    `)
    .eq("order_id", order.id);

  return NextResponse.json({
    success:true,
    order:{
      ...order,
      items
    }
  });

}