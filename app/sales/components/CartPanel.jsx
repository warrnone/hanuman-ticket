"use client";

import CartItem from "./CartItem";

export default function CartPanel({cart,
  subtotal,
  discount,
  tax,
  total,
  onQty,
  onRemove,
  onCheckout,
  onClear,
  onClose
}) {
  return (
    <div className="flex flex-col h-full w-full bg-white shadow-xl border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold text-lg">
          🧾 Cart 
        </h2>
        {/* ปุ่ม Close สำหรับ mobile/tablet */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close cart"
          >
            ✕
          </button>
        )}
      </div>

      {/* Cart Items */}
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

      {/* Summary & Checkout */}
      {cart.length > 0 && (
        <div className="border-t p-4 space-y-2 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          {/* <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-฿{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT</span>
            <span>฿{tax.toFixed(2)}</span>
          </div> */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-orange-600">
              ฿{total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors"
          >
            CHECKOUT
          </button>
          <button
            onClick={onClear}
            className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition-colors"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
}