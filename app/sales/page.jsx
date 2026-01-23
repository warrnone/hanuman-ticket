"use client";

import { useState, useEffect } from "react";
import CategorySidebar from "./components/CategorySidebar";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import SurveyModal from "./components/SurveyModal";
import LoadingOverlay from "./components/LoadingOverlay";
import { swalSuccess, swalConfirm } from "@/app/components/Swal";
import { useRouter, usePathname } from "next/navigation";

export default function SalePage() {

  const router = useRouter();
  const pathname = usePathname();

  /* =========================
     STATE
  ========================= */
  const [menu, setMenu] = useState([]);

  // activity = Zipline / Luge / Roller / Sling Shot
  const [selectedActivity, setSelectedActivity] = useState(null);

  // PACKAGE | PHOTO_VIDEO
  const [selectedMode, setSelectedMode] = useState("PACKAGE");

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(false);


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
      setLoading(false); // ✅ ถูกต้อง
    }
  };

  /* =========================
     LOAD SALE MENU
  ========================= */
  useEffect(() => {
    loadMenu();
  }, []);

  /* =========================
     CART LOGIC
  ========================= */
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

  /* =========================
     CURRENT ACTIVITY + ITEMS
  ========================= */
  const currentActivity = menu.find(
    (c) => c.name === selectedActivity
  );

  const items = (currentActivity?.items || []).filter((item) => {
    if (selectedMode === "PACKAGE") {
      return item.type === "PACKAGE";
    }
    return item.type === "PHOTO" || item.type === "VIDEO";
  });


  /* ===============================
    LOGOUT
  =============================== */
  const logout = async () => {
    const result = await swalConfirm(
      "ออกจากระบบ?",
      "คุณต้องการออกจากระบบใช่หรือไม่"
    );

    if (!result.isConfirmed) return;

    try {
      // 👉 ถ้ายังไม่มี api/logout ให้เปลี่ยนเป็น /api/admin/logout
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("logout error", e);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("role");

    swalSuccess("ออกจากระบบแล้ว");
    router.replace("/login");
  };

  /* =========================
     TOTALS
  ========================= */
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
      <div className="flex h-screen bg-gray-100">
        {/* =========================
            LEFT: ACTIVITY SIDEBAR
        ========================= */}
        <CategorySidebar
          categories={menu.map((c) => c.name)}
          selected={selectedActivity}
          onSelect={(name) => {
            setSelectedActivity(name);
            setSelectedMode("PACKAGE"); // reset mode ทุกครั้ง
          }}
          onLogout={logout}
        />

        {/* =========================
            CENTER: CONTENT
        ========================= */}
        <div className="flex-1 flex flex-col">
          <TopBar
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cart={cart}
          />

          {/* MODE TABS */}
          <div className="flex bg-white border-b">
            <button
              className={`px-6 py-3 font-medium ${
                selectedMode === "PACKAGE"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setSelectedMode("PACKAGE")}
            >
              📦 Packages
            </button>

            <button
              className={`px-6 py-3 font-medium ${
                selectedMode === "PHOTO_VIDEO"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setSelectedMode("PHOTO_VIDEO")}
            >
              📷 Photo & Video
            </button>
          </div>

          {/* PRODUCT GRID */}
          <ProductGrid
            title={selectedActivity}
            items={items}
            onAdd={(item) => {
              // ตอนนี้ยังให้ add ได้เหมือนเดิม
              // (Photo/Video จะไปต่อด้วย Pax Modal ภายหลัง)
              addToCart(item);
            }}
          />
        </div>

        {/* =========================
            RIGHT: CART
        ========================= */}
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

        {/* =========================
            SURVEY / CHECKOUT
        ========================= */}
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
