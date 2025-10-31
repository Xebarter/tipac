import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

const dbName = "TIPAC";

export async function GET(req: NextRequest) {
  // Check authentication
  const adminSession = req.cookies.get('admin_session');
  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    const messages = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Fetched ${messages.length} messages from MongoDB`);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Check authentication
  const adminSession = req.cookies.get('admin_session');
  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    const result = await collection.updateOne(
      { _id: id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Message updated successfully" });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { error: "Failed to update message", details: String(error) },
      { status: 500 }
    );
  }
}