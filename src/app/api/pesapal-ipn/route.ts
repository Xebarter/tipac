// src/app/api/pesapal-ipn/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[PESAPAL IPN]", body);

    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = body;

    // Process the IPN data (e.g., update your database, send email)
    if (OrderNotificationType === "PAYMENT_COMPLETED") {
      console.log(`Payment completed for OrderTrackingId: ${OrderTrackingId}`);
      
      // Update ticket status to confirmed
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'confirmed',
          pesapal_status: 'completed'
        })
        .eq('id', OrderTrackingId);
      
      if (error) {
        console.error("Failed to update ticket status:", error);
        throw new Error("Failed to update ticket status");
      }
      
      console.log(`Successfully updated ticket status for OrderTrackingId: ${OrderTrackingId}`);
    } else if (OrderNotificationType === "PAYMENT_FAILED" || OrderNotificationType === "PAYMENT_CANCELLED") {
      console.log(`Payment ${OrderNotificationType.toLowerCase()} for OrderTrackingId: ${OrderTrackingId}`);
      
      // Update ticket status to failed/cancelled
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'failed',
          pesapal_status: OrderNotificationType.toLowerCase()
        })
        .eq('id', OrderTrackingId);
      
      if (error) {
        console.error("Failed to update ticket status:", error);
        throw new Error("Failed to update ticket status");
      }
      
      console.log(`Successfully updated ticket status for OrderTrackingId: ${OrderTrackingId}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("[PESAPAL IPN ERROR]", error.message);
    return NextResponse.json({ error: "Failed to process IPN" }, { status: 500 });
  }
}