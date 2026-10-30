import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  getPurchase,
  normalizePurchaseStatus,
  sanitizeBuyerFacingError,
} from "@/lib/paytota";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    const purchaseIdParam = searchParams.get("purchaseId");

    if (!ticketId && !purchaseIdParam) {
      return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    }

    let ticket: any = null;

    if (ticketId) {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      ticket = data;
    } else if (purchaseIdParam) {
      let { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("pesapal_transaction_id", purchaseIdParam)
        .maybeSingle();

      if ((!data || error) && purchaseIdParam) {
        ({ data, error } = await supabase
          .from("tickets")
          .select("*")
          .eq("payment_reference", purchaseIdParam)
          .maybeSingle());
      }

      if (error || !data) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      ticket = data;
    }

    const purchaseId =
      purchaseIdParam || ticket.payment_reference || ticket.pesapal_transaction_id;

    if (!purchaseId) {
      return NextResponse.json({
        ticketId: ticket.id,
        status: ticket.status,
        payment_status_description: ticket.pesapal_status || ticket.status,
      });
    }

    // If already confirmed locally, skip provider round-trip
    if (ticket.status === "confirmed") {
      return NextResponse.json({
        ticketId: ticket.id,
        purchaseId,
        status: "confirmed",
        payment_status_description: "successful",
      });
    }

    const purchase = await getPurchase(purchaseId);
    const { ticketStatus, label } = normalizePurchaseStatus(purchase.status);

    if (ticketStatus !== "pending" && ticket.status !== ticketStatus) {
      await supabase
        .from("tickets")
        .update({
          status: ticketStatus,
          pesapal_status: purchase.status,
        })
        .eq("id", ticket.id);
    } else if (purchase.status && purchase.status !== ticket.pesapal_status) {
      await supabase
        .from("tickets")
        .update({ pesapal_status: purchase.status })
        .eq("id", ticket.id);
    }

    return NextResponse.json({
      ticketId: ticket.id,
      purchaseId,
      status: ticketStatus,
      payment_status_description: label,
      provider_status: purchase.status,
    });
  } catch (error: any) {
    console.error("[MOBILE MONEY STATUS]", error);
    return NextResponse.json(
      { error: sanitizeBuyerFacingError(error?.message || "Failed to check payment status") },
      { status: 500 }
    );
  }
}
