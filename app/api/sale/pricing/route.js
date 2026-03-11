////  ตาราง source_channel_prices ยังไม่มีมันต้องทำ 


/***********
 * 
 * แยกให้ชัดแบบนี้เลย
1️⃣ source_channel_prices = “ราคาพิเศษตามช่องทาง”
    ตัวอย่าง:
    Channel	ความหมาย
    ONLINE	ลด 5%
    HOTEL	ลด 10%
    WALK_IN	ราคาเต็ม
 * 
 * 
 * 
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const source_channel_id = searchParams.get("source_channel_id");

    if (!source_channel_id) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("source_channel_prices")
      .select("*")
      .eq("source_channel_id", source_channel_id);

    if (error) throw error;


    if (error) {
      console.error("pricing table missing or query error:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data });

  } catch (err) {
    console.error("pricing error", err);
    return NextResponse.json({ data: [] });
  }
}