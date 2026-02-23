import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

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

    const BUCKET = process.env.SUPABASE_BUCKET;

    if (!BUCKET) {
      return NextResponse.json(
        { error: "SUPABASE_BUCKET not configured" },
        { status: 500 }
      );
    }

    /* =========================
       ✅ ตรวจประเภทไฟล์
    ========================= */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed (jpg, png, webp, mp4 only)" },
        { status: 400 }
      );
    }

    /* =========================
       ✅ จำกัดขนาดไฟล์ (20MB)
    ========================= */

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 20MB)" },
        { status: 400 }
      );
    }

    /* =========================
       ตั้งชื่อไฟล์
    ========================= */

    const ext = file.name.split(".").pop();
    const fileName = `package-${Date.now()}.${ext}`;

    /* =========================
       อัปโหลดไป Supabase
    ========================= */

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, file, {
        contentType: file.type,
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

    /* =========================
       ดึง public URL
    ========================= */

    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: data.publicUrl,
      path: fileName,
      bucket: BUCKET,
      type: file.type,
    });

  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}