import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

/*
  body example
  {
    items: [
      {
        item_id,
        item_type,   // package | photo | video
        item_code,   // code ที่ฝั่งระบบเค้าใช้
        item_name,
        price,
        quantity
      }
    ]
  }
*/

function generate4DigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items" },
        { status: 400 }
      );
    }

    /* =====================================
      1. get staff from cookie
      (ใช้ username เป็นรหัสพนักงาน)
    ===================================== */

    const cookieStore = cookies();

    // ❗สมมติว่าตอน login คุณ set cookie เป็น user_id ไว้แล้ว
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

    // ✅ ใช้ username เป็น staff_code
    const staffCode = staff.username;

    if (!staffCode) {
      return NextResponse.json(
        { error: "Staff username not set" },
        { status: 400 }
      );
    }

    /* =====================================
      2. calculate total
    ===================================== */

    const totalAmount = items.reduce((sum, i) => {
      return sum + (Number(i.price) * Number(i.quantity));
    }, 0);

    /* =====================================
      3. create order (retry กัน code ชน)
    ===================================== */

    let orderRow = null;
    let lastError = null;

    for (let i = 0; i < 10; i++) {
      const orderCode = generate4DigitCode();

      const { data, error } = await supabaseAdmin
        .from("orders")
        .insert({
          order_code: orderCode,
          staff_id: staff.id,
          staff_code: staffCode,   // ← ใช้ username ตรงนี้
          total_amount: totalAmount,
          status: "pending",
        })
        .select()
        .single();

      if (!error) {
        orderRow = data;
        break;
      }

      lastError = error;
    }

    if (!orderRow) {
      console.error("Create order failed:", lastError);
      return NextResponse.json(
        { error: "Cannot generate order code" },
        { status: 500 }
      );
    }

    /* =====================================
      4. insert order_items
    ===================================== */

    const orderItemsPayload = items.map((i) => ({
      order_id: orderRow.id,

      item_type: i.item_type,
      item_id: i.item_id ?? null,
      item_code: i.item_code ?? null,
      item_name: i.item_name,

      price: i.price,
      quantity: i.quantity,
    }));

    const { error: itemsError } =
      await supabaseAdmin
        .from("order_items")
        .insert(orderItemsPayload);

    if (itemsError) {
      console.error("Insert order_items error:", itemsError);

      // rollback
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
      5. response
    ===================================== */

    return NextResponse.json({
      success: true,
      order_id: orderRow.id,
      order_code: orderRow.order_code,
    });

  } catch (err) {
    console.error("POST /api/sales/orders error:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
