import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update package
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1️⃣ ดึงข้อมูลเก่าก่อน
    const { data: oldPackage, error: fetchError } =
      await supabaseAdmin
        .from("packages")
        .select("image_url")
        .eq("id", id)
        .single();

    if (fetchError) throw fetchError;

    const oldImage = oldPackage?.image_url;

    const payload = {
      name: body.name,
      description: body.description ?? null,
      price:
        body.price != null
          ? parseInt(body.price, 10)
          : undefined,
      status: body.status,
      category_id: body.category_id,
      image_url: body.image_url ?? null,
    };

    const { error } = await supabaseAdmin
      .from("packages")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    // 2️⃣ ถ้ามีการเปลี่ยนรูป ค่อยลบไฟล์เก่า
    if (
      oldImage &&
      body.image_url &&
      oldImage !== body.image_url
    ) {
      const path = oldImage.split("/").pop();

      await supabaseAdmin.storage
        .from("packages")
        .remove([path]);
    }

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
