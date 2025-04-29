import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getMongoClient } from "@/lib/mongodb";
import validator from "validator";

const dbName = "TIPAC";

const validateInput = (data: { name: string; email: string; subject: string; message: string }) => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }
  if (!data.email || !validator.isEmail(data.email)) {
    errors.push("A valid email is required");
  }
  if (!data.subject || data.subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters long");
  }
  if (!data.message || data.message.trim().length < 10) {
    errors.push("Message must be at least 10 characters long");
  }

  return errors;
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate input
    const validationErrors = validateInput({ name, email, subject, message });
    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      return NextResponse.json(
        { success: false, error: validationErrors.join(", ") },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: validator.escape(name.trim()),
      email: email.trim().toLowerCase(),
      subject: validator.escape(subject.trim()),
      message: validator.escape(message.trim()),
      createdAt: new Date(),
      read: false, // Initialize read status as false
    };

    // 1. Save to MongoDB
    const client = await getMongoClient();
    const db = client.db(dbName);
    const collection = db.collection("contacts");

    await collection.insertOne(sanitizedData);
    console.log("Message saved to MongoDB:", sanitizedData);

    // 2. Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Remove in production if possible
      },
    });

    await transporter.sendMail({
      from: `"TIPAC Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Contact Form Message: ${sanitizedData.subject}`,
      html: `
        <h2>New Message from TIPAC Contact Form</h2>
        <p><strong>Name:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedData.message}</p>
      `,
    }).then(() => {
      console.log("Email sent successfully to", process.env.RECIPIENT_EMAIL);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process contact message", details: String(error) },
      { status: 500 }
    );
  }
}