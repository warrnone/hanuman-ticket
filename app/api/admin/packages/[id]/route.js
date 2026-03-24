import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const BUCKET = process.env.SUPABASE_BUCKET || "package";

const getStoragePathFromUrl = (url, bucket) => {
  if (!url) return "";

  const marker = `/storage/v1/object/public/${bucket}/`;
  if (!url.includes(marker)) return "";

  return url.split(marker)[1];
};

/* =========================
   PATCH: update package
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1️⃣ ดึงข้อมูลเก่าก่อน
    const { data: oldPackage, error: fetchError } = await supabaseAdmin
      .from("packages")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const oldImage = oldPackage?.image_url ?? null;

    const payload = {
      name: body.name,
      description: body.description ?? null,
      price: body.price != null ? parseInt(body.price, 10) : undefined,
      status: body.status,
      category_id: body.category_id,
      image_url: body.image_url ?? null,
      package_type: body.package_type,
      charge_type: body.charge_type,
    };

    const { error: updateError } = await supabaseAdmin
      .from("packages")
      .update(payload)
      .eq("id", id);

    if (updateError) throw updateError;

    // 2️⃣ ถ้ามีการเปลี่ยนรูป ค่อยลบไฟล์เก่า
    if (oldImage && body.image_url && oldImage !== body.image_url) {
      const oldPath = getStoragePathFromUrl(oldImage, BUCKET);

      if (oldPath) {
        const { error: removeError } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove([oldPath]);

        if (removeError) {
          console.error("Remove old image error:", removeError);
        }
      }
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

    // ดึงรูปก่อนลบ package
    const { data: pkg, error: fetchError } = await supabaseAdmin
      .from("packages")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const imageUrl = pkg?.image_url ?? null;

    const { error: deleteError } = await supabaseAdmin
      .from("packages")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // ลบไฟล์ใน storage ด้วย
    if (imageUrl) {
      const oldPath = getStoragePathFromUrl(imageUrl, BUCKET);

      if (oldPath) {
        const { error: removeError } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove([oldPath]);

        if (removeError) {
          console.error("Remove package file error:", removeError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE packages error:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}