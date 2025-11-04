"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function TicketScannerPage() {
  const [result, setResult] = useState<{ valid: boolean; message: string; ticket?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

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
      setShowPopup(true); // Show popup when we have results
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
        return true; // Successfully marked as used
      } else {
        setError(data.message || "Failed to mark ticket as used");
        return false;
      }
    } catch (err) {
      setError("Failed to mark ticket as used");
      console.error(err);
      return false;
    }
  };

  // Close popup and reset state
  const closePopup = () => {
    setShowPopup(false);
    setResult(null);
    setScanning(true); // Automatically restart scanning
  };

  // Mark as used and close popup
  const handleMarkAsUsed = async () => {
    const success = await markAsUsed();
    if (success) {
      // Wait a moment to show the success message, then close the popup
      setTimeout(() => {
        closePopup();
      }, 1500);
    }
    // If not successful, keep the popup open to show the error
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
        <div 
          className={`max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-8 cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${scanning ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setScanning(!scanning)}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">QR Code Scanner</h2>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setScanning(!scanning);
              }}
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
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                </svg>
              </div>
              <p className="text-gray-400">
                Tap anywhere on this card to start scanning QR codes
              </p>
            </div>
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

        {/* Popup Overlay */}
        {showPopup && result && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full rounded-xl border p-6 max-h-[90vh] overflow-y-auto">
              {/* Valid Ticket Popup */}
              {result.valid && result.ticket && !result.ticket.used && (
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700 rounded-xl">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-bold text-green-300">Valid Ticket</h3>
                      <p className="text-green-400">Ready for entry</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-white mb-3 text-lg">Ticket Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white font-mono">{result.ticket.id.substring(0, 8)}...</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Event:</span>
                        <span className="text-white">{result.ticket.event?.title || result.ticket.event}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{result.ticket.purchase_channel?.replace('_', ' ') || 'Online'}</span>
                      </div>
                      
                      {result.ticket.buyer_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Buyer:</span>
                          <span className="text-white">{result.ticket.buyer_name}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400 font-medium">Valid</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleMarkAsUsed}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      Mark as Used
                    </Button>
                    <Button 
                      onClick={closePopup}
                      variant="secondary"
                      className="flex-1 bg-gray-700 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  {/* Success Message After Marking as Used - removed as we now close the popup */}
                </div>
              )}
              
              {/* Used Ticket Popup */}
              {result.valid && result.ticket && result.ticket.used && (
                <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-700 rounded-xl">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-bold text-orange-300">Ticket Already Used</h3>
                      <p className="text-orange-400">Entry not permitted</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-white mb-3 text-lg">Ticket Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white font-mono">{result.ticket.id.substring(0, 8)}...</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Event:</span>
                        <span className="text-white">{result.ticket.event?.title || result.ticket.event}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{result.ticket.purchase_channel?.replace('_', ' ') || 'Online'}</span>
                      </div>
                      
                      {result.ticket.buyer_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Buyer:</span>
                          <span className="text-white">{result.ticket.buyer_name}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-orange-400 font-medium">Already Used</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={closePopup}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600"
                  >
                    Exit
                  </Button>
                </div>
              )}
              
              {/* Invalid Ticket Popup */}
              {!result.valid && (
                <div className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border border-red-700 rounded-xl">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-bold text-red-300">Invalid Ticket</h3>
                      <p className="text-red-400">Entry denied</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <p className="text-red-300">{result.message || "This ticket is invalid or doesn't exist in our system."}</p>
                  </div>
                  
                  <Button 
                    onClick={closePopup}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600"
                  >
                    Exit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Hide the old results section since we're using popups now */}
        {result && !showPopup && (
          <div className="hidden"></div>
        )}
      </div>
    </div>
  );
}