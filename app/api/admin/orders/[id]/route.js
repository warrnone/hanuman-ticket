import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ data: null });
    }

    /* =========================
       1. ORDER (SAFE)
    ========================= */
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          guest_name,
          total_amount,
          payment_status,
          checkin_status,
          created_at,
          agent_id,
          source_channel_id
        `)
        .eq("id", id)
        .maybeSingle(); // 🔥 กัน error

    if (orderError) {
      console.error("ORDER ERROR:", orderError);
      throw orderError;
    }

    if (!order) {
      return NextResponse.json({ data: null });
    }

    /* =========================
       2. ITEMS
    ========================= */
    const { data: items, error: itemError } =
      await supabaseAdmin
        .from("order_items")
        .select(`
          id,
          item_name,
          item_type,
          price,
          quantity
        `)
        .eq("order_id", id);

    if (itemError) {
      console.error("ITEM ERROR:", itemError);
      throw itemError;
    }

    /* =========================
       3. AGENT (OPTIONAL)
    ========================= */
    let agent = null;

    if (order.agent_id) {
      const { data } = await supabaseAdmin
        .from("agents")
        .select("name")
        .eq("id", order.agent_id)
        .maybeSingle();

      agent = data;
    }

    /* =========================
       4. CHANNEL (OPTIONAL)
    ========================= */
    let channel = null;

    if (order.source_channel_id) {
      const { data } = await supabaseAdmin
        .from("source_channels")
        .select("name")
        .eq("id", order.source_channel_id)
        .maybeSingle();

      channel = data;
    }

    /* =========================
       5. RESPONSE
    ========================= */
    return NextResponse.json({
      data: {
        ...order,
        items: items || [],
        agents: agent,
        source_channels: channel,
      },
    });

  } catch (err) {
    console.error("ORDER DETAIL ERROR:", err);

    return NextResponse.json({
      data: null,
      error: "โหลดข้อมูลไม่สำเร็จ",
    });
  }
}