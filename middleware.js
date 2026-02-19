import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("role")?.value;

  /* ===============================
    หน้าแรก /
  =============================== */
  if (pathname === "/") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (role === "sales") {
      return NextResponse.redirect(new URL("/sales", req.url));
    }
    return NextResponse.next();
  }

  /* ===============================
    ADMIN LOGIN
  =============================== */
  if (pathname === "/admin/login") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  /* ===============================
    ADMIN AREA
  =============================== */
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  /* ===============================
    SALES AREA
  =============================== */
  if (pathname.startsWith("/sales")) {
    if (role !== "sales") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/sales/:path*"],
};
