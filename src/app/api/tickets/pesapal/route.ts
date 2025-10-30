// src/app/api/tickets/pesapal/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
const callbackUrl = process.env.PESAPAL_CALLBACK_URL;
const baseUrl = process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3";
const notificationId = process.env.PESAPAL_IPN_ID; // Use the provided IPN ID

console.log("[ENV] PESAPAL_CONSUMER_KEY:", consumerKey);
console.log("[ENV] PESAPAL_CONSUMER_SECRET:", consumerSecret);
console.log("[ENV] PESAPAL_CALLBACK_URL:", callbackUrl);
console.log("[ENV] PESAPAL_BASE_URL:", baseUrl);
console.log("[ENV] PESAPAL_IPN_ID:", notificationId);

async function getAccessToken() {
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET environment variables");
  }

  try {
    const tokenUrl = `${baseUrl}/api/Auth/RequestToken`;
    console.log("[AUTH REQUEST] Sending token request to:", tokenUrl);
    console.log("[AUTH REQUEST] Payload:", { consumer_key: consumerKey, consumer_secret: consumerSecret });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await res.text();
    console.log("[AUTH RESPONSE] Status:", res.status);
    console.log("[AUTH RESPONSE] Body:", responseBody);

    if (!res.ok) {
      if (responseBody.startsWith("<!DOCTYPE")) {
        throw new Error(`Failed to fetch access token: ${res.status} - HTML response received (likely incorrect endpoint)`);
      }

      const errorData = JSON.parse(responseBody);
      throw new Error(`Failed to fetch access token: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const data = JSON.parse(responseBody);
    if (!data.token) {
      throw new Error("Access token not found in response");
    }

    return data.token;
  } catch (error: any) {
    console.error("[PESAPAL AUTH EXCEPTION]", error.message);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phoneNumber, amount, eventId, quantity } = await req.json();

    if (!firstName || !lastName || !email || !amount || !eventId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!notificationId) {
      throw new Error("Missing PESAPAL_IPN_ID environment variable");
    }

    // First, create a ticket record with pending status
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert([{
        event_id: eventId,
        email: email,
        quantity: quantity,
        status: 'pending',
        price: Math.round(parseFloat(amount) / quantity) // Calculate price per ticket
      }])
      .select()
      .single();

    if (ticketError) {
      throw new Error(`Failed to create ticket record: ${ticketError.message}`);
    }

    const accessToken = await getAccessToken();
    console.log("[PESAPAL ACCESS TOKEN]", accessToken);

    const orderTrackingId = ticketData.id; // Use the ticket ID as order tracking ID

    const payload = {
      id: orderTrackingId,
      currency: "UGX",
      amount: parseFloat(amount),
      description: "Ticket purchase for TIPAC event",
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || "",
        country_code: "UG",
      },
    };

    console.log("[PESAPAL SUBMIT PAYLOAD]", payload);

    const res = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await res.text();
    console.log("[SUBMIT ORDER RESPONSE] Status:", res.status);
    console.log("[SUBMIT ORDER RESPONSE] Body:", responseBody);

    if (!res.ok) {
      const errData = JSON.parse(responseBody);
      console.error("[PESAPAL SUBMIT ERROR]", res.status, errData);
      
      // Update ticket status to failed
      await supabase
        .from('tickets')
        .update({ status: 'failed' })
        .eq('id', ticketData.id);
      
      throw new Error(`Failed to submit payment request: ${res.status} - ${JSON.stringify(errData)}`);
    }

    const data = JSON.parse(responseBody);
    console.log("[PESAPAL PAYMENT REDIRECT]", data);

    if (!data.redirect_url) {
      throw new Error("Redirect URL not found in response");
    }

    // Update ticket with PesaPal transaction ID
    await supabase
      .from('tickets')
      .update({ 
        pesapal_transaction_id: data.order_tracking_id 
      })
      .eq('id', ticketData.id);

    return NextResponse.json({ url: data.redirect_url });
  } catch (error: any) {
    console.error("[PESAPAL TICKET PAYMENT ERROR]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}