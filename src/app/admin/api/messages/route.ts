import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

const dbName = "TIPAC";

export async function GET(req: NextRequest) {
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