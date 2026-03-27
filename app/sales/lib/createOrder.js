export async function createOrder(cart, survey) {
  const res = await fetch("/api/sale/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // ======================
      // customer / booking
      // ======================
      guest_name: survey.guest_name,
      service_date: survey.service_date,
      adult_count: survey.adult_count,
      child_count: survey.child_count,

      taxi_id: survey.taxi_id,
      source_channel_id: survey.source_channel_id,
      start_time: survey.start_time,
      remark: survey.remark,

      survey_answers: survey.survey_answers || {},

      // ======================
      // money breakdown
      // ======================
      subtotal_amount: Number(survey.subtotal_amount),
      discount_amount: Number(survey.discount_amount),
      vat_amount: Number(survey.vat_amount),
      total_amount: Number(survey.total_amount),
      vat_rate: Number(survey.vat_rate),
      discount_rate: Number(survey.discount_rate),

      // ======================
      // items
      // ======================
      items: cart.map((i) => {
        let itemType = String(i.item_type || i.type || "PACKAGE")
          .trim()
          .toUpperCase();

        // รองรับหลายรูปแบบของ photo+video
        if (
          ["PHOTO_VIDEO", "VIDEO_PHOTO", "PHOTO+VIDEO", "PHOTO-VIDEO"].includes(itemType)
        ) {
          itemType = "PHOTO_VIDEO";
        }

        // whitelist ใหม่
        if (!["PACKAGE", "ADDON", "PHOTO", "VIDEO", "PHOTO_VIDEO"].includes(itemType)) {
          itemType = "PACKAGE";
        }

        return {
          item_id: i.item_id || i.id || null,
          item_type: itemType,
          source_type: i.source_type || i.type || null,

          item_code: i.item_code || i.code || null,
          item_name: i.item_name || i.name || "-",

          price: Number(i.price || 0),
          quantity: Number(i.quantity || 1),

          media_type: i.media_type || null,
          sale_mode: i.sale_mode || null,

          pax_count:
            i.pax_count !== undefined && i.pax_count !== null
              ? Number(i.pax_count)
              : i.pax !== undefined && i.pax !== null
              ? Number(i.pax)
              : 0,

          included_pax:
            i.included_pax !== undefined && i.included_pax !== null
              ? Number(i.included_pax)
              : 0,

          extra_pax:
            i.extra_pax !== undefined && i.extra_pax !== null
              ? Number(i.extra_pax)
              : null,

          base_price:
            i.base_price !== undefined && i.base_price !== null
              ? Number(i.base_price)
              : 0,

          extra_pax_price:
            i.extra_pax_price !== undefined && i.extra_pax_price !== null
              ? Number(i.extra_pax_price)
              : 0,

          pricing_note: i.pricing_note || null,
        };
      }),
    }),
  });

  if (res.status === 401) {
    localStorage.removeItem("role");
    window.location.href = "/";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Create order failed");
  }

  return data;
}