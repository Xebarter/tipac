import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import validator from "validator";
import { supabase } from "@/lib/supabaseClient";

const validateInput = (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
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

export async function GET() {
  return NextResponse.json({ message: "Contact API is working" });
}

export async function POST(req: NextRequest) {
  try {
    console.log("Contact form submission started");
    const { name, email, subject, message } = await req.json();
    console.log("Received data:", { name, email, subject, message });

    // Validate input
    const validationErrors = validateInput({ name, email, subject, message });
    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      return NextResponse.json(
        { success: false, error: validationErrors.join(", ") },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: validator.escape(name.trim()),
      email: email.trim().toLowerCase(),
      subject: validator.escape(subject.trim()),
      message: validator.escape(message.trim()),
      created_at: new Date().toISOString(),
      is_read: false,
    };

    console.log("Data sanitized successfully");

    // Save to Supabase
    try {
      console.log("Attempting to save to Supabase");
      const { data: supabaseData, error: supabaseError } = await supabase
        .from("contact_messages")
        .insert([sanitizedData]);

      if (supabaseError) {
        console.error("Error saving to Supabase:", supabaseError);
      } else {
        console.log("Message saved to Supabase:", supabaseData);
      }
    } catch (supabaseError) {
      console.error("Error with Supabase operation:", supabaseError);
    }

    // Send email (only if email environment variables are set)
    try {
      console.log("Checking email environment variables");
      if (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS &&
        process.env.RECIPIENT_EMAIL
      ) {
        console.log(
          "Email environment variables found, setting up transporter",
        );
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

        console.log("Sending email");
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
        });
        console.log("Email sent successfully to", process.env.RECIPIENT_EMAIL);
      } else {
        console.log(
          "Email environment variables not set. Skipping email sending.",
        );
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the whole request if email fails
    }

    console.log("Contact form submission completed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process contact message" },
      { status: 500 },
    );
  }
}
