"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SaleTaxiPage() {
  const router = useRouter();

  const [sale, setSale] = useState(null);
  const [source, setSource] = useState("WALK_IN");
  const [taxis, setTaxis] = useState([]);
  const [selectedTaxi, setSelectedTaxi] = useState("");

//   useEffect(() => {
//     const s = sessionStorage.getItem("pending_sale");
//     if (!s) {
//       router.replace("/sale");
//       return;
//     }
//     setSale(JSON.parse(s));
//   }, []);

  useEffect(() => {
    fetch("/api/sale/taxi/active")
      .then((r) => r.json())
      .then((j) => setTaxis(j.data || []));
  }, []);

  const canConfirm =
    source === "WALK_IN" ||
    (source === "TAXI" && selectedTaxi);

  const confirm = async () => {
    if (!canConfirm) return;

    const taxi = taxis.find((t) => t.id === selectedTaxi);

    const payload = {
      ...sale,
      source,
      taxi_id: taxi?.id || null,
      vehicle_type: taxi?.vehicle_type || null,
      car_number: taxi?.car_number || null,
      commission_eligible: source === "TAXI",
    };

    await fetch("/api/sale/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    sessionStorage.removeItem("pending_sale");
    router.replace("/sale");
  };

  if (!sale) return null;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Customer Source</h1>

      <label>
        <input
          type="radio"
          checked={source === "WALK_IN"}
          onChange={() => setSource("WALK_IN")}
        />
        Walk-in
      </label>

      <label className="ml-4">
        <input
          type="radio"
          checked={source === "TAXI"}
          onChange={() => setSource("TAXI")}
        />
        Taxi / Van
      </label>

      {source === "TAXI" && (
        <select
          className="block w-full mt-3 border p-2"
          value={selectedTaxi}
          onChange={(e) => setSelectedTaxi(e.target.value)}
        >
          <option value="">-- Select Car --</option>
          {taxis.map((t) => (
            <option key={t.id} value={t.id}>
              {t.car_number} ({t.vehicle_type})
            </option>
          ))}
        </select>
      )}

      <button
        className="mt-6 w-full bg-orange-500 text-white py-3 rounded disabled:opacity-50"
        disabled={!canConfirm}
        onClick={confirm}
      >
        Confirm & Pay
      </button>
    </div>
  );
}
