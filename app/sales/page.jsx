"use client";

import { useState, useEffect } from "react";
import CategorySidebar from "./components/CategorySidebar";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import SurveyModal from "./components/SurveyModal";
import LoadingOverlay from "./components/LoadingOverlay";
import { swalSuccess, swalConfirm, swalError } from "@/app/components/Swal";
import { useRouter } from "next/navigation";

export default function SalePage() {
  const router = useRouter();

  /* ========================= STATE ========================= */
  const [menu, setMenu] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [cart, setCart] = useState([]);
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(false);

  // mobile / tablet cart
  const [showCart, setShowCart] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [pricingRules, setPricingRules] = useState([]);

  // pricing setting from admin
  const [pricing, setPricing] = useState({
    vat_rate: 7,
    enable_vat: false,
    discount_rate: 5,
    enable_discount: true,
  });

  // editable pricing for current order
  const [orderPricing, setOrderPricing] = useState({
    vat_rate: 7,
    enable_vat: false,
    discount_rate: 5,
    enable_discount: true,
  });

  /* ========================= LOAD DATA ========================= */
  const loadPricing = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;

      const data = await res.json();

      const nextPricing = {
        vat_rate: Number(data.vat_rate),
        enable_vat: Boolean(data.enable_vat),
        discount_rate: Number(data.discount_rate),
        enable_discount: Boolean(data.enable_discount),
      };

      setPricing(nextPricing);
      setOrderPricing(nextPricing);
    } catch (err) {
      console.error("load pricing failed", err);
    }
  };

  const handleApiResponse = (res) => {
    if (res.status === 401 || res.status === 403) {
      router.replace("/login");
      return false;
    }
    return true;
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sale/menu");
      if (!handleApiResponse(res)) return;

      const json = await res.json();
      const nextMenu = json.data || [];

      // ซ่อน category "Photo & Video" ออกจาก activity หลัก
      const filteredMenu = nextMenu.filter((c) => c.name !== "Photo & Video");

      setMenu(filteredMenu);

      if (filteredMenu.length > 0) {
        setSelectedActivity(filteredMenu[0].name);
      }
    } catch (err) {
      console.error("Load sale menu error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    loadPricing();
  }, []);

  const loadChannelPricing = async () => {
    try {
      const res = await fetch(`/api/sale/pricing?source_channel_id=${selectedChannel.id}`);
      const json = await res.json();
      setPricingRules(json.data || []);
    } catch (err) {
      console.error("load channel pricing error:", err);
    }
  };
  useEffect(() => {
    if (!selectedChannel) return;
    loadChannelPricing();
  }, [selectedChannel]);

  /* ========================= CART LOGIC ========================= */
  const addToCart = (item) => {
    const found = cart.find((c) => c.id === item.id);

    if (found) {
      setCart((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  /* ========================= CURRENT ACTIVITY ========================= */
  const currentActivity = menu.find((c) => c.name === selectedActivity);

  // แสดงใน grid เฉพาะ package หลัก
  const packageItems = (currentActivity?.items || []).filter(
    (item) => item.type === "PACKAGE"
  );

  // fixed add-ons เช่น DOUBLING
  const addonItems = (currentActivity?.items || []).filter(
    (item) => item.type === "ADDON"
  );

  // media add-ons ใช้เปิด flow อื่นในอนาคต
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

  /* ========================= TOTALS ========================= */
  const round2 = (n) => Math.round(n * 100) / 100;

  const subtotal = round2(
    cart.reduce((sum, item) => {
      const rule = pricingRules.find((r) => r.package_id === item.id);

      let price = Number(item.price || 0);

      if (rule?.price_override) {
        price = Number(rule.price_override);
      } else if (rule?.discount_type === "PERCENT") {
        price = price - (price * Number(rule.discount_value || 0)) / 100;
      } else if (rule?.discount_type === "FIXED") {
        price = price - Number(rule.discount_value || 0);
      }

      return sum + price * item.quantity;
    }, 0)
  );

  const discount = orderPricing.enable_discount
    ? round2((subtotal * Number(orderPricing.discount_rate || 0)) / 100)
    : 0;

  const tax = orderPricing.enable_vat
    ? round2(((subtotal - discount) * Number(orderPricing.vat_rate || 0)) / 100)
    : 0;

  const total = round2(subtotal - discount + tax);

  const getFinalPrice = (item) => {
    const rule = pricingRules.find((r) => r.package_id === item.id);

    let price = Number(item.price || 0);

    if (rule?.price_override) {
      price = Number(rule.price_override);
    } else if (rule?.discount_type === "PERCENT") {
      price = price - (price * Number(rule.discount_value || 0)) / 100;
    } else if (rule?.discount_type === "FIXED") {
      price = price - Number(rule.discount_value || 0);
    }

    return round2(price);
  };

  /* ========================= MEDIA PLACEHOLDER ========================= */
  const handleMediaClick = (mediaMode) => {
    swalError(
      `${mediaMode} setup ยังไม่เสร็จ`,
      "ตอนนี้เตรียมปุ่มไว้แล้ว ขั้นต่อไปค่อยต่อ modal + query ราคา photo_video_prices"
    );
  };

  return (
    <>
      {loading && <LoadingOverlay />}

      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* ========================= LEFT: ACTIVITY SIDEBAR ========================= */}
        <div className="hidden lg:block">
          <CategorySidebar
            categories={menu.map((c) => c.name)}
            selected={selectedActivity}
            onSelect={(name) => {
              setSelectedActivity(name);
            }}
            onLogout={logout}
          />
        </div>

        {/* ========================= CENTER: CONTENT ========================= */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopBar
            cart={cart}
            onCartClick={() => setShowCart(!showCart)}
            onLogout={logout}
          />

          {/* ========================= MOBILE ACTIVITY SELECT ========================= */}
          <div className="lg:hidden w-full px-4 py-3 bg-white border-b">
            <div className="w-full max-w-full overflow-hidden">
              <select
                value={selectedActivity || ""}
                onChange={(e) => {
                  setSelectedActivity(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
              >
                {menu.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ========================= SCROLLABLE CONTENT ========================= */}
          <div className="flex-1 overflow-y-auto">
            {/* PACKAGE GRID */}
            <ProductGrid
              title={selectedActivity}
              items={packageItems}
              onAdd={(item) => {
                const wasEmpty = cart.length === 0;
                addToCart(item);

                if (window.innerWidth < 1024 && wasEmpty) {
                  setShowCart(true);
                }
              }}
            />

            {/* ========================= OPTIONAL ADD-ONS ========================= */}
            {(addonItems.length > 0 || hasPhotoVideo) && (
              <div className="px-4 lg:px-6 pb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Optional Add-ons
                    </h3>
                    <p className="text-sm text-slate-500">
                      Add extra services for this activity
                    </p>
                  </div>

                  {/* FIXED ADDONS */}
                  {addonItems.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Fixed Add-ons
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {addonItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-orange-300 hover:bg-orange-50 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h5 className="font-semibold text-slate-800 truncate">
                                  {item.name}
                                </h5>
                                <p className="text-xs text-slate-500 mt-1">
                                  Add-on service
                                </p>
                                <div className="mt-3 text-orange-600 font-bold text-lg">
                                  {Number(item.price || 0).toLocaleString()}฿
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const wasEmpty = cart.length === 0;
                                  addToCart(item);

                                  if (window.innerWidth < 1024 && wasEmpty) {
                                    setShowCart(true);
                                  }
                                }}
                                className="shrink-0 w-11 h-11 rounded-full bg-orange-500 text-white text-xl flex items-center justify-center hover:bg-orange-600 transition shadow-sm leading-none"
                                aria-label={`Add ${item.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PHOTO / VIDEO ACTIONS */}
                  {hasPhotoVideo && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Photo & Video
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleMediaClick("PHOTO")}
                          className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-orange-300 hover:bg-orange-50 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-800">
                                📷 Photo
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                Select pax and pricing rule
                              </div>
                            </div>
                            <span className="text-orange-500 font-bold text-lg">
                              Select
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMediaClick("VIDEO")}
                          className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-orange-300 hover:bg-orange-50 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-800">
                                🎥 Video
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                Select type, duration and pax
                              </div>
                            </div>
                            <span className="text-orange-500 font-bold text-lg">
                              Select
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMediaClick("PHOTO_VIDEO")}
                          className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-orange-300 hover:bg-orange-50 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-800">
                                🎞 Photo + Video
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                Bundle media options
                              </div>
                            </div>
                            <span className="text-orange-500 font-bold text-lg">
                              Select
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================= RIGHT: CART ========================= */}
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
            onClose={() => setShowCart(false)}
            discountRate={orderPricing.discount_rate}
            vatRate={orderPricing.vat_rate}
            enableDiscount={orderPricing.enable_discount}
            enableVat={orderPricing.enable_vat}
            getFinalPrice={getFinalPrice}
            onChangeDiscountRate={(value) =>
              setOrderPricing((prev) => ({ ...prev, discount_rate: value }))
            }
            onChangeVatRate={(value) =>
              setOrderPricing((prev) => ({ ...prev, vat_rate: value }))
            }
            onToggleDiscount={(value) =>
              setOrderPricing((prev) => ({ ...prev, enable_discount: value }))
            }
            onToggleVat={(value) =>
              setOrderPricing((prev) => ({ ...prev, enable_vat: value }))
            }
            onResetPricing={() => setOrderPricing(pricing)}
          />
        </div>

        {/* ========================= MOBILE OVERLAY ========================= */}
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
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            total={total}
            vatRate={orderPricing.vat_rate}
            discountRate={orderPricing.discount_rate}
            onClose={() => setShowSurvey(false)}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            onComplete={() => {
              setCart([]);
              setShowSurvey(false);
              setOrderPricing(pricing);
            }}
          />
        )}
      </div>
    </>
  );
}