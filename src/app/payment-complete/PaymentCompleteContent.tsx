"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { generateTicketPDF } from "@/lib/ticketGenerator";

export default function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);

  const downloadTicket = async (ticket: any) => {
    try {
      const blob = await generateTicketPDF(ticket);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipac-ticket-${ticket.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true; // Successfully downloaded
    } catch (error) {
      console.error("Error generating ticket PDF:", error);
      return false; // Failed to download
    }
  };

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      // Support multiple casing variants returned by PesaPal / redirects
      const possibleKeys = [
        "OrderTrackingId",
        "orderTrackingId",
        "OrderTrackingID",
        "ordertrackingid",
        "ordertrackingId",
      ];

      let orderTrackingId: string | null = null;
      for (const key of possibleKeys) {
        const val = searchParams.get(key);
        if (val) {
          orderTrackingId = val;
          break;
        }
      }

      setOrderId(orderTrackingId);

      if (!orderTrackingId) {
        setPaymentStatus("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        // Poll payment status a few times in case PesaPal is delayed
        const maxAttempts = 6;
        const delayMs = 3000;
        let statusData: any = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await fetch(`/api/tickets/pesapal-status?orderTrackingId=${orderTrackingId}`);
          statusData = await response.json().catch(() => null);

          if (response.ok && statusData && (statusData.payment_status_description || statusData.status)) {
            const desc = (statusData.payment_status_description || statusData.status || "").toString().toLowerCase();
            setPaymentStatus(statusData.payment_status_description || statusData.status || "");

            if (desc.includes("completed") || desc.includes("successful")) {
              break; // confirmed
            }
          }

          // wait before next attempt
          await new Promise((res) => setTimeout(res, delayMs));
        }

        if (!statusData) {
          setPaymentStatus("Unable to verify payment status");
          setLoading(false);
          return;
        }

        const finalDesc = (statusData.payment_status_description || statusData.status || "").toString().toLowerCase();

        if (finalDesc.includes("completed") || finalDesc.includes("successful")) {
          // Try to fetch ticket data without marking it used (use new fetch endpoint)
          let ticketResponse = await fetch(`/api/tickets/fetch/${orderTrackingId}`);

          // Fallback to the existing verify endpoint if fetch isn't available
          if (!ticketResponse.ok) {
            ticketResponse = await fetch(`/api/tickets/verify/${orderTrackingId}`);
          }

          const ticketData = await ticketResponse.json().catch(() => null);

          if (ticketResponse.ok && ticketData) {
            // Prefer ticketData.ticket if present (verify), otherwise ticketData as returned by fetch
            const ticket = ticketData.ticket || ticketData;
            setTicketData(ticket);

            // Attempt immediate download
            const downloadSuccess = await downloadTicket(ticket);
            if (!downloadSuccess) {
              console.warn("Automatic ticket download failed - user can use manual download button");
            }
          } else {
            setPaymentStatus("Ticket retrieval failed");
          }
        } else {
          setPaymentStatus(statusData.payment_status_description || statusData.status || "Payment not completed");
        }
      } catch (error) {
        console.error("Error verifying payment status:", error);
        setPaymentStatus("Error verifying payment status");
      } finally {
        setLoading(false);
      }
    };

    // Execute immediately when component mounts and search params are available
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
                  <p className="text-gray-400 mb-2">
                    Your ticket is downloading automatically. Check your downloads folder.
                  </p>
                  {orderId && (
                    <p className="text-gray-400 mb-8">
                      Order ID: {orderId.substring(0, 8)}...
                    </p>
                  )}
                  {ticketData && (
                    <Button
                      onClick={() => downloadTicket(ticketData)}
                      className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                    >
                      Download Ticket Again
                    </Button>
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