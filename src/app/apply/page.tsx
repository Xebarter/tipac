"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SchoolApplicationPage() {
  const [formData, setFormData] = useState({
    institutionName: "",
    address: "",
    city: "",
    contactPerson: "",
    email: "",
    phone: "",
    institutionType: "",
    numberOfStudents: "",
    gradeLevels: "",
    interestReason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch('/api/school-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          institutionName: "",
          address: "",
          city: "",
          contactPerson: "",
          email: "",
          phone: "",
          institutionType: "",
          numberOfStudents: "",
          gradeLevels: "",
          interestReason: "",
        });
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || "Failed to submit application");
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <main className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <section className="flex-1 relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <div className="bg-white/40 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/40">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl animate-in zoom-in duration-500">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">Success!</h1>
              <p className="text-xl text-gray-700 mb-8">
                Thank you for applying. We've received your details and our team will be in touch within 5 business days.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-700 to-red-600 text-white px-8 py-6 rounded-xl font-bold hover:shadow-lg transition-all">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <section className="flex-1 relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 sm:text-5xl tracking-tight mb-4">
              Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">TIPAC Participation</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please complete all required fields below to register your institution for upcoming programs and theater initiatives.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl rounded-[2rem] border border-white/50">
            <form className="space-y-10" onSubmit={handleSubmit}>

              {/* SECTION 1: INSTITUTION */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Institution Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionName" className="font-bold text-gray-700">Institution Name *</Label>
                    <Input id="institutionName" name="institutionName" value={formData.institutionName} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institutionType" className="font-bold text-gray-700">Institution Type *</Label>
                    <select id="institutionType" name="institutionType" value={formData.institutionType} onChange={handleChange} required className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm text-gray-800">
                      <option value="">Select Type</option>
                      <option value="primary_school">Primary School</option>
                      <option value="secondary_school">Secondary School</option>
                      <option value="college_university">College/University</option>
                      <option value="ngo">NGO/Organization</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address" className="font-bold text-gray-700">Physical Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-bold text-gray-700">City / District *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfStudents" className="font-bold text-gray-700">Total Enrollment *</Label>
                    <Input id="numberOfStudents" name="numberOfStudents" type="number" min="1" value={formData.numberOfStudents} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-red-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Point of Contact</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="font-bold text-gray-700">Full Name *</Label>
                    <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-gray-700">Email Address *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-gray-700">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevels" className="font-bold text-gray-700">Target Grade Levels *</Label>
                    <Input id="gradeLevels" name="gradeLevels" placeholder="e.g. P4 - P7 or Ages 8-12" value={formData.gradeLevels} onChange={handleChange} required className="h-12 border-gray-200 focus:ring-purple-600 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: STATEMENT */}
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="interestReason" className="font-bold text-gray-700">Why is your institution interested in joining TIPAC? *</Label>
                  <textarea
                    id="interestReason"
                    name="interestReason"
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm text-gray-800"
                    placeholder="Tell us about your goals for participating..."
                    value={formData.interestReason}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {submitError && (
                <div className="rounded-2xl bg-red-50 p-5 border border-red-200 flex items-center gap-3 animate-shake">
                  <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-bold text-red-800">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-8">
                <Link href="/" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50 px-10 py-7 rounded-2xl font-bold">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-red-600 hover:from-purple-800 hover:to-red-700 text-white shadow-xl px-12 py-7 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Processing..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}