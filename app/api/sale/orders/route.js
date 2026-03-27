import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export async function POST(req) {
  try {
    /* =====================================
       Parse request body
    ===================================== */

    const body = await req.json();

    const {
      items = [],
      guest_name,
      service_date,
      adult_count,
      child_count,
      
      subtotal_amount,
      discount_amount,
      vat_amount,
      total_amount, // ✅ ยอดรวมที่ client คำนวณมา
      vat_rate,
      discount_rate,

      taxi_id = null,
      source_channel_id,
      start_time = null,
      remark = null,
      survey_answers = {},
    } = body;

    /* =====================================
       Basic validation
    ===================================== */

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items" },
        { status: 400 }
      );
    }

    if (!service_date) {
      return NextResponse.json(
        { error: "Missing service_date" },
        { status: 400 }
      );
    }

    if (total_amount == null || Number.isNaN(Number(total_amount))) {
      return NextResponse.json(
        { error: "Missing or invalid total_amount" },
        { status: 400 }
      );
    }

    /* =====================================
       1. Get staff info from cookie
       - staff ต้อง login มาก่อน
       - ใช้ user_id จาก cookie
    ===================================== */

    const cookieStore = await cookies();
    const staffId = cookieStore.get("user_id")?.value;

    if (!staffId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: staff, error: staffError } =
      await supabaseAdmin
        .from("users")
        .select("id, username, first_name, last_name, role , is_active")
        .eq("id", staffId)
        .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 401 }
      );
    }

    if (!staff.is_active) {
      return NextResponse.json(
        { error: "Staff inactive" },
        { status: 403 }
      );
    }

    const staffCode = staff.username;

    if (!staffCode) {
      return NextResponse.json(
        { error: "Staff username not set" },
        { status: 400 }
      );
    }


    /* =====================================
        1.5 Calculate commission (ถ้ามี taxi_id)
    ===================================== */
    let commissionAmount = 0;
    let commissionRate = 0;
    // let taxiAgentId = null;

    if (taxi_id) {
      const { data: taxi , error: taxiError  } = await supabaseAdmin
        .from("taxis")
        .select("commission_type, commission_value")
        .eq("id", taxi_id)
        .single();

      if (taxi) {

        // taxiAgentId = taxi.agent_id;  // ✅ เอามาจาก taxi
        commissionRate = Number(taxi.commission_value);
        const totalHeads = Number(adult_count) + Number(child_count);

        if (taxi.commission_type === "FIXED_PER_HEAD") {
          commissionAmount = totalHeads * Number(taxi.commission_value);
        }

        if (taxi.commission_type === "FIXED_PER_ORDER") {
          commissionAmount = Number(taxi.commission_value);
        }

        if (taxi.commission_type === "PERCENT") {
          commissionAmount =
            Number(total_amount) * Number(taxi.commission_value) / 100;
        }
        commissionAmount = Math.round(commissionAmount * 100) / 100;
      }

      if (taxiError || !taxi) {
        return NextResponse.json(
          { error: "Taxi not found" },
          { status: 400 }
        );
      }
    }

    /* =====================================
       2. Create order (orders table)
       - ใช้ total_amount จาก client
    ===================================== */

    const qrToken = crypto.randomBytes(16).toString("hex");
    const qrExpiredAt = new Date(Date.now() + 1000 * 60 * 30);

    const { data: orderRow, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .insert({
          staff_id: staff.id,
          staff_code: staffCode,

          guest_name: guest_name || "Walk-in",
          service_date,
          adult_count: Number(adult_count) || 0,
          child_count: Number(child_count) || 0,
          // Taxi
          taxi_id,
          source_channel_id,
          start_time,
          remark,
          subtotal_amount: Number(subtotal_amount),
          discount_amount: Number(discount_amount),
          vat_amount: Number(vat_amount),
          // ✅ total ที่ client คำนวณมาแล้ว (numeric)
          total_amount: Number(total_amount),
          vat_rate: Number(vat_rate),
          discount_rate: Number(discount_rate),
          payment_status: "pending",
          checkin_status: "not_checked_in",
          commission_amount: commissionAmount,

          // Qrcode 
          qr_token: qrToken,
          qr_expired_at: qrExpiredAt, // 30 นาที
        })
        .select()
        .single();

    if (orderError || !orderRow) {
      console.error("Create order failed:", orderError);
      return NextResponse.json(
        { error: "Create order failed" },
        { status: 500 }
      );
    }


    /* =====================================
      2.5 Insert taxi_commissions (NEW)   Taxis ได้ค่า commistion
    ===================================== */

    if (taxi_id && commissionAmount > 0) {
      const { error: commissionError } =
        await supabaseAdmin
          .from("taxi_commissions")
          .insert({
            order_id: orderRow.id,
            taxi_id: taxi_id,
            // agent_id: taxiAgentId,  
            commission_rate: commissionRate,
            base_amount: Number(total_amount),
            commission_amount: commissionAmount,
            status: "pending",
          });

      if (commissionError) {
        console.error("Insert taxi_commissions error:", commissionError);
        throw commissionError;
      }
    }


    /* =====================================
       3. Insert order items
       - ถ้าล้มเหลว จะ rollback order
    ===================================== */

    const normalizeItemType = (value, mediaType) => {
      const type = String(value || "").trim().toUpperCase();
      const media = String(mediaType || "").trim().toLowerCase();

      if (type === "PACKAGE") return "PACKAGE";
      if (type === "PHOTO") return "PHOTO";
      if (type === "VIDEO") return "VIDEO";

      if (
        ["PHOTO_VIDEO", "VIDEO_PHOTO", "PHOTO+VIDEO", "PHOTO-VIDEO"].includes(type) ||
        ["photo+video", "photo_video", "photo-video", "video_photo", "photovideo"].includes(media)
      ) {
        return "PHOTO_VIDEO";
      }

      return type || "PACKAGE";
    };

    const normalizeMediaType = (value, itemType) => {
      const media = String(value || "").trim().toLowerCase();
      const type = String(itemType || "").trim().toUpperCase();

      if (media === "photo" || type === "PHOTO") return "photo";
      if (media === "video" || type === "VIDEO") return "video";

      if (
        ["photo+video", "photo_video", "photo-video", "video_photo", "photovideo"].includes(media) ||
        ["PHOTO_VIDEO", "VIDEO_PHOTO", "PHOTO+VIDEO", "PHOTO-VIDEO"].includes(type)
      ) {
        return "photo+video";
      }

      return null;
    };

    const normalizeSaleMode = (value) => {
      const mode = String(value || "").trim().toLowerCase();

      if (["single"].includes(mode)) return "single";
      if (["set", "package"].includes(mode)) return "set";
      if (["addon", "add-on", "add_on"].includes(mode)) return "addon";

      return value ?? null;
    };

    const orderItemsPayload = items.map((i) => {
      const originalItemType = String(i.item_type || "").trim().toUpperCase();
      const sourceType = String(i.source_type || "").trim().toUpperCase();

      const normalizedItemType = normalizeItemType(i.item_type, i.media_type);
      const normalizedMediaType = normalizeMediaType(i.media_type, i.item_type);

      const paxCount = Number(i.pax_count || i.pax || 0);
      const includedPax = Number(i.included_pax || 0);
      const quantity = Number(i.quantity || 1);
      const price = Number(i.price || 0);

      const isPackageRow =
        originalItemType === "PACKAGE" ||
        sourceType === "PACKAGE";

      return {
        order_id: orderRow.id,

        item_type: normalizedItemType,

        // ✅ เก็บ item_id ได้ ถ้าต้นทางเป็น package แม้ item_type ที่บันทึกจะเป็น PHOTO/VIDEO/PHOTO_VIDEO
        item_id: isPackageRow ? i.item_id ?? null : null,

        item_code: i.item_code ?? null,
        item_name: i.item_name ?? i.name ?? "-",

        price,
        quantity,

        media_type: normalizedMediaType,
        sale_mode: normalizeSaleMode(i.sale_mode),

        pax_count: paxCount,
        included_pax: includedPax,
        extra_pax:
          i.extra_pax != null
            ? Number(i.extra_pax)
            : Math.max(paxCount - includedPax, 0),

        base_price: Number(i.base_price || 0),
        extra_pax_price: Number(i.extra_pax_price || 0),
        pricing_note: i.pricing_note ?? null,
      };
    });

    const { error: itemsError } =
      await supabaseAdmin
        .from("order_items")
        .insert(orderItemsPayload);

    if (itemsError) {
      console.error("Insert order_items error:", itemsError);

      // rollback order
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", orderRow.id);

      return NextResponse.json(
        { error: "Create order items failed" },
        { status: 500 }
      );
    }

    /* =====================================
      3.5 Insert survey answers (FIXED)
    ===================================== */
    if (survey_answers && Object.keys(survey_answers).length > 0) {

      const surveyPayload = [];

      for (const [groupKey, values] of Object.entries(survey_answers)) {

        if (!Array.isArray(values)) continue;

        for (const value of values) {
          surveyPayload.push({
            order_id: orderRow.id,
            group_key: groupKey,
            answer: value,
          });
        }
      }

      if (surveyPayload.length > 0) {
        const { error: surveyError } =
          await supabaseAdmin
            .from("order_survey_answers")
            .insert(surveyPayload);

        if (surveyError) {
          console.error("Insert survey error:", surveyError);
        }
      }
    }


    /* =====================================
       5. Response กลับไปที่ client
    ===================================== */
    return NextResponse.json({
      success: true,
      order_id: orderRow.id,
      qr_token: qrToken,
    });

  } catch (err) {
    console.error("POST /api/sale/orders error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}