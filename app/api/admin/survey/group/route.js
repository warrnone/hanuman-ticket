import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const { title, options } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Missing title" },
        { status: 400 }
      );
    }

    // 1️⃣ insert group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("survey_groups")
      .insert({ title: title.trim() })
      .select()
      .single();

    if (groupError) throw groupError;

    // 2️⃣ insert options (ถ้ามี)
    if (Array.isArray(options) && options.length > 0) {
      const rows = options.map((label) => ({
        group_id: group.id,
        label: label.trim(),
      }));

      const { error: optError } = await supabaseAdmin
        .from("survey_options")
        .insert(rows);

      if (optError) throw optError;
    }

    // 🔥 สำคัญ: return group.id ให้ frontend
    return NextResponse.json({
      success: true,
      id: group.id,
    });
  } catch (err) {
    console.error("POST /survey/group error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
