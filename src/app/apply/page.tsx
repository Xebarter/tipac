"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Glassmorphic decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="bg-white/30 backdrop-blur-xl p-8 rounded-lg shadow-xl border border-white/20">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 drop-shadow-lg">Application Submitted Successfully!</h1>
            <p className="text-center text-gray-700 mb-6 drop-shadow-md">
              Thank you for your interest in participating in TIPAC activities. We have received your application and will review it shortly.
            </p>
            <p className="text-center text-gray-700 drop-shadow-md">
              We will contact you via email or phone within 5 business days.
            </p>
            <div className="mt-8 text-center">
              <a href="/" className="text-indigo-600 hover:text-indigo-800 underline drop-shadow-sm">
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Glassmorphic decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-800 sm:text-4xl drop-shadow-sm">
            Apply for TIPAC Participation
          </h1>
          <p className="mt-3 text-xl text-gray-700 drop-shadow-sm">
            Submit your institution's application to participate in TIPAC activities
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-white/30">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Institution Information</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="institutionName" className="text-gray-700">Institution Name *</Label>
                  <Input
                    id="institutionName"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="institutionType" className="text-gray-700">Institution Type *</Label>
                  <select
                    id="institutionType"
                    name="institutionType"
                    value={formData.institutionType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white/70 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-gray-800 backdrop-blur-sm"
                    required
                  >
                    <option value="">Select Institution Type</option>
                    <option value="primary_school">Primary School</option>
                    <option value="secondary_school">Secondary School</option>
                    <option value="college_university">College/University</option>
                    <option value="ngo">NGO/Community Organization</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="address" className="text-gray-700">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city" className="text-gray-700">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numberOfStudents" className="text-gray-700">Number of Students *</Label>
                  <Input
                    id="numberOfStudents"
                    name="numberOfStudents"
                    type="number"
                    min="1"
                    value={formData.numberOfStudents}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contactPerson" className="text-gray-700">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Participation Details</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gradeLevels" className="text-gray-700">Grade Levels / Age Groups *</Label>
                  <Input
                    id="gradeLevels"
                    name="gradeLevels"
                    placeholder="e.g. Grades 4-7 or Ages 10-14"
                    value={formData.gradeLevels}
                    onChange={handleChange}
                    required
                    className="bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="interestReason" className="text-gray-700">Why are you interested in TIPAC? *</Label>
                <textarea
                  id="interestReason"
                  name="interestReason"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white/70 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm text-gray-800 placeholder-gray-500 backdrop-blur-sm"
                  value={formData.interestReason}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {submitError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{submitError}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl px-6 py-3 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}