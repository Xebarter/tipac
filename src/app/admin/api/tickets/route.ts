import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const dbName = "TIPAC";
const collectionName = "tickets";

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

export async function POST(req: NextRequest) {
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
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Validate required fields
    const { eventId, eventName, ticketType, price, quantity, purchaserName, purchaserEmail } = body;
    
    if (!eventId || !eventName || !ticketType || !price || !quantity || !purchaserName || !purchaserEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ticketData = {
      eventId: new ObjectId(eventId),
      eventName,
      ticketType,
      price,
      quantity,
      purchaserName,
      purchaserEmail,
      purchasedAt: new Date(),
      status: "confirmed"
    };

    const result = await collection.insertOne(ticketData);
    
    return NextResponse.json({ 
      message: "Ticket created successfully",
      ticketId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket", details: String(error) },
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
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Check authentication
  const adminSession = req.cookies.get('admin_session');
  if (!adminSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Failed to delete ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket", details: String(error) },
      { status: 500 }
    );
  }
}