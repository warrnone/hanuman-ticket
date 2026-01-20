import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* ======================
   GET: list packages
====================== */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("packages")
      .select(`
        id,
        name,
        description,
        price,
        emoji,
        status,
        sort_order,
        category_id,
        categories (
          id,
          name
        )
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("GET packages error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // map ให้ frontend ใช้ง่าย
    const result = data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      emoji: p.emoji,
      status: p.status,
      sort_order: p.sort_order,
      category_id: p.category_id,
      category_name: p.categories?.name || "",
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

/* ======================
   POST: create package
====================== */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      category_id,
      name,
      description,
      price,
      emoji,
      status,
      sort_order,
    } = body;

    if (!category_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("packages")
      .insert([
        {
          category_id,
          name,
          description,
          price,
          emoji,
          status,
          sort_order,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("POST packages error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
