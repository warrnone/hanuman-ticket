import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       CATEGORIES (ACTIVE)
    ========================= */
    const { data: categories, error: catError } =
      await supabaseAdmin
        .from("categories")
        .select("id, name")
        .eq("status", "active")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true });

    if (catError) throw catError;

    /* =========================
       PACKAGES (ACTIVE)
    ========================= */
    const { data: packages, error: pkgError } =
      await supabaseAdmin
        .from("packages")
        .select("id, name, price, category_id")
        .eq("status", "active");

    if (pkgError) throw pkgError;

    /* =========================
       GROUP PACKAGES BY CATEGORY
    ========================= */
    const menu = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: packages
        .filter((p) => p.category_id === cat.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: "📦",       // placeholder (ปรับทีหลัง)
          description: "",   // ใส่เพิ่มได้
        })),
    }));

    return NextResponse.json({ data: menu });
  } catch (err) {
    console.error("Sale menu API error:", err);
    return NextResponse.json(
      { error: "Failed to load sale menu" },
      { status: 500 }
    );
  }
}
