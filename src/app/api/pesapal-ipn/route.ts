// src/app/api/pesapal-ipn/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[PESAPAL IPN]", body);

    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = body;

    // Process the IPN data (e.g., update your database, send email)
    // Example: If payment is completed, log it
    if (OrderNotificationType === "PAYMENT_COMPLETED") {
      console.log(`Payment completed for OrderTrackingId: ${OrderTrackingId}`);
      // Add logic to update your database or send a confirmation email
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("[PESAPAL IPN ERROR]", error.message);
    return NextResponse.json({ error: "Failed to process IPN" }, { status: 500 });
  }
}