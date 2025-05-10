// src/app/api/pesapal-status/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
const baseUrl = process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3";

async function getAccessToken() {
  try {
    const tokenUrl = `${baseUrl}/api/Auth/RequestToken`;
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
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    if (!res.ok) {
      const errorData = await res.text(); // Use text() to avoid JSON parse errors
      throw new Error(`Failed to fetch access token: ${res.status} - ${errorData}`);
    }

    const data = await res.json();
    return data.token;
  } catch (error: any) {
    throw new Error(`Access token error: ${error.message}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderTrackingId = searchParams.get("orderTrackingId");

    if (!orderTrackingId) {
      return NextResponse.json({ error: "Missing orderTrackingId" }, { status: 400 });
    }

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "Missing Pesapal credentials" },
        { status: 500 }
      );
    }

    const accessToken = await getAccessToken();

    const statusUrl = `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    if (!res.ok) {
      const errorData = await res.text(); // Use text() to avoid JSON parse errors
      throw new Error(`Failed to fetch transaction status: ${res.status} - ${errorData}`);
    }

    const data = await res.json();
    return NextResponse.json({ status: data.status });
  } catch (error: any) {
    console.error("[PESAPAL STATUS ERROR]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}