"use client";

import CartItem from "./CartItem";

export default function CartPanel({
  cart,
  subtotal,
  discount,
  tax,
  total,
  onQty,
  onRemove,
  onCheckout,
  onClear,
  onClose,
  discountRate,
  vatRate,
  enableDiscount,
  enableVat,
  getFinalPrice,
  onChangeDiscountRate,
  onChangeVatRate,
  onToggleDiscount,
  onToggleVat,
  onResetPricing,
}) {
  const money = (n) =>
    Number(n || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col h-full w-full bg-white shadow-xl border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold text-lg">🧾 Cart</h2>

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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <p className="text-gray-400 text-center mt-20">Cart is empty</p>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onQty={onQty}
              onRemove={onRemove}
              getFinalPrice={getFinalPrice}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-3 bg-gray-50">
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">
                Order Pricing
              </h3>

              <button
                type="button"
                onClick={onResetPricing}
                className="text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Discount
                  </span>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!enableDiscount}
                      onChange={(e) => onToggleDiscount?.(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full transition peer-checked:bg-green-500">
                      <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountRate ?? 0}
                    disabled={!enableDiscount}
                    onChange={(e) =>
                      onChangeDiscountRate?.(Number(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="text-sm font-semibold text-gray-500">%</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">VAT</span>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!enableVat}
                      onChange={(e) => onToggleVat?.(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full transition peer-checked:bg-blue-500">
                      <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vatRate ?? 0}
                    disabled={!enableVat}
                    onChange={(e) => onChangeVatRate?.(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="text-sm font-semibold text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{money(subtotal)}฿</span>
          </div>

          {enableDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount {discountRate}%</span>
              <span>-{money(discount)}฿</span>
            </div>
          )}

          {enableVat && (
            <div className="flex justify-between text-sm">
              <span>VAT {vatRate}%</span>
              <span>{money(tax)}฿</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-orange-600">{money(total)}฿</span>
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