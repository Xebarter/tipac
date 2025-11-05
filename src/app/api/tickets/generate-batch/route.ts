import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import QRCode from 'qrcode';

// Protect this route - admin only
export async function POST(request: Request) {
  try {
    const { event_id, num_tickets, batch_code, price } = await request.json();

    // Validate input
    if (!event_id || !num_tickets || !batch_code) {
      return NextResponse.json(
        { error: "Missing required fields: event_id, num_tickets, batch_code" },
        { status: 400 }
      );
    }

    // Get event details including organizer and sponsor information
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('title, date, location, organizer_name, organizer_logo_url, sponsor_logos')
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
        is_active: true, // Set to true since we're adding buyer info
        batch_code,
        qr_code: qrCode,
        price: price || 0, // Add price to ticket data
        buyer_name: "Offline Buyer", // Add default buyer information
        buyer_phone: "0000000000", // Add default phone
        email: "offlinebuyer@gmail.com" // Add default email
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
          num_tickets,
          is_active: true // Ensure batch is active by default
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
    const pdfBuffer = await generateTicketsPDF(ticketData, actualBatchCode, eventData, price);

    // Return success response with PDF
    return new NextResponse(pdfBuffer as any, {
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

async function generateTicketsPDF(tickets: any[], batchCode: string, event: any, price?: number) {
  // Dynamically import PDFKit to avoid issues with Next.js server-side rendering
  const PDFDocument = (await import('pdfkit')).default;
  
  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });
  
  // Store PDF data in a buffer
  const chunks: Buffer[] = [];
  
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});

  // Add title
  doc.fontSize(20).text('TIPAC Batch Tickets', { align: 'center' });
  doc.moveDown();
  
  // Add organizer information if available
  if (event.organizer_logo_url) {
    try {
      doc.fontSize(10).text('Organized by:', 50, doc.y, { continued: true });
      doc.text(event.organizer_name || 'Event Organizer', { underline: true });
      doc.moveDown(0.5);
    } catch (err) {
      // If image loading fails, just show the name
      doc.fontSize(10).text('Organized by: ' + (event.organizer_name || 'Event Organizer'), { underline: true });
      doc.moveDown(0.5);
    }
  }
  
  // Add event information
  doc.fontSize(14).text('Event Details:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Event Name: ${event.title}`);
  doc.fontSize(12).text(`Date: ${new Date(event.date).toLocaleDateString()}`);
  doc.fontSize(12).text(`Location: ${event.location}`);
  doc.fontSize(12).text(`Batch Code: ${batchCode}`);
  doc.fontSize(12).text(`Number of Tickets: ${tickets.length}`);
  if (price !== undefined) {
    doc.fontSize(12).text(`Price per Ticket: ${price > 0 ? `UGX ${price.toLocaleString()}` : 'Free'}`);
  }
  doc.moveDown(2);
  
  // Add sponsor information if available
  if (event.sponsor_logos && event.sponsor_logos.length > 0) {
    doc.fontSize(14).text('Sponsors:', { underline: true });
    doc.moveDown(0.5);
    
    // List sponsors
    event.sponsor_logos.forEach((sponsor: any) => {
      doc.fontSize(10).text(`• ${sponsor.name || 'Sponsor'}`);
    });
    
    doc.moveDown(2);
  }
  
  // Add ticket information
  doc.fontSize(14).text('Tickets:', { underline: true });
  doc.moveDown(0.5);
  
  // Add each ticket with QR code
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    
    // Check if we need a new page
    if (doc.y > 650 && i > 0) {
      doc.addPage();
      doc.fontSize(20).text('TIPAC Batch Tickets', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('Tickets:', { underline: true });
      doc.moveDown(0.5);
    }
    
    // Ticket number and ID (using bold font by increasing font size)
    doc.fontSize(12).text(`${i + 1}. Ticket ID: ${ticket.id}`);
    
    // QR code
    const qrSize = 100;
    const qrX = doc.x;
    const qrY = doc.y + 10;
    
    // Convert base64 QR code to buffer
    const qrImage = ticket.qr_code.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrImage, 'base64');
    
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    
    // Ticket details next to QR code
    doc.fontSize(10);
    doc.text(`Batch Code: ${ticket.batch_code}`, qrX + qrSize + 10, qrY);
    doc.text(`Status: ${ticket.status}`, qrX + qrSize + 10, qrY + 20);
    doc.text(`Active: ${(ticket.is_active || ticket.buyer_name) ? 'Yes' : 'No'}`, qrX + qrSize + 10, qrY + 40);
    if (price !== undefined) {
      doc.text(`Price: ${price > 0 ? `UGX ${price.toLocaleString()}` : 'Free'}`, qrX + qrSize + 10, qrY + 60);
    }
    
    // Move down below the QR code
    doc.moveDown(7);
  }
  
  // Finalize PDF file
  doc.end();
  
  // Wait for the stream to finish and return the buffer
  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
  });
}