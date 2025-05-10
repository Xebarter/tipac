// src/app/payment-complete/PaymentCompleteContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);
  const [merchantReference, setMerchantReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackingId = searchParams.get("OrderTrackingId");
    const reference = searchParams.get("OrderMerchantReference");
    setOrderTrackingId(trackingId);
    setMerchantReference(reference);

    if (trackingId) {
      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(`/api/pesapal-status?orderTrackingId=${trackingId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to check payment status");
          }

          setPaymentStatus(data.status);
        } catch (err: any) {
          setError(err.message);
        }
      };

      checkPaymentStatus();
    }
  }, [searchParams]);

  return (
    <motion.div
      className="max-w-md mx-auto backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-4xl font-extrabold text-white mb-4 bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
        Thank You for Your Donation!
      </h2>
      {error ? (
        <p className="text-red-400 mb-6">
          Unable to verify payment status: {error}
        </p>
      ) : paymentStatus ? (
        <p className="text-lg text-gray-300 mb-6">
          {paymentStatus === "COMPLETED"
            ? "Your payment was successful! Your support helps empower children in Uganda through the transformative power of theatre. We truly appreciate your generosity."
            : paymentStatus === "PENDING"
            ? "Your payment is still pending. We’ll notify you once it’s processed."
            : "There was an issue with your payment. Please contact support for assistance."}
        </p>
      ) : (
        <p className="text-lg text-gray-300 mb-6">
          Your support helps empower children in Uganda through the transformative power of theatre. We truly appreciate your generosity.
        </p>
      )}
      {orderTrackingId && (
        <p className="text-gray-300 mb-2">
          <strong>Order Tracking ID:</strong> {orderTrackingId}
        </p>
      )}
      {merchantReference && (
        <p className="text-gray-300 mb-6">
          <strong>Merchant Reference:</strong> {merchantReference}
        </p>
      )}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3 }}>
        <Button
          asChild
          className="w-full max-w-xs h-12 text-base bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 rounded-lg group relative overflow-hidden"
        >
          <Link href="/">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            Back to Home
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
