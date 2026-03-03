import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    const updateData = { status };

    // ✅ อัปเดต paid_at เฉพาะตอนจ่ายเงิน
    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("taxi_commissions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}