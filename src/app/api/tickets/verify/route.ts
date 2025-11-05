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
        events(title, date, location, organizer_name, organizer_logo_url, sponsor_logos)
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
          event: {
            title: ticket.events?.title,
            date: ticket.events?.date,
            location: ticket.events?.location,
            organizer_name: ticket.events?.organizer_name,
            organizer_logo_url: ticket.events?.organizer_logo_url,
            sponsor_logos: ticket.events?.sponsor_logos
          },
          buyer_name: ticket.buyer_name,
          buyer_phone: ticket.buyer_phone,
          purchase_channel: ticket.purchase_channel,
          used: ticket.used,
          confirmation_code: ticket.confirmation_code
        }
      });
    }

    // For physical tickets, check if active or has buyer information
    if (ticket.purchase_channel === 'physical_batch') {
      if (!ticket.is_active && !ticket.buyer_name) {
        return NextResponse.json({
          valid: false,
          message: "Ticket not activated",
          ticket: {
            id: ticket.id,
            event: {
              title: ticket.events?.title,
              date: ticket.events?.date,
              location: ticket.events?.location,
              organizer_name: ticket.events?.organizer_name,
              organizer_logo_url: ticket.events?.organizer_logo_url,
              sponsor_logos: ticket.events?.sponsor_logos
            },
            buyer_name: ticket.buyer_name,
            buyer_phone: ticket.buyer_phone,
            purchase_channel: ticket.purchase_channel,
            used: ticket.used,
            confirmation_code: ticket.confirmation_code
          }
        });
      }
      
      // Check if the batch is active or ticket has buyer information
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('is_active')
        .eq('batch_code', ticket.batch_code)
        .single();
        
      if (batchError) {
        console.error("Error fetching batch:", batchError);
      } else if (!batch.is_active && !ticket.buyer_name) {
        return NextResponse.json({
          valid: false,
          message: "Ticket batch has been deactivated",
          ticket: {
            id: ticket.id,
            event: {
              title: ticket.events?.title,
              date: ticket.events?.date,
              location: ticket.events?.location,
              organizer_name: ticket.events?.organizer_name,
              organizer_logo_url: ticket.events?.organizer_logo_url,
              sponsor_logos: ticket.events?.sponsor_logos
            },
            buyer_name: ticket.buyer_name,
            buyer_phone: ticket.buyer_phone,
            purchase_channel: ticket.purchase_channel,
            used: ticket.used,
            confirmation_code: ticket.confirmation_code
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
        event: {
          title: ticket.events?.title,
          date: ticket.events?.date,
          location: ticket.events?.location,
          organizer_name: ticket.events?.organizer_name,
          organizer_logo_url: ticket.events?.organizer_logo_url,
          sponsor_logos: ticket.events?.sponsor_logos
        },
        buyer_name: ticket.buyer_name,
        buyer_phone: ticket.buyer_phone,
        purchase_channel: ticket.purchase_channel,
        used: ticket.used,
        confirmation_code: ticket.confirmation_code
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