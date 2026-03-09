"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function PaymentPage() {
  const { token } = useParams();

  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);

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
      });
  }, [token]);

  // Countdown
  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">
          QR Code Expired
        </h1>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-bold mb-4">
        Please Proceed to Cashier
      </h1>

      <QRCodeCanvas
        value={`${process.env.NEXT_PUBLIC_BASE_URL}/api/ifeel/order?token=${token}`}
        size={240}
      />

      <p className="mt-4 text-lg">
        Total: ฿ {Number(order.total_amount).toLocaleString()}
      </p>

      <p className="mt-2 text-red-500">
        Time remaining: {secondsLeft} seconds  
      </p>
      <p className="mt-2 text-blue-600 font-semibold">
        Please make your way to the cash counter
      </p>
    </div>
  );
}