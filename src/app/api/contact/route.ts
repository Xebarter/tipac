import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const subject = formData.get("subject")?.toString().trim() || "";
    const message = formData.get("message")?.toString().trim() || "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const contactData = {
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
    };

    const client = await getMongoClient();
    const db = client.db("TIPAC"); // Change if you use a different DB name
    const collection = db.collection("contacts");

    await collection.insertOne(contactData);

    return NextResponse.json({ success: true, message: "Message received" }, { status: 200 });
  } catch (error) {
    console.error("Error saving contact form:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
