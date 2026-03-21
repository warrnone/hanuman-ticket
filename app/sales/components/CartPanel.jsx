"use client";

import {useState} from "react";
import CartItem from "./CartItem";
import { motion, AnimatePresence } from "framer-motion";
import { FiSettings } from "react-icons/fi";
import { FiPercent } from "react-icons/fi";
import { FiDollarSign } from "react-icons/fi";

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

  const [openPricing, setOpenPricing] = useState(false);

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

          {/* Discount/vat  */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* HEADER */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
              onClick={() => setOpenPricing((prev) => !prev)}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <FiSettings className="text-slate-600 text-[16px]" />
              </div>

              <div>
                <h3 className="font-semibold text-sm text-slate-800">
                  Order Pricing
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust discount and VAT
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetPricing?.();
                  }}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Reset
                </button>

                <motion.div
                  animate={{ rotate: openPricing ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 border"
                >
                  ▼
                </motion.div>
              </div>
            </div>

            {/* CONTENT (Motion) */}
            <AnimatePresence initial={false}>
              {openPricing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 space-y-3 border-t bg-slate-50/50">
                    
                    {/* DISCOUNT */}
                    <div className="bg-white border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <FiPercent className="text-green-500 text-[14px]" />
                        <span className="text-sm font-medium text-slate-700">
                          Discount
                        </span>

                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!enableDiscount}
                            onChange={(e) => onToggleDiscount?.(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-slate-200 rounded-full transition peer-checked:bg-green-500
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:w-5 after:h-5 after:bg-white after:rounded-full
                            after:transition-transform peer-checked:after:translate-x-5" />
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discountRate ?? 0}
                          disabled={!enableDiscount}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 100) val = 100;
                            if (val < 0) val = 0;
                            onChangeDiscountRate?.(val);
                          }}
                          className="w-full h-10 border rounded-lg px-3 pr-8 text-sm
                            focus:border-green-500 focus:ring-2 focus:ring-green-100
                            disabled:bg-gray-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          %
                        </span>
                      </div>
                    </div>

                    {/* VAT */}
                    <div className="bg-white border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <FiDollarSign className="text-blue-500 text-[14px]" />
                        <span className="text-sm font-medium text-slate-700">
                          VAT
                        </span>

                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!enableVat}
                            onChange={(e) => onToggleVat?.(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-slate-200 rounded-full transition peer-checked:bg-blue-500
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:w-5 after:h-5 after:bg-white after:rounded-full
                            after:transition-transform peer-checked:after:translate-x-5" />
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={vatRate ?? 0}
                          disabled={!enableVat}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 100) val = 100;
                            if (val < 0) val = 0;
                            onChangeVatRate?.(val);
                          }}
                          className="w-full h-10 border rounded-lg px-3 pr-8 text-sm
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                            disabled:bg-gray-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          %
                        </span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between text-md">
            <span>Subtotal</span>
            <span>{money(subtotal)}฿</span>
          </div>

          {enableDiscount && (
            <div className="flex justify-between text-md text-green-600">
              <span>Discount {discountRate}%</span>
              <span>-{money(discount)}฿</span>
            </div>
          )}

          {enableVat && (
            <div className="flex justify-between text-md text-blue-600">
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