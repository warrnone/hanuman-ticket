"use client";

export default function CartItem({ item, onQty, onRemove }) {
  return (
    <div className="p-4 rounded-lg border hover:border-orange-300 bg-white shadow-sm">
      <div className="flex justify-between mb-2">
        <div>
          <strong className="text-sm">{item.name}</strong>
          <div className="text-xs text-gray-500">
            ฿{item.price.toLocaleString()} × {item.quantity}
          </div>
        </div>
        <div className="font-bold text-orange-600">
          ฿{(item.price * item.quantity).toLocaleString()}
        </div>
      </div>

      <div className="flex justify-between items-center border-t pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQty(item.id, -1)}
            className="w-8 h-8 bg-gray-200 rounded"
          >
            −
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onQty(item.id, 1)}
            className="w-8 h-8 bg-orange-500 text-white rounded"
          >
            +
          </button>
        </div>
        <button onClick={() => onRemove(item.id)}>🗑️</button>
      </div>
    </div>
  );
}
