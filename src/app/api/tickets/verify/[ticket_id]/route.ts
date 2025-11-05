import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  request: Request,
  { params }: { params: { ticket_id: string } },
) {
  try {
    const ticketId = params.ticket_id;

    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    // Fetch ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        *,
        events(title, date, location, organizer_name, organizer_logo_url, sponsor_logos)
      `)
      .eq("id", ticketId)
      .single();

    console.log("Ticket verification request for ID:", ticketId);
    console.log("Retrieved ticket:", ticket);
    console.log("Ticket error:", error);

    if (error || !ticket) {
      return NextResponse.json(
        {
          valid: false,
          message: "Ticket not found",
        },
        { status: 404 },
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
            sponsor_logos: ticket.events?.sponsor_logos,
          },
          buyer_name: ticket.buyer_name,
          buyer_phone: ticket.buyer_phone,
          purchase_channel: ticket.purchase_channel,
          used: ticket.used,
          confirmation_code: ticket.confirmation_code,
        },
      });
    }

    // For physical tickets, check only if the batch is active
    if (ticket.purchase_channel === "physical_batch") {
      console.log("Processing physical batch ticket");
      console.log("Ticket batch_code:", ticket.batch_code);

      // Check if the batch is active
      const { data: batch, error: batchError } = await supabase
        .from("batches")
        .select("is_active")
        .eq("batch_code", ticket.batch_code)
        .single();

      console.log("Batch data:", batch);
      console.log("Batch error:", batchError);

      if (batchError) {
        console.error("Error fetching batch:", batchError);
      } else if (!batch.is_active) {
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
              sponsor_logos: ticket.events?.sponsor_logos,
            },
            buyer_name: ticket.buyer_name,
            buyer_phone: ticket.buyer_phone,
            purchase_channel: ticket.purchase_channel,
            used: ticket.used,
            confirmation_code: ticket.confirmation_code,
          },
        });
      }

      console.log("Ticket passed batch check");
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
          sponsor_logos: ticket.events?.sponsor_logos,
        },
        buyer_name: ticket.buyer_name,
        buyer_phone: ticket.buyer_phone,
        purchase_channel: ticket.purchase_channel,
        used: ticket.used,
        confirmation_code: ticket.confirmation_code,
      },
    });
  } catch (error: any) {
    console.error("Error verifying ticket:", error);
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "Failed to verify ticket",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { ticket_id: string } },
) {
  try {
    const ticketId = params.ticket_id;

    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const body = await request.json();
    const { used } = body;

    // Update ticket status
    const { data: ticket, error } = await supabase
      .from("tickets")
      .update({ used: used === true })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          valid: false,
          message: "Failed to update ticket status",
        },
        { status: 500 },
      );
    }

    if (!ticket) {
      return NextResponse.json(
        {
          valid: false,
          message: "Ticket not found",
        },
        { status: 404 },
      );
    }

    // Return success
    return NextResponse.json({
      valid: true,
      message:
        used === true ? "Ticket marked as used" : "Ticket status updated",
      ticket: {
        id: ticket.id,
        used: ticket.used,
      },
    });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "Failed to update ticket",
      },
      { status: 500 },
    );
  }
}
