import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import QRCode from 'qrcode';

// Protect this route - admin only
export async function POST(request: Request) {
  try {
    const { event_id, num_cards, batch_code, card_type } = await request.json();

    // Validate input
    if (!event_id || !num_cards || !batch_code) {
      return NextResponse.json(
        { error: "Missing required fields: event_id, num_cards, batch_code" },
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

    // Generate invitation cards
    const cards = [];
    for (let i = 0; i < num_cards; i++) {
      // Generate QR code
      const cardId = crypto.randomUUID();
      const qrData = JSON.stringify({
        card_id: cardId,
        batch_code,
        event_id,
        card_type
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      cards.push({
        id: cardId,
        event_id,
        batch_code,
        card_type,
        qr_code: qrCode,
      });
    }

    // Try to create batch record with the provided batch_code
    let batchData, batchError;
    let attemptCount = 0;
    const maxAttempts = 5;
    
    do {
      // Try to create the batch record
      const result = await supabase
        .from('invitation_card_batches')
        .insert([{
          batch_code: attemptCount === 0 ? batch_code : `${batch_code}-${Date.now()}-${attemptCount}`,
          event_id,
          num_cards,
          card_type
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

    // Update cards with the actual batch code
    cards.forEach(card => {
      card.batch_code = actualBatchCode;
    });

    // Insert cards into database
    const { data: cardData, error: cardError } = await supabase
      .from('invitation_cards')
      .insert(cards)
      .select();

    if (cardError) {
      throw new Error(`Failed to create invitation cards: ${cardError.message}`);
    }

    // Generate PDF with card details
    const pdfBuffer = await generateCardsPDF(cardData, actualBatchCode, eventData, card_type);

    // Return success response with PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invitation-cards-${actualBatchCode}.pdf`
      }
    });
  } catch (error: any) {
    console.error("Error generating invitation cards:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invitation cards" },
      { status: 500 }
    );
  }
}

async function generateCardsPDF(cards: any[], batchCode: string, event: any, cardType?: string) {
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

  // Add title
  doc.fontSize(20).text('TIPAC Invitation Cards', { align: 'center' });
  doc.moveDown();
  
  // Add event information
  doc.fontSize(14).text('Event Details:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Event Name: ${event.title}`);
  doc.fontSize(12).text(`Date: ${new Date(event.date).toLocaleDateString()}`);
  doc.fontSize(12).text(`Location: ${event.location}`);
  doc.fontSize(12).text(`Batch Code: ${batchCode}`);
  doc.fontSize(12).text(`Card Type: ${cardType || 'Regular'}`);
  doc.fontSize(12).text(`Number of Cards: ${cards.length}`);
  doc.moveDown(2);
  
  // Add card information
  doc.fontSize(14).text('Cards:', { underline: true });
  doc.moveDown(0.5);
  
  // Add each card with QR code
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Check if we need a new page
    if (doc.y > 650 && i > 0) {
      doc.addPage();
      doc.fontSize(20).text('TIPAC Invitation Cards', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('Cards:', { underline: true });
      doc.moveDown(0.5);
    }
    
    // Card number and ID (using bold font by increasing font size)
    doc.fontSize(12).text(`${i + 1}. Card ID: ${card.id}`);
    
    // QR code
    const qrSize = 100;
    const qrX = doc.x;
    const qrY = doc.y + 10;
    
    // Convert base64 QR code to buffer
    const qrImage = card.qr_code.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrImage, 'base64');
    
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    
    // Card details next to QR code
    doc.fontSize(10);
    doc.text(`Batch Code: ${card.batch_code}`, qrX + qrSize + 10, qrY);
    doc.text(`Card Type: ${cardType || 'Regular'}`, qrX + qrSize + 10, qrY + 20);
    
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