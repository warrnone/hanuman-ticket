import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    /* =========================
       CATEGORIES (ACTIVE)
    ========================= */
    const { data: categories, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .eq("status", "active")
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true });

    if (catError) throw catError;

    /* =========================
       PACKAGES (ACTIVE)
       MAIN / ADDON
    ========================= */
    const { data: packages, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select(`
        id,
        name,
        price,
        category_id,
        image_url,
        package_type,
        charge_type,
        sort_order
      `)
      .eq("status", "active");

    if (pkgError) throw pkgError;

    /* =========================
       PHOTO / VIDEO RULES
       ใช้เช็กว่า activity ไหนมี media
    ========================= */
    const { data: pvPrices, error: pvError } = await supabaseAdmin
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
        price,
        image_url
      `)
      .eq("status", "active");

    if (pvError) throw pvError;

    /* =========================
       BUILD MENU BY CATEGORY
    ========================= */
    const menu = categories.map((cat) => {
      /* ---------- MAIN PACKAGES + FIXED ADDONS ---------- */
      const categoryPackages = packages
        .filter((p) => p.category_id === cat.id)
        .sort((a, b) => {
          const getTypeOrder = (type) => {
            if ((type ?? "MAIN") === "MAIN") return 1;
            if (type === "ADDON") return 2;
            return 99;
          };

          const typeDiff = getTypeOrder(a.package_type) - getTypeOrder(b.package_type);
          if (typeDiff !== 0) return typeDiff;

          const sortA = Number(a.sort_order ?? 0);
          const sortB = Number(b.sort_order ?? 0);

          if (sortA !== sortB) return sortA - sortB;
          return Number(a.price ?? 0) - Number(b.price ?? 0);
        })
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          type: p.package_type === "ADDON" ? "ADDON" : "PACKAGE",
          package_type: p.package_type ?? "MAIN",
          charge_type: p.charge_type ?? "PER_PAX",
          image: p.image_url ?? null,
          description: "",
        }));

      /* ---------- MEDIA FLAGS ---------- */
      const categoryPvRules = pvPrices.filter(
        (r) => r.activity_category_id === cat.id
      );

      const hasPhoto = categoryPvRules.some((r) => r.media_type === "photo");
      const hasVideo = categoryPvRules.some((r) => r.media_type === "video");

      const mediaItems = [];

      if (hasPhoto) {
        mediaItems.push({
          id: `photo-${cat.id}`,
          name: "Photo",
          price: null,
          type: "PHOTO",
          image: null,
          description: "Photo pricing by pax",
        });
      }

      if (hasVideo) {
        mediaItems.push({
          id: `video-${cat.id}`,
          name: "Video",
          price: null,
          type: "VIDEO",
          image: null,
          description: "Video pricing by type, duration and pax",
        });
      }

      return {
        id: cat.id,
        name: cat.name,
        items: [...categoryPackages, ...mediaItems],
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