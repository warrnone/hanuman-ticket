import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET : load settings
========================= */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("vat_rate, discount_rate, enable_discount")
      .eq("id", 1)
      .maybeSingle(); // 👈 สำคัญ

    if (error) throw error;

    // ✅ ถ้ายังไม่มี record ให้คืนค่า default ไปก่อน
    if (!data) {
      return NextResponse.json({
        vat_rate: 7,
        discount_rate: 5,
        enable_discount: true,
      });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error("GET settings error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}


/* =========================
   POST : save settings
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      vat_rate,
      discount_rate,
      enable_discount,
    } = body;

    if (vat_rate == null || discount_rate == null) {
      return NextResponse.json(
        { error: "Missing vat_rate or discount_rate" },
        { status: 400 }
      );
    }

    const payload = {
      id: 1, // 👈 fix ให้มีแถวเดียว
      vat_rate: Number(vat_rate),
      discount_rate: Number(discount_rate),
      enable_discount: Boolean(enable_discount),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert(payload, {
        onConflict: "id",
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("POST settings error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
