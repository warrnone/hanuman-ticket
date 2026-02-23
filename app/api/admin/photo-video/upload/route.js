import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const BUCKET = process.env.SUPABASE_BUCKET;
    if (!BUCKET) {
      return NextResponse.json(
        { error: "SUPABASE_BUCKET not configured" },
        { status: 500 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    const MAX_IMAGE = 5 * 1024 * 1024;
    const MAX_VIDEO = 10 * 1024 * 1024;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type === "video/mp4";

    if (isImage && file.size > MAX_IMAGE) {
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO) {
      return NextResponse.json(
        { error: "Video too large (max 10MB)" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `media-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: data.publicUrl,
      type: file.type,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}