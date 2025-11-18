import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { card_id } = body;

    if (!card_id) {
      return NextResponse.json(
        { error: "Missing card ID" },
        { status: 400 }
      );
    }

    // Fetch invitation card
    const { data: card, error } = await supabase
      .from('invitation_cards')
      .select(`
        *,
        events(title, date, location)
      `)
      .eq('id', card_id)
      .single();

    console.log("Invitation card verification request for ID:", card_id);
    console.log("Retrieved card:", card);
    console.log("Card error:", error);

    if (error || !card) {
      return NextResponse.json(
        { 
          valid: false,
          message: "Invitation card not found"
        },
        { status: 404 }
      );
    }

    // Check if card was already used
    if (card.is_used) {
      return NextResponse.json({
        valid: false,
        message: "Invitation card already used",
        card: {
          id: card.id,
          event: {
            title: card.events?.title,
            date: card.events?.date,
            location: card.events?.location
          },
          card_type: card.card_type,
          is_used: card.is_used
        }
      });
    }

    // Check if the batch is active by checking the invitation_card_batches table
    console.log("Processing batch card");
    console.log("Card batch_code:", card.batch_code);
    
    // Check if the batch is active
    const { data: batch, error: batchError } = await supabase
      .from('invitation_card_batches')
      .select('*')
      .eq('batch_code', card.batch_code)
      .single();
      
    console.log("Batch data:", batch);
    console.log("Batch error:", batchError);
      
    if (batchError) {
      console.error("Error fetching batch:", batchError);
    } else if (!batch) {
      return NextResponse.json({
        valid: false,
        message: "Card batch not found",
        card: {
          id: card.id,
          event: {
            title: card.events?.title,
            date: card.events?.date,
            location: card.events?.location
          },
          card_type: card.card_type,
          is_used: card.is_used
        }
      });
    }

    // Return success
    return NextResponse.json({
      valid: true,
      message: "Valid invitation card",
      card: {
        id: card.id,
        event: {
          title: card.events?.title,
          date: card.events?.date,
          location: card.events?.location
        },
        card_type: card.card_type,
        is_used: card.is_used
      }
    });
  } catch (error: any) {
    console.error("Error verifying invitation card:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: error.message || "Failed to verify invitation card" 
      },
      { status: 500 }
    );
  }
}