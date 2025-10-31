import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import QRCode from 'qrcode';
import { Readable } from 'stream';

// Protect this route - admin only
export async function POST(request: Request) {
  try {
    const { event_id, num_tickets, batch_code } = await request.json();

    // Validate input
    if (!event_id || !num_tickets || !batch_code) {
      return NextResponse.json(
        { error: "Missing required fields: event_id, num_tickets, batch_code" },
        { status: 400 }
      );
    }

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('title, date, location')
      .eq('id', event_id)
      .single();

    if (eventError) {
      throw new Error(`Failed to fetch event details: ${eventError.message}`);
    }

    // Generate tickets
    const tickets = [];
    for (let i = 0; i < num_tickets; i++) {
      // Generate QR code
      const ticketId = crypto.randomUUID();
      const qrData = JSON.stringify({
        ticket_id: ticketId,
        batch_code,
        event_id
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      tickets.push({
        id: ticketId,
        event_id,
        purchase_channel: 'physical_batch',
        status: 'valid',
        is_active: false,
        batch_code,
        qr_code: qrCode
      });
    }

    // Try to create batch record with the provided batch_code
    let batchData, batchError;
    let attemptCount = 0;
    const maxAttempts = 5;
    
    do {
      // Try to create the batch record
      const result = await supabase
        .from('batches')
        .insert([{
          batch_code: attemptCount === 0 ? batch_code : `${batch_code}-${Date.now()}-${attemptCount}`,
          event_id,
          num_tickets
        }])
        .select()
        .single();
      
      batchData = result.data;
      batchError = result.error;
      
      attemptCount++;
    } while (batchError && batchError.code === '23505' && attemptCount < maxAttempts); // 23505 is duplicate key error

    if (batchError) {
      throw new Error(`Failed to create batch record after ${maxAttempts} attempts: ${batchError.message}`);
    }

    // Use the actual batch_code that was created (might be different if we had to modify it)
    const actualBatchCode = batchData.batch_code;

    // Update tickets with the actual batch code
    tickets.forEach(ticket => {
      ticket.batch_code = actualBatchCode;
    });

    // Insert tickets into database
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (ticketError) {
      throw new Error(`Failed to create tickets: ${ticketError.message}`);
    }

    // Generate PDF with ticket details
    const pdfBuffer = await generateTicketsPDF(ticketData, actualBatchCode, eventData);

    // Return success response with PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=tickets-${actualBatchCode}.pdf`
      }
    });
  } catch (error: any) {
    console.error("Error generating batch tickets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate batch tickets" },
      { status: 500 }
    );
  }
}

async function generateTicketsPDF(tickets: any[], batchCode: string, event: any) {
  // Create a simple text-based PDF content as a workaround for the fontkit issue
  let pdfContent = `%PDF-1.4\n`;
  pdfContent += `1 0 obj\n`;
  pdfContent += `<< /Type /Catalog /Pages 2 0 R >>\n`;
  pdfContent += `endobj\n`;
  pdfContent += `2 0 obj\n`;
  pdfContent += `<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n`;
  pdfContent += `endobj\n`;
  pdfContent += `3 0 obj\n`;
  pdfContent += `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\n`;
  pdfContent += `endobj\n`;
  pdfContent += `4 0 obj\n`;
  pdfContent += `<< /Length 100 >>\n`;
  pdfContent += `stream\n`;
  pdfContent += `BT\n`;
  pdfContent += `/F1 12 Tf\n`;
  pdfContent += `50 800 Td\n`;
  pdfContent += `(TIPAC Batch Tickets) Tj\n`;
  pdfContent += `0 -20 Td\n`;
  pdfContent += `(==================) Tj\n`;
  pdfContent += `0 -30 Td\n`;
  pdfContent += `(Event Details:) Tj\n`;
  pdfContent += `0 -20 Td\n`;
  pdfContent += `(Event Name: ${event.title}) Tj\n`;
  pdfContent += `0 -15 Td\n`;
  pdfContent += `(Date: ${new Date(event.date).toLocaleDateString()}) Tj\n`;
  pdfContent += `0 -15 Td\n`;
  pdfContent += `(Location: ${event.location}) Tj\n`;
  pdfContent += `0 -15 Td\n`;
  pdfContent += `(Batch Code: ${batchCode}) Tj\n`;
  pdfContent += `0 -15 Td\n`;
  pdfContent += `(Number of Tickets: ${tickets.length}) Tj\n`;
  pdfContent += `0 -30 Td\n`;
  pdfContent += `(Tickets:) Tj\n`;
  pdfContent += `0 -20 Td\n`;
  
  tickets.forEach((ticket, index) => {
    pdfContent += `(${index + 1}. Ticket ID: ${ticket.id}) Tj\n`;
    pdfContent += `0 -15 Td\n`;
    pdfContent += `(   Batch Code: ${ticket.batch_code}) Tj\n`;
    pdfContent += `0 -15 Td\n`;
    pdfContent += `(   Status: ${ticket.status}) Tj\n`;
    pdfContent += `0 -15 Td\n`;
    pdfContent += `(   Active: ${ticket.is_active ? 'Yes' : 'No'}) Tj\n`;
    pdfContent += `0 -20 Td\n`;
  });
  
  pdfContent += `ET\n`;
  pdfContent += `endstream\n`;
  pdfContent += `endobj\n`;
  pdfContent += `5 0 obj\n`;
  pdfContent += `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n`;
  pdfContent += `endobj\n`;
  pdfContent += `6 0 obj\n`;
  pdfContent += `<< /ProcSet [/PDF /Text] /Font << /F1 5 0 R >> >>\n`;
  pdfContent += `endobj\n`;
  pdfContent += `xref\n`;
  pdfContent += `0 7\n`;
  pdfContent += `0000000000 65535 f \n`;
  pdfContent += `0000000010 00000 n \n`;
  pdfContent += `0000000053 00000 n \n`;
  pdfContent += `0000000114 00000 n \n`;
  pdfContent += `0000000193 00000 n \n`;
  pdfContent += `0000000395 00000 n \n`;
  pdfContent += `0000000456 00000 n \n`;
  pdfContent += `trailer\n`;
  pdfContent += `<< /Size 7 /Root 1 0 R >>\n`;
  pdfContent += `startxref\n`;
  pdfContent += `506\n`;
  pdfContent += `%%EOF`;

  // Convert to a proper PDF buffer
  const pdfBuffer = Buffer.from(pdfContent, 'utf-8');
  return pdfBuffer;
}