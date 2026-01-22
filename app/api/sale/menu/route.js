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
       PHOTO / VIDEO PRICES
    ========================= */
    const { data: pvPrices, error: pvError } =
      await supabaseAdmin
        .from("photo_video_prices")
        .select(`
          id,
          activity_category_id,
          media_type,
          video_type,
          duration_value,
          duration_unit,
          pax_min,
          pax_max,
          price
        `)
        .eq("status", "active");

    if (pvError) throw pvError;

    /* =========================
       BUILD MENU BY CATEGORY
    ========================= */
    const menu = categories.map((cat) => {
      /* ---------- Packages ---------- */
      const packageItems = packages
        .filter((p) => p.category_id === cat.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          type: "PACKAGE",
          image: "📦",
          description: "",
        }));

      /* ---------- Photo / Video ---------- */
      const pvItems = pvPrices
        .filter((r) => r.activity_category_id === cat.id)
        .map((r) => ({
          id: r.id,
          name:
            r.media_type === "photo"
              ? `Photo ${r.pax_min}-${r.pax_max} PAX`
              : `Video ${r.video_type ?? ""}`,
          price: r.price,
          type: r.media_type.toUpperCase(), // PHOTO | VIDEO
          pax_min: r.pax_min,
          pax_max: r.pax_max,
          duration:
            r.duration_value && r.duration_unit
              ? `${r.duration_value} ${r.duration_unit}`
              : null,
          image: r.media_type === "photo" ? "📷" : "🎥",
          description:
            r.media_type === "photo"
              ? `${r.pax_min}-${r.pax_max} persons`
              : r.duration_value
              ? `${r.duration_value} ${r.duration_unit}`
              : "",
        }));

      return {
        id: cat.id,
        name: cat.name,
        items: [...packageItems, ...pvItems],
      };
    });

    return NextResponse.json({ data: menu });
  } catch (err) {
    console.error("Sale menu API error:", err);
    return NextResponse.json(
      { error: "Failed to load sale menu" },
      { status: 500 }
    );
  }
}
