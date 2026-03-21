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

    const orderItemsPayload = items.map((i) => ({
      order_id: orderRow.id,

      item_type: i.item_type,
      item_id: i.item_type === "package" ? i.item_id : null,
      item_code: i.item_code ?? null,
      item_name: i.item_name,

      price: Number(i.price),
      quantity: Number(i.quantity),
    }));

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