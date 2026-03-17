import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channel_id");

    if (!channelId) {
      return NextResponse.json({ data: [] });
    }

    /* =========================
       1. ดึง packages ทั้งหมด
    ========================= */
    const { data: packages, error: pkgError } =
      await supabaseAdmin
        .from("packages")
        .select("id, name, price")
        .eq("status", "active");

    if (pkgError) throw pkgError;

    /* =========================
       2. ดึง pricing override
    ========================= */
    const { data: pricing, error: priceError } =
      await supabaseAdmin
        .from("source_channel_prices")
        .select("*")
        .eq("source_channel_id", channelId);

    if (priceError) throw priceError;

    /* =========================
       3. merge data
    ========================= */
    const result = packages.map((pkg) => {
      const found = pricing.find(
        (p) => p.package_id === pkg.id
      );

      return {
        id: pkg.id,
        package_id: pkg.id,
        packages: pkg,

        price_override: found?.price_override || null,
        discount_type: found?.discount_type || null,
        discount_value: found?.discount_value || null,
      };
    });

    return NextResponse.json({ data: result });

  } catch (err) {
    console.error("pricing error:", err);
    return NextResponse.json({ data: [] });
  }
}