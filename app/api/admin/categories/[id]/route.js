import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";


/* =====================================
   PATCH: Toggle status (active/inactive)
===================================== */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params; 
    const { status } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing category id" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Missing status" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update({ status })
      .eq("id", id)                
      .select("id, name, status")
      .single();

    if (error) {
      console.error("Supabase PATCH error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE: Hard delete
=========================== */
export async function DELETE(req, { params }) {
  try {
    // ✅ Next.js 15+ ต้อง await params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing category id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()        // 🔥 ลบจริง
      .eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}