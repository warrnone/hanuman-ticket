"use client";

import { useState, useEffect } from "react";
import CategorySidebar from "./components/CategorySidebar";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import SurveyModal from "./components/SurveyModal";
import LoadingOverlay from "./components/LoadingOverlay";
import { swalSuccess, swalConfirm } from "@/app/components/Swal";
import { useRouter } from "next/navigation";

export default function SalePage() {
  const router = useRouter();

  /* ========================= STATE ========================= */
  const [menu, setMenu] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedMode, setSelectedMode] = useState("PACKAGE");
  const [cart, setCart] = useState([]);
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 👉 เพิ่ม state สำหรับ toggle cart บน tablet/mobile
  const [showCart, setShowCart] = useState(false);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sale/menu");
      const json = await res.json();
      setMenu(json.data || []);
      if (json.data && json.data.length > 0) {
        setSelectedActivity(json.data[0].name);
      }
    } catch (err) {
      console.error("Load sale menu error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  /* ========================= CART LOGIC ========================= */
  const addToCart = (item) => {
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
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

  /* ========================= CURRENT ACTIVITY + ITEMS ========================= */
  const currentActivity = menu.find((c) => c.name === selectedActivity);
  const items = (currentActivity?.items || []).filter((item) => {
    if (selectedMode === "PACKAGE") {
      return item.type === "PACKAGE";
    }
    return item.type === "PHOTO" || item.type === "VIDEO";
  });

  const hasPhotoVideo = (currentActivity?.items || []).some(
     (item) => item.type === "PHOTO" || item.type === "VIDEO"
  );

  /* ========================= LOGOUT ========================= */
  const logout = async () => {
    const result = await swalConfirm(
      "Logout?",
      "Are you sure you want to log out?"
    );
    if (!result.isConfirmed) return;

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("logout error", e);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("role");
    swalSuccess("Logged out successfully");
    router.replace("/login");
  };

  /* ========================= TOTALS vat , discount ========================= */
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.07;
  const total = subtotal - discount + tax;


  return (
    <>
      {loading && <LoadingOverlay />}
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* ========================= LEFT: ACTIVITY SIDEBAR ========================= */}
        {/* 👉 ซ่อน sidebar บน tablet/mobile, แสดงเฉพาะ desktop */}
        <div className="hidden lg:block">
          <CategorySidebar
            categories={menu.map((c) => c.name)}
            selected={selectedActivity}
            onSelect={(name) => {
              setSelectedActivity(name);
              setSelectedMode("PACKAGE");
            }}
            onLogout={logout}
          />
        </div>

        {/* ========================= CENTER: CONTENT ========================= */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            cart={cart}
            onCartClick={() => setShowCart(!showCart)} // 👉 เพิ่ม prop
            onLogout={logout}
          />

          {/* 👉 Dropdown สำหรับเลือก Activity บน tablet/mobile */}
          <div className="lg:hidden px-4 py-3 bg-white border-b">
            <select
              value={selectedActivity || ""}
              onChange={(e) => {
                setSelectedActivity(e.target.value);
                setSelectedMode("PACKAGE");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
            >
              {menu
                .filter((c) => c.name !== "Photo & Video")
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 👉 MODE TABS - แสดงเฉพาะเมื่อมี Photo/Video */}
          {hasPhotoVideo && (
            <div className="flex bg-white border-b">
              <button
                className={`flex-1 lg:flex-none px-4 lg:px-6 py-3 font-medium text-sm lg:text-base ${
                  selectedMode === "PACKAGE"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedMode("PACKAGE")}
              >
                📦 Packages
              </button>

              <button
                className={`flex-1 lg:flex-none px-4 lg:px-6 py-3 font-medium text-sm lg:text-base ${
                  selectedMode === "PHOTO_VIDEO"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedMode("PHOTO_VIDEO")}
              >
                📷 Photo & Video
              </button>
            </div>
          )}

          {/* PRODUCT GRID */}
          <ProductGrid
            title={selectedActivity}
            items={items}
            onAdd={(item) => {
              addToCart(item);
              // 👉 เปิด cart panel อัตโนมัติบน tablet เมื่อเพิ่มสินค้า
              if (window.innerWidth < 1024) {
                setShowCart(true);
              }
            }}
          />
        </div>

        {/* ========================= RIGHT: CART ========================= */}
        {/* 👉 Desktop: แสดงตลอด, Tablet/Mobile: แสดงเป็น overlay เมื่อ showCart = true */}
        <div
          className={`
            fixed lg:relative
            inset-y-0 right-0
            w-full sm:w-96 lg:w-80 xl:w-96
            bg-white
            transform transition-transform duration-300 ease-in-out
            lg:transform-none
            z-40
            ${showCart ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          <CartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            total={total}
            onQty={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={() => setShowSurvey(true)}
            onClear={() => setCart([])}
            onClose={() => setShowCart(false)} // 👉 เพิ่ม prop สำหรับปิด cart บน mobile
          />
        </div>

        {/* 👉 Overlay สำหรับ mobile/tablet */}
        {showCart && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setShowCart(false)}
          />
        )}

        {/* ========================= SURVEY / CHECKOUT ========================= */}
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
    </>
  );
}