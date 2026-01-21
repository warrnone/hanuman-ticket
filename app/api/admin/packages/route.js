import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list packages
========================= */
export async function GET() {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from("packages")
      .select(`
        id,
        name,
        description,
        price,
        status,
        category_id,
        categories (
          id,
          name
        )
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: packages });
  } catch (err) {
    console.error("GET packages error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create package
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.category_id || !body.name || body.price == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = {
      category_id: body.category_id,
      name: body.name,
      description: body.description ?? null,
      price: parseInt(body.price, 10),
      status: body.status ?? "active",
    };

    if (Number.isNaN(payload.price)) {
      return NextResponse.json(
        { error: "Price must be an integer" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("packages")
      .insert(payload);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST packages error:", err);
    return NextResponse.json(
      { error: err.message || "Create failed" },
      { status: 500 }
    );
  }
}
