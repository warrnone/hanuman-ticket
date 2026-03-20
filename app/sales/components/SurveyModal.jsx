"use client";

import { useState, useEffect } from "react";
import { createOrder } from "../lib/createOrder";
import { swalSuccess, swalError } from "../../components/Swal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { SectionLoader, TaxiSelectLoader, SurveyCardLoader } from "../../components/SurveyLoading";

export default function SurveyModal({cart,subtotal,discount,tax,total,vatRate,discountRate,onClose,onComplete, selectedChannel, onSelectChannel,}) {
  const [loading, setLoading] = useState(false);
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
  const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [remark, setRemark] = useState("");

  // โครงสร้าง Survey Modal
  const [selectedTaxi, setSelectedTaxi] = useState(null);
  const [taxiList, setTaxiList] = useState([]);
  const [channels, setChannels] = useState([]);

  // Qrcode 
  const [qrToken, setQrToken] = useState(null);
  // Coundown 
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingTaxis, setLoadingTaxis] = useState(true);
  const [loadingSurvey, setLoadingSurvey] = useState(true);

  const loadChannels = async () => {
    try {
      setLoadingChannels(true);
      const res = await fetch("/api/sale/source-channels");
      const json = await res.json();
      setChannels(json.data || []);
    } catch (err) {
      swalError("Load channels error", err.message);
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadTaxis = async () => {
    try {
      setLoadingTaxis(true);
      const res = await fetch("/api/sale/taxi/active");
      const json = await res.json();
      setTaxiList(json.data || []);
    } catch (error) {
      swalError("Load Taxis error", err.message);
    } finally {
      setLoadingTaxis(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      if (!guestName.trim()) {
        swalError("Please enter guest/group name");
        setLoading(false);
        return;
      }

      if (!selectedChannel) {
        swalError("Please select order source");
        return;
      }

      if (selectedChannel.commissionable && !selectedTaxi) {
        swalError("Please select taxi/van for commissionable channel");
        return;
      }

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const selectedDate = new Date(serviceDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < todayDate) {
        swalError("Service date must be today or in the future");
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
        taxi_id: selectedChannel?.commissionable ? selectedTaxi : null,
        source_channel_id: selectedChannel?.id || null,

        subtotal_amount: subtotal,
        discount_amount: discount,
        vat_amount: tax,
        total_amount: total,
        vat_rate: vatRate,
        discount_rate: discountRate,
        survey_answers: answers,
      });
      
      if (!data) return;
      await swalSuccess(`Order Completed!\nOrder Code: ${data.order_id}`);
      setQrToken(data.qr_token);
      setSecondsLeft(600);  // 10 นาที
    } catch (err) {
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
    try {
      setLoadingSurvey(true);
      const res = await fetch("/api/sale/survey");
      const json = await res.json();
      setSurveyGroups(json.data || []);
    } catch (error) {
      swalError("Load Survey error", err.message);
    } finally {
      setLoadingSurvey(false);
    }
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadSurvey();
    loadChannels();
    loadTaxis();
  }, []);

  useEffect(() => {
    if (!qrToken || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [qrToken, secondsLeft]);

  // Detect หมดเวลา → auto close modals
  useEffect(() => {
    if (secondsLeft !== 0) return;   // ยังไม่หมด หรือยังไม่เริ่ม
    if (!qrToken) return;            // ยังไม่มี QR (state เริ่มต้น = 0)

    onComplete?.();
    onClose();
  }, [secondsLeft , qrToken]);

  /* Detect QR Scan */
  useEffect(() => {
    if (!qrToken) return;

    const channel = supabase
      .channel("qr-scan-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (
            payload.new.qr_token === qrToken &&
            payload.new.qr_scanned === true
          ) {
            onComplete?.();
            onClose();
          }
        }
      )
      .subscribe((status) => {
        // console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrToken]);

  const qrUrl = `${window.location.origin}/payment/${qrToken}`;
  
  const plateEmoji = {
    YELLOW: "🟨",
    GREEN: "🟩",
    BLACK: "⬛",
    APP: "📱",
  };
  
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
                <div className="flex flex-col items-center">
                  {/* QR + Logo */}
                  <div className="relative inline-block">
                    <QRCodeCanvas
                      value={qrUrl}
                      size={260}
                      level="H"
                    />
                    {/* Logo ตรงกลาง */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img
                        src="/hanuman-logo.jpg"
                        alt="logo"
                        className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg"
                      />
                    </div>
                  </div>
                  {/* Link อยู่นอก relative div */}
                  {/* <a href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-blue-600 underline text-sm break-all max-w-xs"
                  >
                    {qrUrl}
                  </a> */}
                  <p className="mt-4 text-red-600 font-semibold">
                    ⏳ Time remaining: {Math.floor(secondsLeft / 60)}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </p>
                </div>
                <p className="mt-4 text-gray-600">
                  Please present this QR code at the Check-in counter to confirm your ticket. Thank you for choosing us!
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Survey Groups */}
              {(surveyGroups.length || loadingSurvey) > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quick Survey
                  </h3>

                  
                  {/* ถ้าเป็น Taxi → แสดง dropdown */}
                  <div className="mb-6">
                    <label className="text-md font-medium"> <span className="text-red-500">*</span>How did you come here? Arrival by</label>
                    {loadingChannels ? (
                      <div className="mt-3">
                        <SurveyCardLoader />
                      </div>
                    ):(
                      <>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {channels.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => {
                                onSelectChannel(ch);
                                setSelectedTaxi(null);
                              }}
                              className={`p-3 rounded-xl border-2 font-semibold transition
                                ${
                                  selectedChannel?.id === ch.id
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white border-gray-300 hover:border-blue-400"
                                }
                              `}
                            >
                              {ch.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {loadingTaxis ? (
                      <>
                        <TaxiSelectLoader />
                      </>
                    ):(
                      <>
                        {selectedChannel?.commissionable && (
                          <div className="mb-4">
                            <label className="text-md font-medium block mb-2">
                              <span className="text-red-500">*</span> Select : Agent/Taxi/Van
                            </label>
          
                            <Select
                              options={taxiList.map((t) => ({
                                value: t.id,
                                label: `${plateEmoji[t.plate_color] ?? "🚕"} ${t.car_number}  ${t.driver_first_name_en}  ${t.driver_last_name_en}`,
                              }))}
                              onChange={(selected) =>
                                setSelectedTaxi(selected?.value || null)
                              }
                              placeholder="Search Taxi/Van..."
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {loadingSurvey ? (
                    <>
                      <SectionLoader  />
                    </>
                  ) : (
                    <>
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
                    </>
                  )}    
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
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!qrToken && (
          <div className="border-t bg-gray-50 px-6 py-4 flex gap-3">
            <button
              onClick={() => {
                onComplete?.();
                onClose();
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
              {loading ? "Processing..." : "Complete Payment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}