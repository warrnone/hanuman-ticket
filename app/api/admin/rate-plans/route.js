import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("source_channels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ data: [] });

  return NextResponse.json({ data });
}


export async function POST(req) {
  const body = await req.json();

  const { id, name, description, is_active } = body;

  if (id) {
    await supabaseAdmin
      .from("source_channels")
      .update({ name, description, is_active })
      .eq("id", id);
  } else {
    await supabaseAdmin
      .from("source_channels")
      .insert({ name, description, is_active });
  }

  return NextResponse.json({ success: true });
}