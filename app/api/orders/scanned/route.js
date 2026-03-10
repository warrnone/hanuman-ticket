import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        qr_scanned: true,
        qr_scanned_at: new Date().toISOString(),
      })
      .eq("qr_token", token)
      .select();   // ⭐ สำคัญมาก (ทำให้ realtime ยิง event)

    if (error) throw error;

    return NextResponse.json({
      success: true
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}