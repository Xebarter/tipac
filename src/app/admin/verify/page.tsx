"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function TicketScannerPage() {
  const [result, setResult] = useState<{ valid: boolean; message: string; ticket?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [recentlyMarkedUsedId, setRecentlyMarkedUsedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const extractTicketId = (rawValue: string) => {
    if (!rawValue) {
      return { error: "Please enter a ticket ID" } as const;
    }

    let value = rawValue.trim();
    if (!value) {
      return { error: "Please enter a ticket ID" } as const;
    }

    try {
      value = decodeURIComponent(value);
    } catch (err) {
      // Ignore decode errors and fall back to raw value
    }

    const trimmed = value.trim();

    const tryParseJson = (input: string) => {
      try {
        return JSON.parse(input);
      } catch (err) {
        return null;
      }
    };

    const parsedJson = trimmed.startsWith("{") && trimmed.endsWith("}") ? tryParseJson(trimmed) : null;

    if (parsedJson && typeof parsedJson === "object") {
      const ticketIdFromJson = (parsedJson as Record<string, unknown>).ticket_id ?? (parsedJson as Record<string, unknown>).id;
      if (typeof ticketIdFromJson === "string" && ticketIdFromJson.trim()) {
        return { ticketId: ticketIdFromJson.trim() } as const;
      }
    }

    if (trimmed.includes("ticket_id")) {
      const match = trimmed.match(/[\"']?ticket[_-]?id[\"'\s:=]+([0-9a-fA-F-]{8,})/i);
      if (match && match[1]) {
        return { ticketId: match[1] } as const;
      }

      try {
        const params = new URLSearchParams(trimmed);
        const fromParams = params.get("ticket_id");
        if (fromParams && fromParams.trim()) {
          return { ticketId: fromParams.trim() } as const;
        }
      } catch (err) {
        // Ignore query parsing issues
      }
    }

    const sanitized = trimmed.replace(/^"|"$/g, "");
    if (!sanitized) {
      return { error: "Unable to extract ticket ID from QR data" } as const;
    }

    return { ticketId: sanitized } as const;
  };

  // Verify ticket with the API
  const verifyTicket = async (id: string) => {
    try {
      const { ticketId: normalizedId, error: extractionError } = extractTicketId(id);

      if (extractionError) {
        setError(extractionError);
        return;
      }

      setSuccessMessage(null);

      const response = await fetch(`/api/tickets/verify/${encodeURIComponent(normalizedId)}`);
      const data = await response.json();
      setResult(data);
      setError(null);
      setShowPopup(true); // Show popup when we have results
      setRecentlyMarkedUsedId(null);
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
        // Immediately update the UI to show the ticket as used
        setResult({
          ...result,
          ticket: {
            ...result.ticket,
            used: true
          },
          message: "Ticket marked as used successfully"
        });
        setRecentlyMarkedUsedId(result.ticket.id);
        setSuccessMessage("Ticket marked as used successfully");
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => {
          setSuccessMessage(null);
          successTimeoutRef.current = null;
        }, 4000);
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
    setRecentlyMarkedUsedId(null);
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
    <section className="py-8 md:py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Decorative elements */}
      <div className="hidden md:block absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="hidden md:block absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="hidden md:block absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow">
              Admin
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 md:mb-4 bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
            Ticket Verification
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Scan QR codes or manually enter ticket IDs to verify authenticity
          </p>
        </div>

        {successMessage && (
          <div className="max-w-2xl mx-auto mb-6 md:mb-8">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-center text-sm md:text-base">
              {successMessage}
            </div>
          </div>
        )}

        {/* QR Scanner Section */}
        <div 
          className={`max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 md:p-6 mb-6 md:mb-8 cursor-pointer transition-all duration-200 hover:shadow-lg ${scanning ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => setScanning(!scanning)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">QR Code Scanner</h2>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setScanning(!scanning);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-sm md:text-base"
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
              <p className="text-gray-600 text-center mt-2 text-sm md:text-base">Point your camera at a QR code</p>
            </div>
          )}
          
          {!scanning && (
            <div className="text-center py-6 md:py-8">
              <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-inner">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                </svg>
              </div>
              <p className="text-gray-600 text-sm md:text-base">
                Tap anywhere on this card to start scanning QR codes
              </p>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Manual Verification</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3 md:mb-4">
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
              className="flex-grow px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 text-sm md:text-base"
            />
            <Button 
              onClick={() => verifyTicket(ticketId)} 
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-sm md:text-base"
            >
              Verify
            </Button>
          </div>
          
          <p className="text-gray-600 text-xs md:text-sm">
            Enter a ticket ID manually if you can't scan the QR code
          </p>
        </div>

        {/* Results Popup */}
        {showPopup && result && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    {result.valid ? "Valid Ticket" : "Invalid Ticket"}
                  </h3>
                  <button 
                    onClick={closePopup}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {result.valid && result.ticket ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="font-bold text-gray-900 mb-2 text-base md:text-lg">{result.ticket.event_title}</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Ticket ID:</span> {result.ticket.id.substring(0, 8)}...</p>
                        <p><span className="font-medium">Type:</span> {result.ticket.ticket_type_name}</p>
                        <p><span className="font-medium">Batch:</span> {result.ticket.batch_name}</p>
                        <p><span className="font-medium">Purchased:</span> {new Date(result.ticket.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${
                      result.ticket.used 
                        ? "bg-rose-50 border border-rose-200" 
                        : "bg-green-50 border border-green-200"
                    }`}>
                      <div className="flex items-center">
                        {result.ticket.used ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-rose-700 text-sm md:text-base">Already Used</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-green-700 text-sm md:text-base">Valid Ticket</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!result.ticket.used && (
                      <Button 
                        onClick={handleMarkAsUsed}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-sm md:text-base"
                      >
                        Mark as Used
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm md:text-base">{result.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mt-6 md:mt-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
              <p className="text-red-700 text-center text-sm md:text-base">{error}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}