"use client";

import { useState , useEffect } from "react";
import { createOrder } from "../lib/createOrder";
import {swalSuccess , swalError} from "../../components/Swal";

export default function SurveyModal({ 
  cart,
  // 💰 money breakdown
  subtotal,
  discount,
  tax,
  total,
  vatRate,
  discountRate,
  // control
  onClose,
  onComplete,
 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const today = new Date().toISOString().split("T")[0];
  const [surveyGroups, setSurveyGroups] = useState([]);
  const [answers, setAnswers] = useState({});


  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");

      if(!serviceDate){
        setError("Please Select service date");
        return;
      }

      if (serviceDate < today) {
        setError("Service date must be today or in the future");
        return;
      }

      const data = await createOrder(cart,{
        guest_name: guestName || "Walk-in",
        service_date: serviceDate,
        adult_count: adult,
        child_count: child,
        // ✅ money breakdown (สำคัญมาก)
        subtotal_amount: subtotal,
        discount_amount: discount,
        vat_amount: tax,
        total_amount: total,
        vat_rate: vatRate,
        discount_rate: discountRate,
        survey_answers: answers,
      });
      if (!data) return;

      // แสดง success message
      await swalSuccess(`Order Completed!\nOrder Code: ${data.order_code}`);
      
      // ปิด modal
      onClose();
      
      // เรียก callback ถ้ามี
      onComplete?.();

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
  });
  
  const loadSurvey = async () => {
    const res = await fetch("/api/sale/survey");
    const json = await res.json();
    setSurveyGroups(json.data || []);
  };

  useEffect(() => {
    loadSurvey();
  }, []);


  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Scrollable Content */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-center">
              Customer Information
            </h2>

            {surveyGroups.map((group) => (
              <div key={group.id} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 tracking-wide">
                    {group.title}
                  </h3>
                  <span className="text-xs text-gray-400">
                    Select one or more
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {group.options.map((opt) => {
                    const selectedValues = answers[group.id] || [];
                    const isSelected = selectedValues.includes(opt.label);

                    const toggleOption = () => {
                      let updated;

                      if (isSelected) {
                        updated = selectedValues.filter(
                          (v) => v !== opt.label
                        );
                      } else {
                        updated = [...selectedValues, opt.label];
                      }

                      setAnswers({
                        ...answers,
                        [group.id]: updated,
                      });
                    };

                    return (
                      <div
                        key={opt.id}
                        onClick={toggleOption}
                        className={`
                          relative cursor-pointer rounded-2xl border 
                          px-4 py-4 text-sm font-medium
                          transition-all duration-200 ease-in-out
                          select-none
                          ${
                            isSelected
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]"
                              : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>

                          <div
                            className={`
                              w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                              ${
                                isSelected
                                  ? "bg-white text-blue-600"
                                  : "border border-gray-300"
                              }
                            `}
                          >
                            {isSelected && "✓"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium"><span className="text-red-600">*</span> Guest / Group name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Service date (DD/MM/YYYY)</label>
                <input
                  type="date"
                  value={serviceDate}
                  min={today}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  lang="en-GB"
                />
                {serviceDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected:{" "}
                    {new Date(serviceDate).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">Adult</label>
                  <input
                    type="number"
                    min="0"
                    value={adult}
                    onChange={(e) => setAdult(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium">Child</label>
                  <input
                    type="number"
                    min="0"
                    value={child}
                    onChange={(e) => setChild(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {cart.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name} × {i.quantity}</span>
                  <span>
                    {(i.price * i.quantity).toLocaleString()}฿
                  </span>
                </div>
              ))}

              <div className="border-t pt-2 font-bold flex justify-between">
                <span>Total</span>
                <span className="text-blue-600">
                  {money(total)}฿
                </span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 mb-3">
                {error}
              </div>
            )}
            
            <div className="flex gap-3 sticky bottom-0 bg-white pt-4 -mx-6 px-6 pb-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-200 py-2 rounded disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold disabled:opacity-50"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}