import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

/*
  body example
  {
    guest_name,
    service_date,
    adult_count,
    child_count,
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

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      items = [],
      guest_name,
      service_date,
      adult_count,
      child_count,
    } = body;

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

    /* =====================================
      1. get staff from cookie
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
      2. calculate total
    ===================================== */

    const totalAmount = items.reduce((sum, i) => {
      return sum + (Number(i.price) * Number(i.quantity));
    }, 0);

    /* =====================================
      3. create order (NO order_code)
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

          total_amount: totalAmount,

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
      5. send to Partner (Hanuman API)
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
            total_amount: totalAmount,
            items: orderItemsPayload.map(i => ({
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

      externalRef = hanumanData?.ref ?? null;

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
      await supabaseAdmin
        .from("orders")
        .update({
          error_message: err.message,
        })
        .eq("id", orderRow.id);
    }
    /* =====================================
      6. response
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
