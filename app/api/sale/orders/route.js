/*    *สำคัญ  */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

/*
|--------------------------------------------------------------------------
| API: POST /api/sale/orders
|--------------------------------------------------------------------------
| หน้าที่ของ API นี้
| 1) รับข้อมูล order จากหน้า sale (คำนวณเงินเสร็จแล้ว)
| 2) บันทึก order + order_items ลง Supabase
| 3) ส่งข้อมูล order ต่อไปยัง Partner (Hanuman API)
|
| ❗ หมายเหตุสำคัญ
| - API นี้ "ไม่คำนวณเงินเอง"
| - ใช้ตัวเลขที่ client คำนวณมาเป็น source of truth
|
|--------------------------------------------------------------------------
| Body ที่ client (sale page) ต้องส่งมา
|--------------------------------------------------------------------------
| {
|   guest_name: string,
|   service_date: string (YYYY-MM-DD),
|   adult_count: number,
|   child_count: number,
|
|   total_amount: number,        // ✅ ยอดรวมสุดท้าย (decimal)
|
|   items: [
|     {
|       item_id: string | null,
|       item_type: "package" | "photo" | "video",
|       item_code: string | null,
|       item_name: string,
|       price: number,
|       quantity: number
|     }
|   ]
| }
*/

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
    let taxiAgentId = null;

    if (taxi_id) {
      const { data: taxi , error: taxiError  } = await supabaseAdmin
        .from("taxis")
        .select("commission_type, commission_value , agent_id")
        .eq("id", taxi_id)
        .single();

      if (taxi) {

        taxiAgentId = taxi.agent_id;  // ✅ เอามาจาก taxi
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
          qr_expired_at: qrExpiredAt, // 1 ชม
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
            agent_id: taxiAgentId,  
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

    // #region เราเป็นฝั่ง POST ไปหาเค้า
    /* =====================================
       4. Send order to Partner (Hanuman API)
       - เราเป็นฝั่ง POST ไปหาเค้า
    ===================================== */
    /**
     * 
        ยังต้องเพิ่ม หรือ แยกอีกตารางนึง ในการส่งงงไปอีกระบบนึงของเค้าาา 
     * 
     */
    let externalRef = null;

    try {
      // ── 4.1 POST order (หลัก) ──────────────────────────────
      const hanumanRes = await fetch(
        process.env.HANUMAN_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HANUMAN_API_KEY}`,
          },
          body: JSON.stringify({
            external_order_id: orderRow.id,
            guest_name: orderRow.guest_name,
            service_date: orderRow.service_date,
            adult: orderRow.adult_count,
            child: orderRow.child_count,
            // 💰 ส่ง commission Taxis ไปด้วย 
            commission_amount: commissionAmount,
            staff: {
              id: staff.id,
              username: staff.username,
              first_name: staff.first_name,
              last_name: staff.last_name,
              full_name: `${staff.first_name || ""} ${staff.last_name || ""}`.trim(),
              role: staff.role,
            },
            // ======================
            // 💰 money breakdown
            // ======================
            subtotal_amount: orderRow.subtotal_amount,
            discount_amount: orderRow.discount_amount,
            vat_amount: orderRow.vat_amount,
            vat_rate: orderRow.vat_rate,
            discount_rate: orderRow.discount_rate,
            // Taxi
            taxi_id,
            source_channel_id,
            // Final total
            total_amount: Number(total_amount),
            // survey
            survey_answers,
            // ======================
            // Order items
            // ======================
            items: orderItemsPayload.map((i) => ({
              item_code: i.item_code,
              item_name: i.item_name,
              price: i.price,
              quantity: i.quantity,
            })),
          }),
        }
      );

      const hanumanData = await hanumanRes.json();
      if (!hanumanRes.ok) {
        throw new Error(hanumanData?.error || "Hanuman API failed");
      }
      // ref จากฝั่ง partner
      externalRef = hanumanData?.ref ?? null;

      // ── 4.2 POST order items แยก (ส่งพร้อมกัน) ────────────
      const itemsRes = await fetch(
        `${process.env.HANUMAN_API_URL}/items`,   // 👈 เปลี่ยน URL ตาม Partner กำหนด
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HANUMAN_API_KEY}`,
          },
          body: JSON.stringify({
            external_order_id: orderRow.id,       // 🔗 ผูกกับ order เดิม
            ref: externalRef,                     // ref ที่ได้จาก step 4.1
            items: orderItemsPayload.map((i) => ({
              item_code: i.item_code,
              item_name: i.item_name,
              item_type: i.item_type,
              price: i.price,
              quantity: i.quantity,
            })),
          }),
        }
      );
      if (!itemsRes.ok) {
        const itemsError = await itemsRes.json();
        console.error("Hanuman items API error:", itemsError);
      }

      // update order หลังส่งสำเร็จ
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "pending",
          external_ref: externalRef,
          error_message: null,
        })
        .eq("id", orderRow.id);

    } catch (err) {
      console.error("Hanuman API error:", err);

      // เก็บ error ไว้ แต่ไม่ rollback order
      await supabaseAdmin
        .from("orders")
        .update({
          error_message: err.message,
        })
        .eq("id", orderRow.id);
    }

    // #endregion

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

/*
|--------------------------------------------------------------------------
| สรุปการเชื่อมต่อกับ Partner (Hanuman)
|--------------------------------------------------------------------------
|
| เรา ➜ POST ไปหา Partner
|
| POST <HANUMAN_API_URL>
| Authorization: Bearer <HANUMAN_API_KEY>
|
| Body ตัวอย่างที่เราส่งไป
  |{
      "external_order_id": "9d2e3b8a-2c6e-4f8c-b9a1-7c3e4c9b2a11",
      "guest_name": "Somchai",
      "service_date": "2026-02-02",
      "adult": 2,
      "child": 1,
      "staff_code": "STAFF01",
      "subtotal_amount": 2090.00,
      "discount_rate": 5.00,
      "discount_amount": 104.50,
      "vat_rate": 7.00,
      "vat_amount": 138.99,
      "total_amount": 2124.49,
      "taxi_id" : "text",
      "items": [
        {
          "item_code": "WD_PLUS",
          "item_name": "World D+",
          "price": 1990.00,
          "quantity": 1
        },
        {
          "item_code": "PHOTO_HD",
          "item_name": "HD Photo Package",
          "price": 100.00,
          "quantity": 1
        }
      ]
    }

|
|--------------------------------------------------------------------------
| Flow การสื่อสาร
|--------------------------------------------------------------------------
| 1) เรา ➜ POST order ให้ partner
| 2) partner ➜ POST payment result กลับหาเรา
| 3) partner ➜ POST check-in กลับหาเรา
| 4) ❌ ไม่จำเป็นต้อง GET จาก partner
|--------------------------------------------------------------------------
*/
