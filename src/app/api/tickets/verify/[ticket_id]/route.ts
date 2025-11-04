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
      // Check if the individual ticket is active
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
      
      // Check if the batch is active
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('is_active')
        .eq('batch_code', ticket.batch_code)
        .single();
        
      if (batchError) {
        console.error("Error fetching batch:", batchError);
      } else if (!batch.is_active) {
        return NextResponse.json({
          valid: false,
          message: "Ticket batch has been deactivated",
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
        event: {
          title: ticket.events?.title,
          date: ticket.events?.date,
          location: ticket.events?.location
        },
        buyer_name: ticket.buyer_name,
        buyer_phone: ticket.buyer_phone,
        purchase_channel: ticket.purchase_channel
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

export async function PUT(request: Request, { params }: { params: { ticket_id: string } }) {
  try {
    const ticketId = params.ticket_id;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { used } = body;

    // Update ticket status
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({ used: used === true })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { 
          valid: false,
          message: "Failed to update ticket status"
        },
        { status: 500 }
      );
    }

    if (!ticket) {
      return NextResponse.json(
        { 
          valid: false,
          message: "Ticket not found"
        },
        { status: 404 }
      );
    }

    // Return success
    return NextResponse.json({
      valid: true,
      message: used === true ? "Ticket marked as used" : "Ticket status updated",
      ticket: {
        id: ticket.id,
        used: ticket.used
      }
    });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: error.message || "Failed to update ticket" 
      },
      { status: 500 }
    );
  }
}