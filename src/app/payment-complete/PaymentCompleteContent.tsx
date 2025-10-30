"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      const orderTrackingId = searchParams.get("OrderTrackingId");
      setOrderId(orderTrackingId);
      
      if (orderTrackingId) {
        try {
          const response = await fetch(`/api/tickets/pesapal-status?orderTrackingId=${orderTrackingId}`);
          const data = await response.json();
          
          if (response.ok) {
            setPaymentStatus(data.payment_status_description || "completed");
          } else {
            setPaymentStatus("Unable to verify payment status");
          }
        } catch (error) {
          console.error("Error fetching payment status:", error);
          setPaymentStatus("Error verifying payment status");
        }
      }
      
      setLoading(false);
    };

    fetchPaymentStatus();
  }, [searchParams]);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300">Verifying payment status...</p>
            </div>
          ) : (
            <>
              {paymentStatus?.toLowerCase().includes("completed") || paymentStatus?.toLowerCase().includes("successful") ? (
                <>
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
                  <p className="text-lg text-gray-300 mb-2">
                    Thank you for your purchase. Your ticket has been confirmed.
                  </p>
                  {orderId && (
                    <p className="text-gray-400 mb-8">
                      Order ID: {orderId.substring(0, 8)}...
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-4">Payment Issue</h1>
                  <p className="text-lg text-gray-300 mb-2">
                    There was an issue with your payment.
                  </p>
                  {paymentStatus && (
                    <p className="text-gray-400 mb-8">
                      Status: {paymentStatus}
                    </p>
                  )}
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/tickets">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                    Buy More Tickets
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                    Return Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}