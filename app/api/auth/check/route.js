// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (!role) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate", // ✅ ห้าม cache
        },
      }
    );
  }

  return NextResponse.json(
    { ok: true },
     {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate", // ✅ ห้าม cache
      },
    }
  );
}