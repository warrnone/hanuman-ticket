import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const role = req.cookies.get("role")?.value;
  const userId = req.cookies.get("user_id")?.value;

  /* ===================================================
     1️⃣ ROOT PAGE
  =================================================== */
  if (pathname === "/") {
    if (role === "admin" && userId) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (role === "sales" && userId) {
      return NextResponse.redirect(new URL("/sales", req.url));
    }
    return NextResponse.next();
  }

  /* ===================================================
     2️⃣ ADMIN LOGIN PAGE
  =================================================== */
  if (pathname === "/admin/login") {
    if (role === "admin" && userId) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  /* ===================================================
     3️⃣ SALES LOGIN PAGE
  =================================================== */
  if (pathname === "/login") {
    if (role === "sales" && userId) {
      return NextResponse.redirect(new URL("/sales", req.url));
    }
    return NextResponse.next();
  }

  /* ===================================================
     4️⃣ ADMIN PROTECTED AREA
  =================================================== */
  if (pathname.startsWith("/admin")) {
    if (!role || role !== "admin" || !userId) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));

      // 🔥 ลบ cookie กันค้าง
      res.cookies.delete("role");
      res.cookies.delete("user_id");

      return res;
    }
  }

  /* ===================================================
     5️⃣ SALES PROTECTED AREA  เช็ค Cookie ว่าเป็น sales หรือไม่ ถ้าไม่ใช่ก็รีไดเรคไปหน้า login และลบ cookie ทิ้งเพื่อป้องกันการค้างของ session
  =================================================== */
  if (pathname.startsWith("/sales")) {
    if (!role || role !== "sales" || !userId) {
      const res = NextResponse.redirect(new URL("/login", req.url));

      // 🔥 ลบ cookie กันค้าง
      res.cookies.delete("role");
      res.cookies.delete("user_id");

      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/sales/:path*"],
};
