import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("POST /survey/option body:", body); // 👈 สำคัญมาก

    const { group_id, label } = body;

    // ✅ validate แบบชัด ๆ
    if (typeof group_id !== "string" || !group_id.trim()) {
      return NextResponse.json(
        { error: "Invalid or missing group_id" },
        { status: 400 }
      );
    }

    if (typeof label !== "string" || !label.trim()) {
      return NextResponse.json(
        { error: "Invalid or missing label" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("survey_options")
      .insert({
        group_id,
        label: label.trim(),
      });

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /survey/option error:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
