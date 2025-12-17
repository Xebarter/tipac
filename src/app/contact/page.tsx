"use client";

import { useState } from "react";
import validator from "validator";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

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
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        setSubmissionStatus("error");
        setErrorMessage("Failed to send message. Please try again later.");
      }
    } catch (error) {
      setSubmissionStatus("error");
      setErrorMessage("Failed to connect to the server. Please check your connection.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Background with Trustworthy Red/Purple Gradient */}
      <section className="flex-1 relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">

        {/* Decorative Blur Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(126,34,206,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">Touch</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Have questions about our programs or theater initiatives? Our team at TIPAC is here to help you every step of the way.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

              {/* FORM SECTION (3/5 Columns) */}
              <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-600 rounded-full" />
                  Send us a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all shadow-sm"
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all shadow-sm"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all shadow-sm"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-bold text-gray-700 ml-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all shadow-sm resize-none"
                      placeholder="How can we help you today?"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-7 text-lg font-bold bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-70"
                    disabled={submissionStatus === "submitting"}
                  >
                    {submissionStatus === "submitting" ? "Sending..." : "Send Message"}
                  </Button>

                  {/* Feedback Messages */}
                  {submissionStatus === "success" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      <p className="text-green-700 font-bold text-sm">Thank you! Your message has been sent successfully.</p>
                    </div>
                  )}
                  {submissionStatus === "error" && errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in shake">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      <p className="text-red-700 font-bold text-sm">{errorMessage}</p>
                    </div>
                  )}
                </form>
              </div>

              {/* INFO SECTION (2/5 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-purple-700 to-red-600 p-1 rounded-[2rem] shadow-2xl transition-transform hover:scale-[1.02]">
                  <div className="bg-white p-8 rounded-[1.9rem] h-full">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                      Contact Info
                    </h2>

                    <div className="space-y-8">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">Our Location</h3>
                          <p className="text-gray-600 leading-relaxed">National Theatre<br />Kampala, Uganda</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">Email Us</h3>
                          <p className="text-purple-700 font-bold">info@tipac.org</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">Phone</h3>
                          <p className="text-gray-600">+256 772 470 972</p>
                        </div>
                      </div>

                      <div className="flex gap-4 border-t border-gray-100 pt-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">Opening Hours</h3>
                          <p className="text-sm text-gray-600">Mon - Fri: 9am - 5pm<br />Sat: 10am - 2pm</p>
                        </div>
                      </div>
                    </div>
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