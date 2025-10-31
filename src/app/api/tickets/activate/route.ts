import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { ticket_id, buyer_name, buyer_phone } = await request.json();

    // Validate input
    if (!ticket_id || !buyer_name) {
      return NextResponse.json(
        { error: "Missing required fields: ticket_id, buyer_name" },
        { status: 400 }
      );
    }

    // Activate ticket
    const { data, error } = await supabase
      .from('tickets')
      .update({
        is_active: true,
        buyer_name,
        buyer_phone
      })
      .eq('id', ticket_id)
      .eq('purchase_channel', 'physical_batch')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate ticket: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { error: "Ticket not found or not a physical batch ticket" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Ticket activated successfully",
      ticket: data
    });
  } catch (error: any) {
    console.error("Error activating ticket:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate ticket" },
      { status: 500 }
    );
  }
}