"use client";

import { useState } from "react";
import CategorySidebar from "./components/CategorySidebar";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import SurveyModal from "./components/SurveyModal";

export default function SalePage() {
  const [selectedCategory, setSelectedCategory] = useState("World Packages");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSurvey, setShowSurvey] = useState(false);

  /* =========================
     DATA (เหมือนของเดิม)
  ========================= */
  const categories = [
    "World Packages",
    "Zipline",
    "Adventures",
    "Luge",
    "Photo & Video",
    "Add-ons",
  ];

  const menuItems = { /* 👈 ใช้ object เดิมของคุณทั้งก้อน */ };

  /* =========================
     CART LOGIC (เดิม)
  ========================= */
  const addToCart = (item) => {
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      setCart(cart.map((c) =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(
      cart
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.07;
  const total = subtotal - discount + tax;

  return (
    <div className="flex h-screen bg-gray-100">
      <CategorySidebar
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cart={cart}
        />

        <ProductGrid
          title={selectedCategory}
          items={menuItems[selectedCategory] || []}
          onAdd={addToCart}
        />
      </div>

      <CartPanel
        cart={cart}
        paymentMethod={paymentMethod}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        total={total}
        onQty={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setShowSurvey(true)}
        onClear={() => setCart([])}
      />

      {showSurvey && (
        <SurveyModal
          cart={cart}
          total={total}
          onClose={() => setShowSurvey(false)}
          onComplete={() => {
            setCart([]);
            setShowSurvey(false);
          }}
        />
      )}
    </div>
  );
}
