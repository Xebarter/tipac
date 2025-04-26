import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Safely check and use the MONGODB_URI
type Env = {
  MONGODB_URI?: string;
};

const uri = (process.env as Env).MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const client = new MongoClient(uri);
const dbName = "TIPAC";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    const total = await collection.countDocuments();
    const messages = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({
      page,
      totalPages: Math.ceil(total / pageSize),
      messages,
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
