"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Application {
  id: number;
  institution_name: string;
  address: string;
  city: string;
  contact_person: string;
  email: string;
  phone: string;
  institution_type: string;
  number_of_students: number;
  grade_levels: string;
  interest_reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function ApplicationsManagementPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    
    let query = supabase
      .from("school_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    
    setLoading(false);
  };

  const updateApplicationStatus = async (id: number, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("school_applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating application status:", error);
    } else {
      fetchApplications(); // Refresh the list
    }
  };

  const filteredApplications = statusFilter === "all" 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">School Applications</h1>
        <p className="text-gray-600">Manage applications from schools and institutions</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <Button onClick={fetchApplications}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredApplications.length === 0 ? (
              <li className="px-6 py-4 text-center">
                <p className="text-gray-500">No applications found</p>
              </li>
            ) : (
              filteredApplications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {application.institution_name}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            application.status === "pending" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : application.status === "approved" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
                          <p className="text-sm text-gray-500">
                            {application.contact_person} • {application.email} • {application.phone}
                          </p>
                          <p className="mt-1 sm:mt-0 sm:ml-2 text-sm text-gray-500">
                            {application.city}, {application.address}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => updateApplicationStatus(application.id, "approved")}
                          disabled={application.status === "approved"}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            application.status === "approved"
                              ? "bg-green-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, "rejected")}
                          disabled={application.status === "rejected"}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            application.status === "rejected"
                              ? "bg-red-400 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Institution Type</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {application.institution_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Number of Students</p>
                        <p className="mt-1 text-sm text-gray-900">{application.number_of_students}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Grade Levels</p>
                        <p className="mt-1 text-sm text-gray-900">{application.grade_levels}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Submitted</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500">Interest Reason</p>
                        <p className="mt-1 text-sm text-gray-900">{application.interest_reason}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}