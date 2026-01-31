"use client";

import { useState } from "react";
import { createOrder } from "../lib/createOrder";

export default function SurveyModal({ cart, total, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderCode, setOrderCode] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await createOrder(cart);
      if (!data) return;

      setOrderCode(data.order_code);
      setShowSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-xl w-full p-6">

          <h2 className="text-xl font-bold mb-4 text-center">
            Customer Information
          </h2>

          <div className="space-y-2 text-sm mb-4">
            {cart.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>{i.name} × {i.quantity}</span>
                <span>
                  ฿{(i.price * i.quantity).toLocaleString()}
                </span>
              </div>
            ))}

            <div className="border-t pt-2 font-bold flex justify-between">
              <span>Total</span>
              <span className="text-blue-600">
                ฿{total.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 py-2 rounded disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded font-bold disabled:opacity-50"
            >
              {loading ? "Processing..." : "Complete Payment"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-green-600 mb-2">
              ✓ Order Completed!
            </h3>

            <p className="text-gray-700 mb-4">
              Order Code
            </p>

            <div className="text-3xl font-bold tracking-widest text-blue-600 mb-6">
              {orderCode}
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                onClose();
                onComplete?.();
              }}
              className="w-full bg-blue-600 text-white py-2 rounded font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
