"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useState } from "react";

// Define the form data interface
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmissionStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" }); // Clear form
      } else {
        setSubmissionStatus("error");
        setErrorMessage(data.error || "An error occurred while sending the message.");
      }
    } catch (error) {
      setSubmissionStatus("error");
      setErrorMessage("Failed to connect to the server.");
      console.error("Form submission error:", error);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
              We&apos;d love to hear from you! Please use the form below to get in touch with our team.
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
                <div className="bg-muted/30 p-6 rounded-lg border border-border">
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