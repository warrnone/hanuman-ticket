import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list taxis
========================= */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("taxis")
      .select(`
        id,
        car_number,
        plate_color,
        vehicle_type,
        status,
        commission_rate,
        agent_id,
        agents (
          id,
          name
        )
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET taxis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load taxis" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create taxi
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      car_number,
      plate_color,
      vehicle_type,
      agent_id,
      commission_rate = null,
    } = body;

    if (!car_number || !plate_color || !vehicle_type || !agent_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("taxis")
      .insert({
        car_number,
        plate_color,
        vehicle_type,
        agent_id,
        commission_rate,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST taxi error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create taxi" },
      { status: 500 }
    );
  }
}
