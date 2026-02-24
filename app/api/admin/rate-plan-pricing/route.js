import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ratePlanId = searchParams.get("rate_plan_id");

  const { data } = await supabaseAdmin
    .from("source_channel_prices")
    .select("*")
    .eq("source_channel_id", ratePlanId);

  return NextResponse.json({ data });
}

export async function POST(req) {
  const body = await req.json();

  const {
    rate_plan_id,
    package_id,
    price_override,
    discount_type,
    discount_value,
  } = body;

  await supabaseAdmin
    .from("source_channel_prices")
    .upsert({
      source_channel_id: rate_plan_id,
      package_id,
      price_override,
      discount_type,
      discount_value,
    });

  return NextResponse.json({ success: true });
}