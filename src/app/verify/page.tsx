"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TicketScannerPage() {
  const [result, setResult] = useState<{ valid: boolean; message: string; ticket?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState("");

  // Verify ticket with the API
  const verifyTicket = async (id: string) => {
    try {
      if (!id) {
        setError("Please enter a ticket ID");
        return;
      }
      
      const response = await fetch(`/api/tickets/verify/${id}`);
      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      setError("Failed to verify ticket");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Ticket Verification</h1>
          <p className="text-gray-400">
            Manually enter ticket IDs to verify authenticity
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Verification</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="ticketId" className="block text-sm font-medium text-gray-300 mb-2">
                Ticket ID
              </label>
              <input
                type="text"
                id="ticketId"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Enter ticket ID"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <Button 
              onClick={() => verifyTicket(ticketId)}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600"
            >
              Verify Ticket
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-200 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className={`mt-8 rounded-xl border p-6 max-w-2xl mx-auto ${
            result.valid 
              ? "bg-green-900/20 border-green-700" 
              : "bg-red-900/20 border-red-700"
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                result.valid ? "bg-green-500/20" : "bg-red-500/20"
              }`}>
                {result.valid ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
              
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${
                  result.valid ? "text-green-300" : "text-red-300"
                }`}>
                  {result.valid ? "Valid Ticket" : "Invalid Ticket"}
                </h3>
                <p className="text-gray-300 mt-1">{result.message}</p>
                
                {result.ticket && (
                  <div className="mt-4 bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Ticket Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">ID:</div>
                      <div className="text-white">{result.ticket.id.substring(0, 8)}...</div>
                      
                      <div className="text-gray-400">Event:</div>
                      <div className="text-white">{result.ticket.event}</div>
                      
                      <div className="text-gray-400">Type:</div>
                      <div className="text-white capitalize">{result.ticket.purchase_channel?.replace('_', ' ') || 'Online'}</div>
                      
                      {result.ticket.buyer_name && (
                        <>
                          <div className="text-gray-400">Buyer:</div>
                          <div className="text-white">{result.ticket.buyer_name}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}