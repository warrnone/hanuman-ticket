import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const VALID_TYPES = ["TAXI", "TOUR", "HOTEL", "COMPANY"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

export async function POST(req) {
  try {
    const rows = await req.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    const payload = rows
      .filter((r) => r.name && r.agent_type)
      .map((r) => ({
        name: String(r.name).trim(),
        agent_type: VALID_TYPES.includes(r.agent_type)
          ? r.agent_type
          : "TAXI",
        commission_rate: Number(r.commission_rate) || 0,
        phone: r.phone ? String(r.phone).replace(/[^0-9]/g, "") : null,
        status: VALID_STATUS.includes(r.status) ? r.status : "ACTIVE",
      }));

    if (!payload.length) {
      return NextResponse.json(
        { error: "No valid rows" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("agents")
      .insert(payload);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      inserted: payload.length,
    });
  } catch (err) {
    console.error("IMPORT agents error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 }
    );
  }
}
