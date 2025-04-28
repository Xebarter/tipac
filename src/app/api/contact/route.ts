import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create a transport for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Use any email service provider (e.g., Gmail, SendGrid, etc.)
  auth: {
    user: process.env.EMAIL_USER,   // Your email address (e.g., your Gmail address)
    pass: process.env.EMAIL_PASS,   // Your email password or app-specific password
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const subject = body.subject?.trim() || "";
    const message = body.message?.trim() || "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create the email content
    const mailOptions = {
      from: email, // Sender email
      to: process.env.RECIPIENT_EMAIL, // Recipient email (where you want the message sent)
      subject: `Contact Us Message: ${subject}`,
      text: `You have received a new message from ${name} (${email})\n\nMessage:\n${message}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Message sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}