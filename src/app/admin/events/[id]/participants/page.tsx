"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import Sidebar from "../../../components/Sidebar";

interface Participant {
  id: string;
  created_at: string;
  name: string;
  email: string;
  organization_type: 'school' | 'organization';
  event_id: string;
}

export default function EventParticipantsManagement() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  
  // Form state for new participant
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    organization_type: 'school' as 'school' | 'organization'
  });
  
  const router = useRouter();
  const { id: eventId } = useParams();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        router.push("/admin");
      }
    };
    
    checkAuth();
  }, [router]);

  // Load participants and event info
  useEffect(() => {
    if (!eventId) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('title')
          .eq('id', eventId)
          .single();
        
        if (eventError) throw eventError;
        setEventTitle(eventData.title);
        
        // Get participants
        const { data, error } = await supabase
          .from('event_participants')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setParticipants(data || []);
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load event data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setNewParticipant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newParticipant.name || !newParticipant.email) {
      setError("Please fill in all required fields.");
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newParticipant.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const participantData = {
        ...newParticipant,
        event_id: eventId as string
      };
      
      const { data, error } = await supabase
        .from('event_participants')
        .insert([participantData])
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccess("Participant registered successfully!");
      setNewParticipant({
        name: '',
        email: '',
        organization_type: 'school'
      });
      
      // Add new participant to the list
      setParticipants(prev => [data, ...prev]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error registering participant:", err);
      setError("Failed to register participant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (participantId: string) => {
    if (!confirm("Are you sure you want to remove this participant?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);
      
      if (error) throw error;
      
      setSuccess("Participant removed successfully!");
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error removing participant:", err);
      setError("Failed to remove participant. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-lg">Loading participants...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <button 
                onClick={() => router.back()}
                className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Events
              </button>
              
              <h1 className="text-3xl font-bold mb-2">Event Participants</h1>
              <h2 className="text-xl text-gray-600 mb-6">Managing participants for: {eventTitle}</h2>
              
              {/* Notifications */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              {/* Register Participant Form */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Register New Participant</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newParticipant.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={newParticipant.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="organization_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        id="organization_type"
                        name="organization_type"
                        value={newParticipant.organization_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="school">School</option>
                        <option value="organization">Organization</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
                        isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isSubmitting ? "Registering..." : "Register Participant"}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Participants List */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Registered Participants ({participants.length})</h2>
                
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No participants registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{participant.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                participant.organization_type === 'school' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {participant.organization_type.charAt(0).toUpperCase() + participant.organization_type.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(participant.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDelete(participant.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}