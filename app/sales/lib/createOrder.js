export async function createOrder(cart) {
  const res = await fetch("/api/sale/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: cart.map(i => ({
        item_id: i.id,
        item_type: i.type,     // package | photo | video
        item_code: i.code,    // code ของฝั่งระบบเค้า
        item_name: i.name,
        price: i.price,
        quantity: i.quantity
      }))
    })
  });

  // 🔴 ถ้า session หมดอายุ
  if (res.status === 401) {
    // เคลียร์ role ที่คุณเคยเก็บไว้
    localStorage.removeItem("role");

    // เด้งไปหน้าเลือก role / login
    window.location.href = "/";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Create order failed");
  }

  return data;
}
