"use client";

import { useState, useEffect } from "react";
import { createOrder } from "../lib/createOrder";
import { swalSuccess, swalError } from "../../components/Swal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enGB } from "date-fns/locale";
import Select from "react-select";
import { QRCodeCanvas } from "qrcode.react";

export default function SurveyModal({cart,subtotal,discount,tax,total,vatRate,discountRate,onClose,onComplete,}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [serviceDate, setServiceDate] = useState( () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const [surveyGroups, setSurveyGroups] = useState([]);
  const [answers, setAnswers] = useState({});
  const TIME_SLOTS = ["09:00", "11:00", "14:00", "16:00"];
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [remark, setRemark] = useState("");

  // โครงสร้าง Survey Modal
  const [sourceType, setSourceType] = useState("WALK_IN");
  const [selectedTaxi, setSelectedTaxi] = useState(null);
  const [taxiList, setTaxiList] = useState([]);

  // Qrcode 
  const [qrToken, setQrToken] = useState(null);

  const loadTaxis = async () => {
    const res = await fetch("/api/sale/taxi/active");
    const json = await res.json();
    setTaxiList(json.data || []);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");

      if (!guestName.trim()) {
        setError("Please enter guest/group name");
        setLoading(false);
        return;
      }

      // if (!serviceDate) {
      //   setError("Please select service date");
      //   setLoading(false);
      //   return;
      // }

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const selectedDate = new Date(serviceDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < todayDate) {
        setError("Service date must be today or in the future");
        setLoading(false);
        return;
      }

      const data = await createOrder(cart, {
        guest_name: guestName || "Walk-in",
        service_date: serviceDate ? formatDateLocal(serviceDate): null,
        adult_count: adult,
        child_count: child,

        start_time: startTime || null,
        remark: remark || null,
        taxi_id: sourceType === "TAXI" ? selectedTaxi : null,
        source_channel: sourceType,

        subtotal_amount: subtotal,
        discount_amount: discount,
        vat_amount: tax,
        total_amount: total,
        vat_rate: vatRate,
        discount_rate: discountRate,
        survey_answers: answers,
      });
      
      if (!data) return;
      
      await swalSuccess(`Order Completed!\nOrder Code: ${data.order_code}`);
      setQrToken(data.qr_token);
      
    } catch (err) {
      setError(err.message);
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) =>
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  const loadSurvey = async () => {
    const res = await fetch("/api/sale/survey");
    const json = await res.json();
    setSurveyGroups(json.data || []);
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadSurvey();
    loadTaxis();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Customer Information</h2>
            <p className="text-blue-100 text-sm mt-1">Please fill in the details below</p>
          </div>
          <button
            onClick={() => {
              onComplete?.();   // ✅ เคลียร์ cart
              onClose();        // ✅ ปิด modal
            }}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">

          {qrToken ? (
            <>
              <div className="flex flex-col items-center justify-center text-center py-10">
                <h2 className="text-xl font-bold mb-4">
                  🎟 Booking Confirmed
                </h2>
                {/* ชี้ไปที่ระบบของเค้า “ระบบของเค้า” (Partner System)   */}
                <div className="relative inline-block">
                  <QRCodeCanvas
                    value={`${process.env.NEXT_PUBLIC_BASE_URL}/checkin/${qrToken}`}
                    size={260}
                    level="H"
                  />
                  {/* Logo กลมครอบทับอย่างเดียว */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src="/hanuman-logo.jpg"
                      alt="logo"
                      className="w-40 h-40 rounded-full object-cover border-3 border-white shadow-lg"
                    />
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  Please present this QR code at the Check-in counter to confirm your ticket. Thank you for choosing us!
                </p>
                <button
                  onClick={() => {
                    onComplete?.();   // ✅ เคลียร์ cart
                    onClose();        // ✅ ปิด modal
                  }}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ถ้าเป็น Taxi → แสดง dropdown */}
              <div className="mb-6">
                <label className="text-sm font-medium">Order Type</label>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setSourceType("WALK_IN")}
                    className={`flex-1 py-2 rounded ${
                      sourceType === "WALK_IN"
                        ? "bg-yellow-400"
                        : "bg-gray-200"
                    }`}
                  >
                    🚶 Walk-in
                  </button>

                  <button
                    onClick={() => setSourceType("TAXI")}
                    className={`flex-1 py-2 rounded ${
                      sourceType === "TAXI"
                        ? "bg-yellow-400"
                        : "bg-gray-200"
                    }`}
                  >
                    🚕 Taxi / Van
                  </button>
                </div>
              </div>
              {sourceType === "TAXI" && (
                <div className="mb-4">
                  <label className="text-sm font-medium block mb-2">
                    Select Taxi Name
                  </label>

                  <Select
                    options={taxiList.map((t) => ({
                      value: t.id,
                      label:`
                        ${t.driver_first_name_en || ""}
                        ${t.driver_last_name_en || ""}
                        ${t.car_number || ""}
                        ${t.plate_color || ""}
                        ${t.vehicle_type || ""}
                      `,
                      carNumber: t.car_number,
                      plateColor: t.plate_color,
                      vehicleType: t.vehicle_type,
                      first_name:t.driver_first_name_en,
                      last_name:t.driver_last_name_en,
                      phone:t.driver_phone,
                    }))}

                    value={
                      taxiList
                        .map((t) => ({
                          value: t.id,
                          carNumber: t.car_number,
                          plateColor: t.plate_color,
                          vehicleType: t.vehicle_type,
                        }))
                        .find((opt) => opt.value === selectedTaxi) || null
                    }

                    onChange={(selected) =>
                      setSelectedTaxi(selected?.value || null)
                    }

                    placeholder="Search taxi name..."
                    isSearchable

                    formatOptionLabel={(option) => (
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div className="font-semibold text-base">
                            {option.vehicleType === "VAN" ? "🚐" : "🚕"} {option.carNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.vehicleType === "VAN" ? "Van" : "Taxi"} 📲 {option.phone}  
                          </div>
                        </div>
                        <div className="font-semibold">
                          {option.first_name} {option.last_name}
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            option.plateColor === "YELLOW"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {option.plateColor === "YELLOW"
                            ? "Yellow Plate"
                            : "Green Plate"}
                        </span>
                      </div>
                    )}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Survey Groups */}
              {surveyGroups.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quick Survey
                  </h3>

                  {surveyGroups.map((group) => (
                    <div key={group.id} className="mb-6 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          {group.title}
                        </h4>
                        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
                          Select one or more
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {group.options.map((opt) => {
                          const selectedValues = answers[group.id] || [];
                          const isSelected = selectedValues.includes(opt.label);

                          const toggleOption = () => {
                            let updated;
                            if (isSelected) {
                              updated = selectedValues.filter((v) => v !== opt.label);
                            } else {
                              updated = [...selectedValues, opt.label];
                            }
                            setAnswers({ ...answers, [group.id]: updated });
                          };

                          return (
                            <button
                              key={opt.id}
                              onClick={toggleOption}
                              type="button"
                              className={`
                                relative rounded-lg border-2 px-3 py-2.5 text-sm font-medium
                                transition-all duration-200 ease-in-out text-left
                                ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-sm"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1">{opt.label}</span>
                                <div
                                  className={`
                                    w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                                    ${
                                      isSelected
                                        ? "bg-white text-blue-600"
                                        : "border-2 border-gray-300"
                                    }
                                  `}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Form */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b pb-2">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Booking Details
                </h3>

                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Guest / Group Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest or group name"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>

                {/* Service Date & Start Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Service Date
                    </label>
                    <DatePicker
                      selected={serviceDate}
                      disabled
                      dateFormat="dd/MM/yyyy"
                      className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                    />
                    {serviceDate && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {serviceDate.toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setStartTime(slot)}
                          className={`py-2 rounded-lg border-2 font-semibold transition-all
                            ${
                              startTime === slot
                                ? "bg-blue-600 text-white border-blue-600 shadow"
                                : "bg-white border-gray-300 hover:border-blue-400"
                            }
                          `}
                        >
                          🕒 {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Adult & Child Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adults
                    </label>
                    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAdult(Math.max(0, adult - 1))}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={adult}
                        onChange={(e) => setAdult(Math.max(0, Number(e.target.value)))}
                        className="flex-1 text-center py-2.5 text-sm font-semibold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setAdult(adult + 1)}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Children
                    </label>
                    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setChild(Math.max(0, child - 1))}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={child}
                        onChange={(e) => setChild(Math.max(0, Number(e.target.value)))}
                        className="flex-1 text-center py-2.5 text-sm font-semibold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setChild(child + 1)}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remark (Optional)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    placeholder="Special requests, dietary requirements, birthday celebrations..."
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Order Summary
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-gray-600">
                        <span className="flex-1">{item.name} × {item.quantity}</span>
                        <span className="font-medium">{(item.price * item.quantity).toLocaleString()}฿</span>
                      </div>
                    ))}

                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 pt-2 border-t border-gray-200">
                        <span>Discount</span>
                        <span>-{money(discount)}฿</span>
                      </div>
                    )}

                    {tax > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>VAT ({vatRate}%)</span>
                        <span>{money(tax)}฿</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                      <span>Total</span>
                      <span className="text-blue-600">{money(total)}฿</span>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={() => {
              onComplete?.();   // ✅ เคลียร์ cart
              onClose();        // ✅ ปิด modal
            }}
            disabled={loading}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}