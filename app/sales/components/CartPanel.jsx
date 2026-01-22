"use client";

import CartItem from "./CartItem";

export default function CartPanel({
  cart,
  paymentMethod,
  subtotal,
  discount,
  tax,
  total,
  onQty,
  onRemove,
  onCheckout,
  onClear,
}) {
  return (
    <div className="w-96 bg-white shadow-xl flex flex-col border-l">
      <div className="p-4 border-b font-bold">
        🧾 Cart ({paymentMethod})
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <p className="text-gray-400 text-center mt-20">
            Cart is empty
          </p>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onQty={onQty}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-2 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-฿{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT</span>
            <span>฿{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-orange-600">
              ฿{total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold"
          >
            CHECKOUT
          </button>
          <button
            onClick={onClear}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
}
