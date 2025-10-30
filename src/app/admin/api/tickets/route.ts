import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const dbName = "TIPAC";
const collectionName = "tickets";

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const tickets = await collection.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event"
        }
      },
      {
        $unwind: "$event"
      },
      {
        $sort: { purchasedAt: -1 }
      }
    ]).toArray();

    // Convert ObjectIds to strings for JSON serialization
    const serializedTickets = tickets.map(ticket => ({
      ...ticket,
      _id: ticket._id.toString(),
      eventId: ticket.eventId.toString(),
      "event._id": ticket.event._id.toString()
    }));

    return NextResponse.json({ tickets: serializedTickets });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: "Failed to load tickets", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const ticketData = await request.json();
    
    // Add timestamp
    const ticketWithTimestamp = {
      ...ticketData,
      purchasedAt: new Date(),
      status: "confirmed"
    };
    
    const result = await collection.insertOne(ticketWithTimestamp);
    
    return NextResponse.json(
      { 
        message: "Ticket created successfully", 
        ticketId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket", details: String(error) },
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
        { error: "Ticket ID is required" },
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
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Ticket updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket", details: String(error) },
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
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Ticket deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket", details: String(error) },
      { status: 500 }
    );
  }
}