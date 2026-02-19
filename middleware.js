import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("role")?.value;

  // ===============================
  // ROOT
  // ===============================
  if (pathname === "/") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (role === "sales") {
      return NextResponse.redirect(new URL("/sales", req.url));
    }
    return NextResponse.next();
  }

  // ===============================
  // ✅ เพิ่ม LOGIN
  // ===============================
  if (pathname === "/login") {
    if (role === "sales") {
      return NextResponse.redirect(new URL("/sales", req.url));
    }
    return NextResponse.next();
  }

  // ===============================
  // ADMIN
  // ===============================
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ===============================
  // SALES
  // ===============================
  if (pathname.startsWith("/sales")) {
    if (role !== "sales") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/sales/:path*"], // ✅ เพิ่ม /login
};