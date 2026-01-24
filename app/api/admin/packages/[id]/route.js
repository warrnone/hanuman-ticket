import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update package
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      name: body.name,
      description: body.description ?? null,
      price: body.price != null ? parseInt(body.price, 10) : undefined,
      status: body.status,
      category_id: body.category_id,
      image_url : body.image_url ?? null,
    };

    if (payload.price != null && Number.isNaN(payload.price)) {
      return NextResponse.json(
        { error: "Price must be an integer" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("packages")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH packages error:", err);
    return NextResponse.json(
      { error: err.message || "Update failed" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete package
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE packages error:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}
