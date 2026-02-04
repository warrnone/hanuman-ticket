import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

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
        .select("id, username, is_active")
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
       2. Create order (orders table)
       - ใช้ total_amount จาก client
    ===================================== */

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
          subtotal_amount: Number(subtotal_amount),
          discount_amount: Number(discount_amount),
          vat_amount: Number(vat_amount),
          // ✅ total ที่ client คำนวณมาแล้ว (numeric)
          total_amount: Number(total_amount),
          vat_rate: Number(vat_rate),
          discount_rate: Number(discount_rate),
          payment_status: "pending",
          checkin_status: "not_checked_in",
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
       3. Insert order items
       - ถ้าล้มเหลว จะ rollback order
    ===================================== */

    const orderItemsPayload = items.map((i) => ({
      order_id: orderRow.id,

      item_type: i.item_type,
      item_id: i.item_id ?? null,
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
       4. Send order to Partner (Hanuman API)
       - เราเป็นฝั่ง POST ไปหาเค้า
    ===================================== */

    let externalRef = null;

    try {
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
            staff_code: staffCode,
            // ======================
            // 💰 money breakdown
            // ======================
            subtotal_amount: orderRow.subtotal_amount,
            discount_amount: orderRow.discount_amount,
            vat_amount: orderRow.vat_amount,
            vat_rate: orderRow.vat_rate,
            discount_rate: orderRow.discount_rate,
            // Final total
            total_amount: Number(total_amount),
            // ======================
            // items
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

    /* =====================================
       5. Response กลับไปที่ client
    ===================================== */

    return NextResponse.json({
      success: true,
      order_id: orderRow.id,
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
