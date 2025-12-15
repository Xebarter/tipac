"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

import { useState } from "react";
import validator from "validator";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (!formData.email || !validator.isEmail(formData.email)) {
      errors.push("A valid email is required");
    }
    if (!formData.subject || formData.subject.trim().length < 3) {
      errors.push("Subject must be at least 3 characters long");
    }
    if (!formData.message || formData.message.trim().length < 10) {
      errors.push("Message must be at least 10 characters long");
    }

    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (submissionStatus === "error") {
      setErrorMessage(null); // Clear error on input change
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmissionStatus("error");
      setErrorMessage(validationErrors.join(", "));
      return;
    }

    setSubmissionStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Log response details for debugging
      console.log("Response status:", response.status);
      console.log("Response content-type:", response.headers.get("content-type"));
      
      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();

        if (response.ok && data.success) {
          setSubmissionStatus("success");
          setFormData({ name: "", email: "", subject: "", message: "" });
        } else {
          setSubmissionStatus("error");
          setErrorMessage(data.error || "An error occurred while sending the message.");
        }
      } else {
        // Try to get the response text to see what's actually being returned
        const responseText = await response.text();
        console.error("Received non-JSON response from server:", responseText.substring(0, 500) + "...");
        setSubmissionStatus("error");
        setErrorMessage("Failed to send message. The server is currently unavailable. Please try again later.");
      }
    } catch (error) {
      console.error("Network error during form submission:", error);
      setSubmissionStatus("error");
      setErrorMessage("Failed to connect to the server. Please check your connection and try again.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-1 relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-rose-50 via-purple-50 to-rose-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(244,114,182,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 md:w-80 md:h-80 bg-gradient-to-r from-rose-400/20 to-purple-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 md:w-[28rem] md:h-[28rem] bg-gradient-to-r from-purple-500/15 to-rose-500/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/3 right-1/5 w-56 h-56 bg-gradient-to-r from-fuchsia-400/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
              We'd love to hear from you! Please use the form below to get in touch with our team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Subject"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your message"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full tipac-gradient"
                    disabled={submissionStatus === "submitting"}
                  >
                    {submissionStatus === "submitting" ? "Sending..." : "Send Message"}
                  </Button>
                  {submissionStatus === "success" && (
                    <p className="text-green-500">Message sent successfully!</p>
                  )}
                  {submissionStatus === "error" && errorMessage && (
                    <p className="text-red-500">{errorMessage}</p>
                  )}
                </form>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border border-white/30 shadow-sm">
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Address</h3>
                    <p className="text-muted-foreground">
                      National Theatre
                      <br />
                      Kampala, Uganda
                    </p>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Email</h3>
                    <p className="text-primary">info@tipac.org</p>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Phone</h3>
                    <p className="text-muted-foreground">+256 772 470 972</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9am - 5pm
                      <br />
                      Saturday: 10am - 2pm
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}