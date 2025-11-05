import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { ticket_id, buyer_name, buyer_phone } = await request.json();

    // Validate input
    if (!ticket_id) {
      return NextResponse.json(
        { error: "Missing required field: ticket_id" },
        { status: 400 },
      );
    }

    // Since we don't track ownership, we only update buyer information if provided
    const updateData: any = {};

    if (buyer_name) {
      updateData.buyer_name = buyer_name;
    }

    if (buyer_phone) {
      updateData.buyer_phone = buyer_phone;
    }

    // If no buyer information provided, we still return success since tickets are valid without it
    if (Object.keys(updateData).length === 0) {
      // Get ticket to verify it exists
      const { data: ticket, error: fetchError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticket_id)
        .eq("purchase_channel", "physical_batch")
        .single();

      if (fetchError || !ticket) {
        return NextResponse.json(
          { error: "Ticket not found or not a physical batch ticket" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: "Ticket is valid (no ownership tracking required)",
        ticket,
      });
    }

    // Update ticket with provided buyer information
    const { data, error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", ticket_id)
      .eq("purchase_channel", "physical_batch")
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { error: "Ticket not found or not a physical batch ticket" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Ticket updated successfully",
      ticket: data,
    });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ticket" },
      { status: 500 },
    );
  }
}
