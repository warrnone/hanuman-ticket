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
      // 💰 money breakdown
      // ======================
      subtotal_amount: Number(survey.subtotal_amount),
      discount_amount: Number(survey.discount_amount),
      vat_amount: Number(survey.vat_amount),
      total_amount: Number(survey.total_amount),
      vat_rate: Number(survey.vat_rate),
      discount_rate: Number(survey.discount_rate),

      // ======================
      // items (🔥 FIXED)
      // ======================
      items: cart.map((i) => {
        // 🔥 normalize type
        let itemType = (i.item_type || i.type || "PACKAGE").toUpperCase();

        // 🔥 safety fallback
        if (!["PACKAGE", "ADDON", "PHOTO", "VIDEO"].includes(itemType)) {
          itemType = "PACKAGE";
        }

        return {
          item_id: i.id,
          item_type: itemType, // ✅ PACKAGE / ADDON / PHOTO / VIDEO
          item_code: i.code ?? null,
          item_name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
        };
      }),
    }),
  });

  // 🔴 session หมด
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