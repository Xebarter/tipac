import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request, { params }: { params: { ticket_id: string } }) {
  try {
    const ticketId = params.ticket_id;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      );
    }

    // Fetch ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events(title, date, location)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { 
          valid: false,
          message: "Ticket not found"
        },
        { status: 404 }
      );
    }

    // Check if ticket was already used
    if (ticket.used) {
      return NextResponse.json({
        valid: false,
        message: "Ticket already used",
        ticket: {
          id: ticket.id,
          event: ticket.events?.title,
          date: ticket.events?.date,
          location: ticket.events?.location,
          purchase_channel: ticket.purchase_channel
        }
      });
    }

    // For physical tickets, check if active
    if (ticket.purchase_channel === 'physical_batch') {
      if (!ticket.is_active) {
        return NextResponse.json({
          valid: false,
          message: "Ticket not activated",
          ticket: {
            id: ticket.id,
            event: ticket.events?.title,
            date: ticket.events?.date,
            location: ticket.events?.location,
            purchase_channel: ticket.purchase_channel
          }
        });
      }
    }

    // Mark ticket as used
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ used: true })
      .eq('id', ticketId);

    if (updateError) {
      console.error("Failed to mark ticket as used:", updateError);
      // Don't fail the verification just because we couldn't mark as used
    }

    // Return success
    return NextResponse.json({
      valid: true,
      message: "Valid ticket",
      ticket: {
        id: ticket.id,
        event: ticket.events?.title,
        date: ticket.events?.date,
        location: ticket.events?.location,
        purchase_channel: ticket.purchase_channel,
        buyer_name: ticket.buyer_name,
        buyer_phone: ticket.buyer_phone
      }
    });
  } catch (error: any) {
    console.error("Error verifying ticket:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: error.message || "Failed to verify ticket" 
      },
      { status: 500 }
    );
  }
}