import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { username, password, role } = await req.json();

  /* ======================
     ADMIN LOGIN (.env)
  ====================== */
  if (role === "admin") {
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const res = NextResponse.json({ success: true });

      res.cookies.set("role", "admin", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 30,
      });

      return res;
    }

    return NextResponse.json(
      { error: "Admin username or password incorrect" },
      { status: 401 }
    );
  }

  /* ======================
     SALES LOGIN (bcrypt)
  ====================== */
  if (role === "sales") {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, password_hash, is_active")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // 🔥 เช็คอนุมัติ
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is not approved by admin" },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    res.cookies.set("role", "sales", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });

    res.cookies.set("user_id", user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });

    return res;
  }


  return NextResponse.json(
    { error: "Invalid role" },
    { status: 400 }
  );
}
