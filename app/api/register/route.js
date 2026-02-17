import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

    const { username, password, first_name, last_name } = body;

    if (!username || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabaseAdmin
      .from("users")
      .insert({
        username,
        password_hash: hashedPassword,
        first_name,
        last_name,
        role: "staff",
        is_active: false, // 🔥 ต้อง admin เปิดสิทธิ์ก่อน
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
