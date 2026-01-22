"use client";

export default function SurveyModal({ cart, total, onClose, onComplete }) {
  return (
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
            <span className="text-orange-600">
              ฿{total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onComplete}
            className="flex-1 bg-orange-500 text-white py-2 rounded font-bold"
          >
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
}
