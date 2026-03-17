import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        agents(name),
        source_channels(name),
        order_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        ...data,
        items: data.order_items,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null });
  }
}