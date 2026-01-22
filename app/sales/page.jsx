"use client";

import { useState , useEffect } from "react";
import CategorySidebar from "./components/CategorySidebar";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import SurveyModal from "./components/SurveyModal";

export default function SalePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSurvey, setShowSurvey] = useState(false);
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    fetch("/api/sale/menu")
      .then((res) => res.json())
      .then((res) => {
        setMenu(res.data);
        if (res.data.length > 0) {
          setSelectedCategory(res.data[0].name);
        }
      });
  }, []);

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
  const currentCategory = menu.find((c) => c.name === selectedCategory);
  const items = currentCategory?.items || [];
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.07;
  const total = subtotal - discount + tax;

  return (
    <div className="flex h-screen bg-gray-100">
      <CategorySidebar
        categories={menu.map((c) => c.name)}
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
          items={items}
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
