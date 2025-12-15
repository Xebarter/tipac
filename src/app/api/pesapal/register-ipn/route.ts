// src/app/api/pesapal/register-ipn/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
const baseUrl = process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3";
const ipnUrl = process.env.PESAPAL_IPN_URL; // Your IPN endpoint URL

async function getAccessToken() {
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET environment variables");
  }

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
    });

    if (!res.ok) {
      const responseBody = await res.text();
      if (responseBody.startsWith("<!DOCTYPE")) {
        throw new Error(`Failed to fetch access token: ${res.status} - HTML response received`);
      }
      
      const errorData = JSON.parse(responseBody);
      throw new Error(`Failed to fetch access token: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("Access token not found in response");
    }

    return data.token;
  } catch (error) {
    console.error("[PESAPAL AUTH EXCEPTION]", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ipnUrl) {
      throw new Error("Missing PESAPAL_IPN_URL environment variable");
    }

    const accessToken = await getAccessToken();

    const registerUrl = `${baseUrl}/api/URLSetup/RegisterIPN`;
    
    const res = await fetch(registerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "POST"
      }),
    });

    const responseBody = await res.text();
    
    if (!res.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseBody);
      } catch (parseError) {
        throw new Error(`Failed to register IPN: ${res.status} - ${responseBody}`);
      }
      
      // Handle error according to Pesapal API 3.0 error structure
      if (errorData.error) {
        throw new Error(`IPN Registration failed: ${errorData.error.type} - ${errorData.error.message}`);
      }
      
      throw new Error(`Failed to register IPN: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const data = JSON.parse(responseBody);
    
    return NextResponse.json({ 
      success: true, 
      ipn_id: data.ipn_id,
      message: data.message 
    });
  } catch (error: any) {
    console.error("[PESAPAL IPN REGISTRATION ERROR]", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!ipnUrl) {
      throw new Error("Missing PESAPAL_IPN_URL environment variable");
    }

    const accessToken = await getAccessToken();

    const getUrl = `${baseUrl}/api/URLSetup/GetIpnList`;
    
    const res = await fetch(getUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    });

    const responseBody = await res.text();
    
    if (!res.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseBody);
      } catch (parseError) {
        throw new Error(`Failed to get IPN list: ${res.status} - ${responseBody}`);
      }
      
      // Handle error according to Pesapal API 3.0 error structure
      if (errorData.error) {
        throw new Error(`Get IPN List failed: ${errorData.error.type} - ${errorData.error.message}`);
      }
      
      throw new Error(`Failed to get IPN list: ${res.status} - ${JSON.stringify(errorData)}`);
    }

    const data = JSON.parse(responseBody);
    
    return NextResponse.json({ 
      success: true, 
      ipn_list: data 
    });
  } catch (error: any) {
    console.error("[PESAPAL GET IPN LIST ERROR]", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}