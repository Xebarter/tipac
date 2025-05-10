// src/app/payment-complete/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function PaymentComplete() {
  const searchParams = useSearchParams();
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);
  const [merchantReference, setMerchantReference] = useState<string | null>(null);

  useEffect(() => {
    const trackingId = searchParams.get("OrderTrackingId");
    const reference = searchParams.get("OrderMerchantReference");
    setOrderTrackingId(trackingId);
    setMerchantReference(reference);
    console.log("[PAYMENT COMPLETE] Query Params:", { trackingId, reference });
  }, [searchParams]);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-md mx-auto backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-extrabold text-white mb-4 bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Thank You for Your Donation!
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Your support helps empower children in Uganda through the transformative power of theatre. We truly appreciate your generosity.
          </p>
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
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
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
      </div>
    </section>
  );
}