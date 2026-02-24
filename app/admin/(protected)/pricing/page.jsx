"use client";

import { useEffect, useState } from "react";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const loadPlans = async () => {
    const res = await fetch("/api/admin/rate-plans");
    const json = await res.json();
    setPlans(json.data || []);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        💰 Pricing / Rate Plan
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Rate Plans</h2>

          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`p-3 rounded cursor-pointer mb-2 ${
                selectedPlan?.id === plan.id
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {plan.name}
            </div>
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          {!selectedPlan ? (
            <div className="text-gray-400 text-center py-10">
              Select Rate Plan
            </div>
          ) : (
            <div>
              <h2 className="font-semibold mb-4">
                Pricing: {selectedPlan.name}
              </h2>

              {/* ตรงนี้ค่อยโหลด package + pricing */}
              <div className="text-sm text-gray-500">
                Pricing matrix will be here...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}