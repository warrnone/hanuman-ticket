import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ exists: false });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  return NextResponse.json({
    exists: !!data,
  });
}
