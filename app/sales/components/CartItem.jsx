"use client";

export default function CartItem({ item, onQty, onRemove , getFinalPrice }) {

  const handleChange = (e) => {
    const value = e.target.value;

    // ปล่อยให้ลบค่าในช่องได้ชั่วคราว
    if (value === "") return;

    const newQty = Number(value);

    if (!Number.isInteger(newQty)) return;
    if (newQty < 1) return;

    // ใช้ onQty แบบ delta เหมือนเดิม
    const delta = newQty - item.quantity;

    if (delta !== 0) {
      onQty(item.id, delta);
    }
  };

  const finalPrice = getFinalPrice ? getFinalPrice(item) : item.price;

  return (
    <div className="p-4 rounded-lg border hover:border-orange-300 bg-white shadow-sm">
      <div className="flex justify-between mb-2">
        <div>
          <strong className="text-sm">{item.name}</strong>
          <div className="text-xs text-gray-500">
            {finalPrice.toLocaleString()}฿ × {item.quantity}
          </div>
        </div>

        <div className="font-bold text-orange-600">
          {(finalPrice * item.quantity).toLocaleString()}฿
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

          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleChange}
            className="w-12 h-8 text-center border rounded text-sm"
          />

          <button
            onClick={() => onQty(item.id, 1)}
            className="w-8 h-8 bg-orange-500 text-white rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-500 hover:text-red-500"
          title="Remove"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
