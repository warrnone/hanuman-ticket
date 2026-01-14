import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabaseServer";

// ======================
// ADD USER (POST)
// ======================
export async function POST(req) {
  const { username } = await req.json();

  if (!username || !username.trim()) {
    return NextResponse.json(
      { error: "username required" },
      { status: 400 }
    );
  }

  const cleanUsername = username.trim();

  // ======================
  // CHECK DUPLICATE USERNAME
  // ======================
  const { data: exists, error: checkError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json(
      { error: checkError.message },
      { status: 500 }
    );
  }

  if (exists) {
    return NextResponse.json(
      { error: "Username นี้มีอยู่แล้ว" },
      { status: 409 }
    );
  }

  // ======================
  // DEFAULT PASSWORD = 1234
  // ======================
  const passwordHash = await bcrypt.hash("1234", 10);

  // ======================
  // INSERT USER
  // ======================
  const { error } = await supabaseAdmin
    .from("users")
    .insert({
      username: cleanUsername,
      password_hash: passwordHash,
      role: "staff",                 // 🔒 fix role ที่ backend
      is_active: true,
      // force_change_password: true,   // บังคับเปลี่ยนรหัสครั้งแรก
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// ======================
// GET USERS (LIST)
// ======================
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
