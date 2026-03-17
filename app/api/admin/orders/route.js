import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id,
        guest_name,
        total_amount,
        payment_status,
        checkin_status,
        created_at,
        agents(name),
        source_channels(name)
      `)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("guest_name", `%${search}%`);
    }

    if (status) {
      query = query.eq("payment_status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: [] });
  }
}