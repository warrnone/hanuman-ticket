import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* ======================
   GET: list categories
====================== */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, status, created_at")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("GET categories error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET categories crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req) {
  try {
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // 🔍 เช็กซ้ำก่อน (UX layer)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .ilike("name", trimmedName)
      .maybeSingle();

    if (checkError) {
      console.error("Check duplicate error:", checkError);
      return NextResponse.json(
        { error: "Failed to check duplicate" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 } // 👈 Conflict
      );
    }

    // ➕ insert จริง
    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name: trimmedName,
        status: "active",
      })
      .select("id, name, status")
      .single();

    if (error) {
      // 🔒 DB unique constraint (กันซ้ำชั้นสุดท้าย)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Category name already exists" },
          { status: 409 }
        );
      }

      console.error("POST category error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("POST category crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
