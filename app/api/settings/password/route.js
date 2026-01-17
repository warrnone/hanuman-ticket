import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    /* ===============================
      AUTH
    =============================== */
    const userId = req.cookies.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ===============================
      BODY
    =============================== */
    const { newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสผ่านใหม่" },
        { status: 400 }
      );
    }

    // 🔐 กำหนดเป็นรหัสผ่านตัวเลข 6 หลัก
    if (!/^\d{6}$/.test(newPassword)) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องเป็นตัวเลข 6 หลักเท่านั้น" },
        { status: 400 }
      );
    }

    /* ===============================
      HASH PASSWORD
    =============================== */
    const passwordHash = await bcrypt.hash(newPassword, 10);

    /* ===============================
      UPDATE USER
    =============================== */
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        password_hash: passwordHash, // ✅ บันทึกลงคอลัมน์นี้
      })
      .eq("id", userId);

    if (error) {
      console.error("Update password error:", error);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกรหัสผ่านได้" },
        { status: 500 }
      );
    }

    /* ===============================
      SUCCESS
    =============================== */
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดของระบบ" },
      { status: 500 }
    );
  }
}
