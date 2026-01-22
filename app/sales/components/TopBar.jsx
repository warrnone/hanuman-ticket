"use client";

export default function TopBar({ paymentMethod, setPaymentMethod, cart }) {
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="bg-white p-4 shadow-sm border-b flex justify-between items-center">
      <div className="relative max-w-md w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search packages..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex items-center gap-3 ml-4">
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="CASH">💵 CASH</option>
          <option value="CARD">💳 CARD</option>
          <option value="QR">📱 QR PAY</option>
        </select>

        <div className="bg-orange-100 px-3 py-1 rounded-full text-sm font-medium">
          🛒 {totalItems} items
        </div>
      </div>
    </div>
  );
}
