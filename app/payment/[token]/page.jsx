"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Barcode from "react-barcode";
import "./payment.css";

export default function PaymentPage() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isUrgent = secondsLeft <= 60 && secondsLeft > 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    if (!token) return;
    fetch(`/api/payment/order?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setExpired(true);
          return;
        }
        setOrder(data.order);
        setSecondsLeft(data.seconds_left);
        setLoaded(true);
      });
  }, [token]);

  useEffect(() => {
    if (!loaded) return;
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loaded, secondsLeft]);

  /* ── Expired ── */
  if (expired) {
    return (
      <div className="shell">
        <div className="card expired-card">
          <div className="expired-icon">✕</div>
          <h1 className="expired-title">Session Expired</h1>
          <p className="expired-sub">
            This QR code is no longer valid.
            <br />
            Please ask staff to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (!order) {
    return (
      <div className="shell flex flex-col items-center justify-center min-h-[300px] gap-4">
        {/* Ticket Skeleton Shape */}
        <div className="relative w-72 h-40 bg-gray-100 rounded-2xl overflow-hidden animate-pulse border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          {/* เจาะรูตั๋วเก๋ๆ */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
        </div>
        <p className="text-gray-400 font-medium tracking-wide animate-bounce">
          Preparing your experience...
        </p>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="shell">
      {/* Brand strip */}
      <div className="brand-strip">
        <img src="/hanuman-logo.jpg" alt="Hanuman World" className="brand-logo" />
        <span className="brand-name">HANUMAN WORLD</span>
      </div>

      {/* Card */}
      <div className="card">
        {/* Top header */}
        <div className="ticket-top">
          <p className="ticket-label">ADMISSION TICKET</p>
          <p className="ticket-sub">Present at cashier to complete payment</p>
        </div>

        {/* Tear line */}
        <div className="tear-line">
          <div className="tear-circle left" />
          <div className="tear-dashes" />
          <div className="tear-circle right" />
        </div>

        {/* Barcode */}
        <div className="barcode-zone">
          <Barcode
            value={token}
            width={2.2}
            height={90}
            fontSize={13}
            background="transparent"
            lineColor="#0f172a"
          />
        </div>

        {/* Tear line bottom */}
        <div className="tear-line">
          <div className="tear-circle left" />
          <div className="tear-dashes" />
          <div className="tear-circle right" />
        </div>

        {/* Amount */}
        <div className="amount-row">
          <span className="amount-label">TOTAL DUE</span>
          <span className="amount-value">
            ฿{Number(order.total_amount).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Timer */}
        <div className={`timer-wrap${isUrgent ? " urgent" : ""}`}>
          <div className={`timer-ring${isUrgent ? " pulse-ring" : ""}`}>
            <svg viewBox="0 0 44 44" className="ring-svg">
              <circle cx="22" cy="22" r="19" className="ring-bg" />
              <circle
                cx="22"
                cy="22"
                r="19"
                className={`ring-fill${isUrgent ? " ring-fill-urgent" : ""}`}
                style={{
                  strokeDasharray: "119.4",
                  strokeDashoffset: `${119.4 * (secondsLeft / 600)}`,
                }}
              />
            </svg>
            <span className={`timer-digits${isUrgent ? " blink" : ""}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <p className={`timer-label${isUrgent ? " urgent-label" : ""}`}>
            {isUrgent ? "⚠️ Expiring soon!" : "Time remaining"}
          </p>
        </div>

        {/* Footer note */}
        <p className="footer-note">
          📍 Go to the cashier counter and scan this barcode to complete your purchase.
        </p>
      </div>

      <p className="bottom-note">Powered by Hanuman World Ticketing System</p>
    </div>
  );
}