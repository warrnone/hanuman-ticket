import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   UPLOAD PACKAGE IMAGE
========================= */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ ใช้ bucket จาก .env.local
    const BUCKET = process.env.SUPABASE_BUCKET;

    if (!BUCKET) {
      return NextResponse.json(
        { error: "SUPABASE_BUCKET not configured" },
        { status: 500 }
      );
    }

    // ดึงนามสกุลไฟล์
    const ext = file.name.split(".").pop();

    // ตั้งชื่อไฟล์ไม่ให้ซ้ำ
    const fileName = `package-${Date.now()}.${ext}`;
    // อัปโหลดไป Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(BUCKET) 
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // ดึง public URL
    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);


    return NextResponse.json({
      url: data.publicUrl,
      path: fileName,
      bucket: BUCKET,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
