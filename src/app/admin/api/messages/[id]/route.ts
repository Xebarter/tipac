import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const dbName = "TIPAC";

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid message ID" },
        { status: 400 }
      );
    }

    if (typeof read !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid read status" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read, status: read ? "read" : "unread", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid message ID" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
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