import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request, { params }: { params: { ticket_id: string } }) {
  try {
    const ticketId = params.ticket_id;

    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    // Fetch ticket with event and ticket type information
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        events (
          id,
          title,
          date,
          location,
          organizer_name,
          organizer_logo_url
        ),
        ticket_types (
          name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Supabase error:', ticketError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Fetch event sponsors
    const { data: sponsors, error: sponsorsError } = await supabase
      .from('event_sponsors')
      .select(`
        sponsor_type,
        sponsors (
          name,
          logo_url
        )
      `)
      .eq('event_id', ticket.events?.id);

    if (sponsorsError) {
      console.error('Error fetching sponsors:', sponsorsError);
      // Continue without sponsors rather than failing
    }

    // Transform sponsors into the expected format
    const sponsorLogos = sponsors?.map(sponsor => ({
      url: sponsor.sponsors?.logo_url || '',
      name: sponsor.sponsors?.name || ''
    })) || [];

    // Format the response data to match what the PDF generator expects
    const ticketData = {
      id: ticket.id,
      event: {
        title: ticket.events?.title || 'Unknown Event',
        date: ticket.events?.date || '',
        location: ticket.events?.location || 'Unknown Location',
        organizer_name: ticket.events?.organizer_name || null,
        organizer_logo_url: ticket.events?.organizer_logo_url || null,
        sponsor_logos: sponsorLogos
      },
      buyer_name: ticket.buyer_name || '',
      buyer_phone: ticket.buyer_phone || '',
      purchase_channel: ticket.purchase_channel || 'online',
      confirmation_code: ticket.pesapal_transaction_id || ticket.confirmation_code || null
    };

    return NextResponse.json(ticketData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}