import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

    // 🔥 ลบ cookie role (httpOnly)
    res.cookies.set("role", "", {
      path: "/",
      expires: new Date(0),
    });

  return res;
}
