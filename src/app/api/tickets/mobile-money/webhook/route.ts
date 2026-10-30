import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  getWebhookPublicKey,
  normalizePurchaseStatus,
  verifyWebhookSignature,
} from "@/lib/paytota";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    const publicKey =
      process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY || (await getWebhookPublicKey());

    if (publicKey) {
      const ok = verifyWebhookSignature(rawBody, signature, publicKey);
      if (!ok) {
        console.error("[MOBILE MONEY WEBHOOK] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn(
        "[MOBILE MONEY WEBHOOK] No public key configured — accepting payload without verify"
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[MOBILE MONEY WEBHOOK]", {
      id: body?.id,
      status: body?.status,
      event_type: body?.event_type,
      reference: body?.reference,
    });

    const purchaseId = body?.id as string | undefined;
    const reference = body?.reference as string | undefined;
    const status = body?.status as string | undefined;

    if (!purchaseId && !reference) {
      return NextResponse.json({ status: "ignored" });
    }

    const { ticketStatus } = normalizePurchaseStatus(status);

    let ticket: { id: string; status: string } | null = null;

    if (reference) {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, status")
        .eq("id", reference)
        .maybeSingle();
      if (error) {
        console.error("[MOBILE MONEY WEBHOOK] Lookup error", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }
      ticket = data;
    }

    if (!ticket && purchaseId) {
      const byTxn = await supabase
        .from("tickets")
        .select("id, status")
        .eq("pesapal_transaction_id", purchaseId)
        .maybeSingle();
      ticket = byTxn.data;
      if (!ticket) {
        const byRef = await supabase
          .from("tickets")
          .select("id, status")
          .eq("payment_reference", purchaseId)
          .maybeSingle();
        ticket = byRef.data;
      }
    }

    if (!ticket) {
      console.warn("[MOBILE MONEY WEBHOOK] No ticket for", { purchaseId, reference });
      return NextResponse.json({ status: "not_found" });
    }

    if (ticket.status === "confirmed" && ticketStatus !== "failed") {
      return NextResponse.json({ status: "already_confirmed" });
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: ticketStatus === "pending" ? ticket.status : ticketStatus,
        pesapal_status: status || ticketStatus,
        ...(purchaseId
          ? { pesapal_transaction_id: purchaseId, payment_reference: purchaseId }
          : {}),
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("[MOBILE MONEY WEBHOOK] Update error", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[MOBILE MONEY WEBHOOK ERROR]", error?.message || error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
