import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const dbName = "TIPAC";
const collectionName = "events";

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const events = await collection.find({}).sort({ date: -1 }).toArray();

    // Convert ObjectId to string for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      _id: event._id.toString()
    }));

    return NextResponse.json({ events: serializedEvents });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to load events", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const eventData = await request.json();
    
    // Add timestamp
    const eventWithTimestamp = {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(eventWithTimestamp);
    
    return NextResponse.json(
      { 
        message: "Event created successfully", 
        eventId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Event updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { error: "Failed to delete event", details: String(error) },
      { status: 500 }
    );
  }
}