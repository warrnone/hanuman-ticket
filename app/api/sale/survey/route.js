import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       LOAD ACTIVE GROUPS
    ========================= */
    const { data: groups, error: groupError } =
      await supabaseAdmin
        .from("survey_groups")
        .select("id, title, description")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (groupError) throw groupError;

    /* =========================
       LOAD ACTIVE OPTIONS
    ========================= */
    const { data: options, error: optionError } =
      await supabaseAdmin
        .from("survey_options")
        .select("id, group_id, label")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (optionError) throw optionError;

    /* =========================
       MERGE GROUP + OPTIONS
    ========================= */
    const result = (groups || []).map((group) => {
      return {
        id: group.id,
        title: group.title,
        description: group.description,
        options: (options || []).filter(
          (opt) => opt.group_id === group.id
        ),
      };
    });

    return NextResponse.json({ data: result });

  } catch (err) {
    console.error("Sales Survey API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
