// Response  กลับมายัง API นี้
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {

  const partnerKey = req.headers.get("x-partner-key");

  if (partnerKey !== process.env.HANUMAN_PARTNER_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { token } = body;

  const { data:order } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status")
    .eq("qr_token", token)
    .single();

  if (!order) {
    return NextResponse.json({
      success:false,
      error:"Order not found"
    });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({
      success:false,
      error:"Already paid"
    });
  }

  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date(),
      qr_scanned: true,
      qr_scanned_at: new Date()
    })
    .eq("id", order.id);

  return NextResponse.json({
    success:true
  });

}