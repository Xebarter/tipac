"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient';
import QRCode from 'qrcode';

export default function InvitationCardsPage() {
  const [formData, setFormData] = useState({
    event_id: '',
    num_cards: 10,
    batch_code: '',
    card_type: 'VIP'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Load events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date')
          .order('date', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error loading events:", err);
        setError("Failed to load events");
      }
    };

    loadEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_cards' ? Number(value) : value
    }));
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create invitation cards batch
      const response = await fetch('/admin/api/invitation-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invitation cards');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invitation-cards-${formData.batch_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Invitation cards generated successfully!');
      setFormData({
        event_id: '',
        num_cards: 10,
        batch_code: '',
        card_type: 'VIP'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Invitation Cards</h1>
        <p className="text-gray-600 mt-1">Generate QR codes for invitation cards</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Generate Invitation Cards</h2>
          <p className="text-sm text-gray-500 mt-1">Create a batch of invitation cards with QR codes</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleGenerateCards} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="event_id" className="block text-sm font-medium text-gray-700">
                  Event
                </label>
                <select
                  id="event_id"
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({formatDate(event.date)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="num_cards" className="block text-sm font-medium text-gray-700">
                  Number of Cards
                </label>
                <input
                  type="number"
                  id="num_cards"
                  name="num_cards"
                  min="1"
                  max="1000"
                  value={formData.num_cards}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="batch_code" className="block text-sm font-medium text-gray-700">
                  Batch Code
                </label>
                <input
                  type="text"
                  id="batch_code"
                  name="batch_code"
                  value={formData.batch_code}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter unique batch code"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="card_type" className="block text-sm font-medium text-gray-700">
                  Card Type
                </label>
                <select
                  id="card_type"
                  name="card_type"
                  value={formData.card_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="VIP">VIP</option>
                  <option value="Regular">Regular</option>
                  <option value="Press">Press</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGenerating}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isGenerating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Cards"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">How to use:</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-blue-700">
              <li>Select the event for which you want to generate invitation cards</li>
              <li>Specify the number of cards to generate (1-1000)</li>
              <li>Enter a unique batch code (used to identify this batch)</li>
              <li>Select the card type (VIP, Regular, etc.)</li>
              <li>Click "Generate Cards" to create the cards and download the PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}