"use client";

import { useEffect, useState } from "react";

export default function PricingPage() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [pricing, setPricing] = useState([]);

  /* =========================
     LOAD CHANNELS
  ========================= */
  const loadChannels = async () => {
    const res = await fetch("/api/admin/rate-plans");
    const json = await res.json();
    setChannels(json.data || []);
  };

  /* =========================
     LOAD PRICING
  ========================= */
  const loadPricing = async (channelId) => {
    const res = await fetch(
      `/api/admin/channel-pricing?channel_id=${channelId}`
    );
    const json = await res.json();
    setPricing(json.data || []);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  return (
    <div className="p-6">
      {/* TITLE */}
      <h1 className="text-2xl font-bold mb-6">
        💰 Channel Pricing
      </h1>

      <div className="grid grid-cols-3 gap-6">

        {/* ================= LEFT PANEL ================= */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Channels</h2>

          {channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => {
                setSelectedChannel(ch);
                loadPricing(ch.id);
              }}
              className={`p-3 rounded cursor-pointer mb-2 transition ${
                selectedChannel?.id === ch.id
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {ch.name}
            </div>
          ))}
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          {!selectedChannel ? (
            <div className="text-gray-400 text-center py-10">
              Select Channel
            </div>
          ) : (
            <div>
              <h2 className="font-semibold mb-4">
                Pricing: {selectedChannel.name}
              </h2>

              {pricing.length === 0 ? (
                <div className="text-gray-400">
                  No pricing data
                </div>
              ) : (
                <div className="space-y-3">
                  {pricing.map((p) => (
                    <div
                      key={p.id}
                      className="border p-4 rounded-lg"
                    >
                      {/* PACKAGE NAME */}
                      <div className="font-semibold text-lg">
                        {p.packages?.name}
                      </div>

                      {/* BASE PRICE */}
                      <div className="text-sm text-gray-500">
                        Base Price: {p.packages?.price}
                      </div>

                      {/* OVERRIDE */}
                      <div className="text-blue-600 font-medium">
                        Override:{" "}
                        {p.price_override ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}