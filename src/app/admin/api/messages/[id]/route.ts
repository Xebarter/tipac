import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const adminSession = req.cookies.get('admin_session');
  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    const { read } = await req.json();

    if (typeof read !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid read status" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .update({ 
        is_read: read,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const adminSession = req.cookies.get('admin_session');
  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}