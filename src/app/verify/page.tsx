"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function TicketScannerPage() {
  const [result, setResult] = useState<{ valid: boolean; message: string; ticket?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);

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

  // Handle QR scan result
  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const data = detectedCodes[0].rawValue;
      if (data) {
        setScanning(false);
        verifyTicket(data);
      }
    }
  };

  // Mark ticket as used
  const markAsUsed = async () => {
    if (!result?.ticket?.id) return;
    
    try {
      const response = await fetch(`/api/tickets/verify/${result.ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ used: true })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setResult({
          ...result,
          ticket: {
            ...result.ticket,
            used: true
          },
          message: "Ticket marked as used successfully"
        });
      } else {
        setError(data.message || "Failed to mark ticket as used");
      }
    } catch (err) {
      setError("Failed to mark ticket as used");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Ticket Verification</h1>
          <p className="text-gray-400">
            Scan QR codes or manually enter ticket IDs to verify authenticity
          </p>
        </div>

        {/* QR Scanner Section */}
        <div className="max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">QR Code Scanner</h2>
            <Button 
              onClick={() => setScanning(!scanning)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {scanning ? "Stop Scanner" : "Start Scanner"}
            </Button>
          </div>
          
          {scanning && (
            <div className="mt-4">
              <Scanner
                onScan={(result) => handleScan(result)}
                onError={(error) => {
                  console.error(error);
                  setError("Failed to scan QR code");
                }}
                constraints={{ facingMode: "environment" }}
                className="w-full"
              />
              <p className="text-gray-400 text-center mt-2">Point your camera at a QR code</p>
            </div>
          )}
          
          {!scanning && (
            <p className="text-gray-400 text-center py-4">
              Click "Start Scanner" to begin scanning QR codes
            </p>
          )}
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
              
              <div className="ml-4 flex-1">
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
                      
                      <div className="text-gray-400">Status:</div>
                      <div className={`font-medium ${result.ticket.used ? "text-red-400" : "text-green-400"}`}>
                        {result.ticket.used ? "Used" : "Valid"}
                      </div>
                    </div>
                    
                    {result.valid && !result.ticket.used && (
                      <div className="mt-4">
                        <Button 
                          onClick={markAsUsed}
                          className="bg-gradient-to-r from-green-600 to-teal-600"
                        >
                          Mark as Used
                        </Button>
                      </div>
                    )}
                    
                    {result.valid && result.ticket.used && (
                      <div className="mt-4 p-2 bg-green-900/30 rounded text-green-300 text-center">
                        Ticket has been marked as used
                      </div>
                    )}
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