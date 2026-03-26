"use client";

import { useState, useEffect, useMemo , useRef } from "react";
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
  const mediaSubmittingRef = useRef(false);

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

  // media modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaMode, setMediaMode] = useState(null); // photo | video | photo_video
  const [mediaRules, setMediaRules] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaForm, setMediaForm] = useState({
    pax: 1,
    video_type: "",
    duration_value: "",
    duration_unit: "sec",
  });

  // mediaSubmitting
  const [mediaSubmitting, setMediaSubmitting] = useState(false);

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

  /* ========================= HELPERS ========================= */
  const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

  const normalizeMediaValue = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  };

  const getRuleMediaKind = (rule) => {
    const saleMode = normalizeMediaValue(rule?.sale_mode);
    const mediaPackage = normalizeMediaValue(rule?.media_package);
    const mediaType = normalizeMediaValue(rule?.media_type);

    // photo_video set ให้ถือเป็น photo_video ก่อน
    if (saleMode === "set" && mediaPackage === "photo_video") {
      return "photo_video";
    }

    if (mediaType) return mediaType;
    if (mediaPackage) return mediaPackage;

    return "";
  };

  const requiresVideoConfig = (mode, rule = null) => {
    if (mode === "video") return true;

    if (mode === "photo_video") {
      if (!rule) return false;

      return Boolean(
        rule.video_type ||
          (rule.duration_value !== null &&
            rule.duration_value !== undefined) ||
          rule.duration_unit
      );
    }

    return false;
  };

  const getMediaCartType = (kind) => {
    if (kind === "video") return "VIDEO";
    if (kind === "photo_video") return "PHOTO_VIDEO";
    return "PHOTO";
  };

  const buildMediaLabel = (rule, mode, pax) => {
    const kind = getRuleMediaKind(rule) || mode;

    if (kind === "photo") {
      return `Photo (${pax} pax)`;
    }

    if (kind === "photo_video") {
      const hasVideoDetail =
        Boolean(rule?.video_type) ||
        (rule?.duration_value !== null &&
          rule?.duration_value !== undefined) ||
        Boolean(rule?.duration_unit);

      if (hasVideoDetail) {
        return `Photo + Video ${rule.video_type || ""} ${
          rule.duration_value ?? ""
        } ${rule.duration_unit || ""} (${pax} pax)`
          .replace(/\s+/g, " ")
          .trim();
      }

      return `Photo + Video (${pax} pax)`;
    }

    return `Video ${rule?.video_type || ""} ${rule?.duration_value ?? ""} ${
      rule?.duration_unit || ""
    } (${pax} pax)`
      .replace(/\s+/g, " ")
      .trim();
  };

  /* ========================= 
        LOAD DATA 
  ========================= */
  const loadPricing = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;

      const data = await res.json();

      const nextPricing = {
        vat_rate: Number(data.vat_rate ?? 7),
        enable_vat: Boolean(data.enable_vat),
        discount_rate: Number(data.discount_rate ?? 0),
        enable_discount: Boolean(data.enable_discount),
      };

      setPricing(nextPricing);
      setOrderPricing(nextPricing);
    } catch (err) {
      console.error("load pricing failed", err);
    }
  };

  /*

  */
  const handleApiResponse = (res) => {
    if (res.status === 401 || res.status === 403) {
      router.replace("/login");
      return false;
    }
    return true;
  };

  /*

  */
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
        setSelectedActivity((prev) => prev || filteredMenu[0].name);
      }
    } catch (err) {
      console.error("Load sale menu error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelPricing = async () => {
    try {
      if (!selectedChannel?.id) {
        setPricingRules([]);
        return;
      }

      const res = await fetch(
        `/api/sale/pricing?source_channel_id=${selectedChannel.id}`
      );

      if (!res.ok) {
        setPricingRules([]);
        return;
      }

      const json = await res.json();
      setPricingRules(json.data || []);
    } catch (err) {
      console.error("load channel pricing error:", err);
      setPricingRules([]);
    }
  };

  const loadMediaRules = async (activityCategoryId) => {
    if (!activityCategoryId) {
      setMediaRules([]);
      return;
    }

    try {
      setMediaLoading(true);

      const res = await fetch(
        `/api/sale/photo-video-rules?activity_category_id=${activityCategoryId}`
      );

      if (!res.ok) {
        setMediaRules([]);
        return;
      }

      const json = await res.json();
      const allRules = json.data || [];

      const filtered = allRules.filter(
        (rule) =>
          rule.activity_category_id === activityCategoryId &&
          String(rule.status || "").toLowerCase() === "active"
      );

      setMediaRules(filtered);
    } catch (err) {
      console.error("load media rules error:", err);
      setMediaRules([]);
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    loadPricing();
  }, []);

  useEffect(() => {
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

  // media add-ons
  const hasPhotoVideo = (currentActivity?.items || []).some((item) =>
    ["PHOTO", "VIDEO", "PHOTO_VIDEO"].includes(item.type)
  );

  useEffect(() => {
    if (!currentActivity?.id) {
      setMediaRules([]);
      return;
    }
    loadMediaRules(currentActivity.id);
  }, [currentActivity?.id]);

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

      return sum + price * Number(item.quantity || 0);
    }, 0)
  );

  const discount = orderPricing.enable_discount
    ? round2((subtotal * Number(orderPricing.discount_rate || 0)) / 100)
    : 0;

  const tax = orderPricing.enable_vat
    ? round2(
        ((subtotal - discount) * Number(orderPricing.vat_rate || 0)) / 100
      )
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

  /* ========================= MEDIA LOGIC ========================= */
  const handleMediaClick = (mode) => {
    const normalizedMode = normalizeMediaValue(mode);

    setMediaMode(normalizedMode);
    setMediaForm({
      pax: 1,
      video_type: "",
      duration_value: "",
      duration_unit: "sec",
    });
    setShowMediaModal(true);
  };

  const mediaOptionsForCurrentMode = useMemo(() => {
    if (!mediaMode) return [];

    return mediaRules.filter((rule) => {
      const kind = getRuleMediaKind(rule);
      if (kind !== mediaMode) return false;
      if (String(rule.status || "").toLowerCase() !== "active") return false;
      return true;
    });
  }, [mediaRules, mediaMode]);

  const availableVideoTypes = useMemo(() => {
    const set = new Set();

    mediaOptionsForCurrentMode.forEach((rule) => {
      if (rule.video_type) {
        set.add(rule.video_type);
      }
    });

    return Array.from(set);
  }, [mediaOptionsForCurrentMode]);

  const availableDurations = useMemo(() => {
    const targetType = normalizeMediaValue(mediaForm.video_type);

    const rows = mediaOptionsForCurrentMode.filter((rule) => {
      const ruleType = normalizeMediaValue(rule.video_type);
      if (!targetType) return Boolean(rule.video_type);
      return ruleType === targetType;
    });

    const map = new Map();

    rows.forEach((rule) => {
      const key = `${rule.duration_value ?? ""}-${rule.duration_unit ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          duration_value: rule.duration_value ?? "",
          duration_unit: rule.duration_unit ?? "",
        });
      }
    });

    return Array.from(map.values());
  }, [mediaOptionsForCurrentMode, mediaForm.video_type]);

  const matchedMediaRule = useMemo(() => {
    if (!mediaMode) return null;

    const pax = Number(mediaForm.pax || 0);
    if (pax <= 0) return null;

    const videoType = normalizeMediaValue(mediaForm.video_type);
    const durationValue = Number(mediaForm.duration_value || 0);
    const durationUnit = normalizeMediaValue(mediaForm.duration_unit);

    return (
      mediaRules.find((rule) => {
        const kind = getRuleMediaKind(rule);

        if (kind !== mediaMode) return false;
        if (String(rule.status || "").toLowerCase() !== "active") return false;

        const min = Number(rule.pax_min || 0);
        const max = Number(rule.pax_max || 0);

        if (pax < min || pax > max) return false;

        const needVideoConfig = requiresVideoConfig(mediaMode, rule);
        if (!needVideoConfig) return true;

        const ruleVideoType = normalizeMediaValue(rule.video_type);
        const ruleDurationUnit = normalizeMediaValue(rule.duration_unit);
        const ruleDurationValue = Number(rule.duration_value || 0);

        if (!videoType || !durationValue || !durationUnit) return false;

        return (
          ruleVideoType === videoType &&
          ruleDurationValue === durationValue &&
          ruleDurationUnit === durationUnit
        );
      }) || null
    );
  }, [mediaRules, mediaMode, mediaForm]);

  const calcMediaTotal = (rule, paxValue) => {
    if (!rule) return 0;

    const pax = Number(paxValue || 0);
    if (pax <= 0) return 0;

    const saleMode = normalizeMediaValue(rule?.sale_mode);

    if (saleMode === "first_next") {
      return round2(
        Number(rule.base_price || 0) +
          Math.max(0, pax - 1) * Number(rule.extra_pax_price || 0)
      );
    }

    return round2(Number(rule.price || 0));
  };

  const addMatchedMediaToCart = async () => {
    if (mediaSubmittingRef.current) return; // ← กันกดซ้ำ
    const pax = Number(mediaForm.pax || 0);

    if (pax <= 0) {
      swalError("Please enter the number of PAX.");
      return;
    }

    if (!matchedMediaRule) {
      swalError("No price rule found for the selected package and conditions.");
      return;
    }

    const kind = getRuleMediaKind(matchedMediaRule) || mediaMode;
    const needVideoConfig = requiresVideoConfig(kind, matchedMediaRule);

    if (needVideoConfig) {
      if (!mediaForm.video_type) {
        swalError("Please select a Video Type.");
        return;
      }

      if (!Number(mediaForm.duration_value || 0)) {
        swalError("Please enter the Duration.");
        return;
      }

      if (!mediaForm.duration_unit) {
        swalError("Please select a Duration Unit.");
        return;
      }
    }

    try {
      mediaSubmittingRef.current = true; // ← lock ref (กันกดซ้ำ)
      setMediaSubmitting(true);

      const totalPrice = calcMediaTotal(matchedMediaRule, pax);
      const mediaLabel = buildMediaLabel(matchedMediaRule, mediaMode, pax);
      const cartType = getMediaCartType(kind);

      const cartId = [
        "media",
        matchedMediaRule.id,
        kind,
        pax,
        matchedMediaRule.video_type || "na",
        matchedMediaRule.duration_value || "na",
        matchedMediaRule.duration_unit || "na",
        matchedMediaRule.sale_mode || "na",
      ].join("-");

      const mediaItem = {
        id: cartId,
        item_id: matchedMediaRule.id,
        rule_id: matchedMediaRule.id,
        activity_category_id: matchedMediaRule.activity_category_id,
        type: cartType,
        item_type: cartType,
        media_type: kind,
        media_package: normalizeMediaValue(matchedMediaRule.media_package),
        sale_mode: normalizeMediaValue(matchedMediaRule.sale_mode),
        name: mediaLabel,
        price: totalPrice,
        quantity: 1,
        pax,
        video_type: matchedMediaRule.video_type ?? null,
        duration_value: matchedMediaRule.duration_value ?? null,
        duration_unit: matchedMediaRule.duration_unit ?? null,
        base_price: matchedMediaRule.base_price ?? null,
        extra_pax_price: matchedMediaRule.extra_pax_price ?? null,
        code: null,
        image_url: matchedMediaRule.image_url ?? null,
      };

      setCart((prev) => {
        const found = prev.find((item) => item.id === cartId);

        if (found) {
          return prev.map((item) =>
            item.id === cartId
              ? { ...item, quantity: Number(item.quantity || 0) + 1 }
              : item
          );
        }

        return [...prev, mediaItem];
      });

      setShowMediaModal(false);

      if (window.innerWidth < 1024) {
        setShowCart(true);
      }
    } finally {
      mediaSubmittingRef.current = false; // ← unlock เสมอ
      setMediaSubmitting(false);
    }
  };

  const shouldShowVideoFields = useMemo(() => {
    if (mediaMode === "video") return true;

    if (mediaMode === "photo_video") {
      return mediaOptionsForCurrentMode.some((rule) =>
        requiresVideoConfig("photo_video", rule)
      );
    }

    return false;
  }, [mediaMode, mediaOptionsForCurrentMode]);

  return (
    <>
      {loading && <LoadingOverlay />}

      <div className="flex h-screen bg-gray-100 overflow-hidden">
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

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopBar
            cart={cart}
            onCartClick={() => setShowCart(!showCart)}
            onLogout={logout}
          />

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

          <div className="flex-1 overflow-y-auto">
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

        {showCart && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setShowCart(false)}
          />
        )}

        {showMediaModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Select{" "}
                {mediaMode === "photo_video"
                  ? "Photo + Video"
                  : mediaMode === "photo"
                  ? "Photo"
                  : "Video"}
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Configure media options and auto match pricing rule
              </p>

              {mediaLoading ? (
                <div className="py-10 text-center text-slate-500">
                  Loading media rules...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      PAX
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mediaForm.pax}
                      onChange={(e) =>
                        setMediaForm((prev) => ({
                          ...prev,
                          pax: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-4 py-3"
                    />
                  </div>

                  {shouldShowVideoFields && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Video Type
                        </label>
                        <select
                          value={mediaForm.video_type}
                          onChange={(e) =>
                            setMediaForm((prev) => ({
                              ...prev,
                              video_type: e.target.value,
                              duration_value: "",
                              duration_unit: "sec",
                            }))
                          }
                          className="w-full border border-slate-300 rounded-xl px-4 py-3"
                        >
                          <option value="">Select video type</option>
                          {availableVideoTypes.length > 0 ? (
                            availableVideoTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="edit">edit</option>
                              <option value="reel">reel</option>
                              <option value="gopro">gopro</option>
                              <option value="phone_mount">phone_mount</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {availableDurations.length > 0 ? (
                          <select
                            value={
                              mediaForm.duration_value && mediaForm.duration_unit
                                ? `${mediaForm.duration_value}-${mediaForm.duration_unit}`
                                : ""
                            }
                            onChange={(e) => {
                              const [value, unit] = e.target.value.split("-");
                              setMediaForm((prev) => ({
                                ...prev,
                                duration_value: value,
                                duration_unit: unit || "sec",
                              }));
                            }}
                            className="col-span-2 w-full border border-slate-300 rounded-xl px-4 py-3"
                          >
                            <option value="">Select duration</option>
                            {availableDurations.map((item) => (
                              <option
                                key={`${item.duration_value}-${item.duration_unit}`}
                                value={`${item.duration_value}-${item.duration_unit}`}
                              >
                                {item.duration_value} {item.duration_unit}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <input
                              type="number"
                              placeholder="Duration"
                              value={mediaForm.duration_value}
                              onChange={(e) =>
                                setMediaForm((prev) => ({
                                  ...prev,
                                  duration_value: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded-xl px-4 py-3"
                            />
                            <select
                              value={mediaForm.duration_unit}
                              onChange={(e) =>
                                setMediaForm((prev) => ({
                                  ...prev,
                                  duration_unit: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded-xl px-4 py-3"
                            >
                              <option value="sec">sec</option>
                              <option value="min">min</option>
                              <option value="round">round</option>
                              <option value="video">video</option>
                            </select>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  <div className="bg-slate-50 border rounded-xl p-4 text-sm text-slate-600">
                    {!matchedMediaRule ? (
                      "No matching price rule found for this configuration"
                    ) : (
                      <div className="space-y-2">
                        <div>
                          Package:{" "}
                          <span className="font-semibold">
                            {normalizeMediaValue(
                              matchedMediaRule.media_package
                            ) || "-"}
                          </span>
                        </div>

                        <div>
                          Type:{" "}
                          <span className="font-semibold">
                            {getRuleMediaKind(matchedMediaRule)}
                          </span>
                        </div>

                        <div>
                          Sale mode:{" "}
                          <span className="font-semibold">
                            {normalizeMediaValue(matchedMediaRule.sale_mode)}
                          </span>
                        </div>

                        {normalizeMediaValue(matchedMediaRule.sale_mode) ===
                        "first_next" ? (
                          <div className="space-y-1">
                            <div>
                              First:{" "}
                              <span className="font-semibold">
                                {Number(
                                  matchedMediaRule.base_price || 0
                                ).toLocaleString()}
                                ฿
                              </span>
                            </div>
                            <div>
                              Next:{" "}
                              <span className="font-semibold">
                                {Number(
                                  matchedMediaRule.extra_pax_price || 0
                                ).toLocaleString()}
                                ฿
                              </span>{" "}
                              × {Math.max(0, Number(mediaForm.pax || 0) - 1)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            Price:{" "}
                            <span className="font-semibold">
                              {Number(
                                matchedMediaRule.price || 0
                              ).toLocaleString()}
                              ฿
                            </span>
                          </div>
                        )}

                        <div className="font-bold text-orange-600">
                          Total{" "}
                          {calcMediaTotal(
                            matchedMediaRule,
                            mediaForm.pax
                          ).toLocaleString()}
                          ฿
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={addMatchedMediaToCart}
                  disabled={mediaLoading || mediaSubmitting || !matchedMediaRule}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {mediaSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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