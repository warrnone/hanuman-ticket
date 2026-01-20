import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* ======================
   PATCH: update package
====================== */
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing package id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("packages")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH packages error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

/* ======================
   DELETE: delete package
====================== */
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing package id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE packages error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
