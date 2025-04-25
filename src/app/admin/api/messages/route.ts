import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10); // Current page
  const limit = 10; // Number of messages per page
  const skip = (page - 1) * limit; // How many messages to skip

  try {
    const client = await getMongoClient();
    const db = client.db("TIPAC");
    const collection = db.collection("contacts");

    const totalMessages = await collection.countDocuments(); // Total messages count
    const messages = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(totalMessages / limit); // Total number of pages

    return NextResponse.json({
      messages: messages.map((msg) => ({
        ...msg,
        _id: msg._id.toString(),
      })),
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
