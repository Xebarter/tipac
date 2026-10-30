import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  createPurchase,
  executeMobileMoneyPurchase,
  isValidUgLocalPhone,
  sanitizeBuyerFacingError,
  toUgandaMsisdn,
} from "@/lib/paytota";

function siteOrigin(req: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
    return `${proto}://${host}`;
  }
  // Prefer production app URL over localhost when available via redirects below
  return "https://tipac.co.ug";
}

function paymentRedirects(ticketId: string, origin: string) {
  const success =
    process.env.PAYTOTA_SUCCESS_REDIRECT ||
    `${origin}/payment-complete?ticketId=${ticketId}&method=mm`;
  const failure =
    process.env.PAYTOTA_FAILURE_REDIRECT ||
    `${origin}/payment-complete?ticketId=${ticketId}&method=mm&failed=1`;
  // Prefer explicit path if set; otherwise our tickets webhook
  const callbackPath = process.env.PAYTOTA_WEBHOOK_PATH || "/api/tickets/mobile-money/webhook";
  const successCallback = `${origin}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`;
  return { success, failure, successCallback };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phoneNumber,
      amount,
      eventId,
      quantity,
      ticketTypeId,
      fullName,
      email,
    } = body;

    if (!eventId || !quantity || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const localPhone = String(phoneNumber || "").replace(/\s+/g, "");
    if (!isValidUgLocalPhone(localPhone)) {
      return NextResponse.json(
        { error: "Phone number must be in the format 07xxxxxxxx" },
        { status: 400 }
      );
    }

    const qty = Number.parseInt(String(quantity), 10);
    const total = Number.parseFloat(String(amount));
    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const msisdn = toUgandaMsisdn(localPhone);
    const buyerName = typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;
    const buyerEmail = typeof email === "string" && email.trim() ? email.trim() : null;

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .insert([
        {
          event_id: eventId,
          ticket_type_id: ticketTypeId || null,
          email: buyerEmail,
          quantity: qty,
          status: "pending",
          price: Math.round(total / qty),
          purchase_channel: "online",
          buyer_name: buyerName,
          buyer_phone: localPhone,
          payment_method: "mobile_money",
        },
      ])
      .select()
      .single();

    if (ticketError) {
      // payment_method column may not exist yet — retry without it
      if (ticketError.message?.includes("payment_method") || ticketError.code === "PGRST204") {
        const { data: fallbackTicket, error: fallbackError } = await supabase
          .from("tickets")
          .insert([
            {
              event_id: eventId,
              ticket_type_id: ticketTypeId || null,
              email: buyerEmail,
              quantity: qty,
              status: "pending",
              price: Math.round(total / qty),
              purchase_channel: "online",
              buyer_name: buyerName,
              buyer_phone: localPhone,
            },
          ])
          .select()
          .single();
        if (fallbackError) {
          console.error("[MOBILE MONEY] Ticket create error", fallbackError);
          return NextResponse.json(
            { error: "Could not create ticket. Please try again." },
            { status: 500 }
          );
        }
        return await startPurchase(req, fallbackTicket, {
          msisdn,
          total,
          buyerEmail,
          buyerName,
          eventId,
        });
      }
      console.error("[MOBILE MONEY] Ticket create error", ticketError);
      return NextResponse.json(
        { error: "Could not create ticket. Please try again." },
        { status: 500 }
      );
    }

    return await startPurchase(req, ticketData, {
      msisdn,
      total,
      buyerEmail,
      buyerName,
      eventId,
    });
  } catch (error: any) {
    console.error("[MOBILE MONEY] Error", error);
    return NextResponse.json(
      { error: sanitizeBuyerFacingError(error?.message || "Failed to start mobile money payment") },
      { status: 500 }
    );
  }
}

async function startPurchase(
  req: NextRequest,
  ticket: { id: string },
  opts: {
    msisdn: string;
    total: number;
    buyerEmail: string | null;
    buyerName: string | null;
    eventId: string;
  }
) {
  const origin = siteOrigin(req);
  const { success, failure, successCallback } = paymentRedirects(ticket.id, origin);

  let purchase;
  try {
    purchase = await createPurchase({
      phoneMsisdn: opts.msisdn,
      email: opts.buyerEmail,
      fullName: opts.buyerName,
      amountUgx: opts.total,
      productName: "TIPAC event ticket",
      reference: ticket.id,
      successRedirect: success,
      failureRedirect: failure,
      // Dashboard webhooks are primary; per-purchase callback only when public HTTPS
      successCallback,
    });
  } catch (err: any) {
    await supabase.from("tickets").update({ status: "failed" }).eq("id", ticket.id);
    throw err;
  }

  const purchaseId = purchase.id;
  if (!purchaseId) {
    await supabase.from("tickets").update({ status: "failed" }).eq("id", ticket.id);
    throw new Error("Payment provider did not return a transaction id");
  }

  // Store purchase id in legacy column so existing fetch/verify paths keep working
  const updatePayload: Record<string, unknown> = {
    pesapal_transaction_id: purchaseId,
    pesapal_status: purchase.status || "created",
    payment_reference: purchaseId,
    payment_method: "mobile_money",
  };

  const { error: updateError } = await supabase
    .from("tickets")
    .update(updatePayload)
    .eq("id", ticket.id);

  if (updateError) {
    // Retry without optional columns
    await supabase
      .from("tickets")
      .update({
        pesapal_transaction_id: purchaseId,
        pesapal_status: purchase.status || "created",
      })
      .eq("id", ticket.id);
  }

  try {
    await executeMobileMoneyPurchase(purchaseId);
  } catch (err: any) {
    console.error("[MOBILE MONEY] Execute failed", err);
    await supabase
      .from("tickets")
      .update({ status: "failed", pesapal_status: "execute_failed" })
      .eq("id", ticket.id);
    throw new Error(
      sanitizeBuyerFacingError(
        err?.message || "Could not send the payment prompt to your phone. Please try again."
      )
    );
  }

  await supabase
    .from("tickets")
    .update({ pesapal_status: "pending_execute" })
    .eq("id", ticket.id);

  return NextResponse.json({
    ticketId: ticket.id,
    purchaseId,
    status: "pending",
    message: "Check your phone and enter your Mobile Money PIN to complete payment.",
  });
}
