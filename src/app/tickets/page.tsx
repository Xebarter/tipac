"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { generateTicketPDF } from "@/lib/ticketGenerator";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadableTickets, setDownloadableTickets] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch events and ticket types
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          .order('date', { ascending: true });

        if (eventsError) throw eventsError;

        // Fetch ticket types
        const { data: ticketTypesData, error: ticketTypesError } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('is_active', true);

        if (ticketTypesError) throw ticketTypesError;

        setEvents(eventsData || []);
        setTicketTypes(ticketTypesData || []);

        // Check if an event was passed as a query parameter
        const eventIdFromQuery = searchParams?.get('event');
        if (eventIdFromQuery) {
          // Auto-select the first ticket type for this event if available
          const firstTicketType = ticketTypesData?.find(t => t.event_id === eventIdFromQuery);
          if (firstTicketType) {
            setSelectedTicketType(firstTicketType.id);
          }
        } else if (ticketTypesData && ticketTypesData.length > 0) {
          // Auto-select the first ticket type if available
          setSelectedTicketType(ticketTypesData[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load events. Please try again later.");
      }
    };

    fetchData();
  }, [searchParams, isClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getTicketTypeById = (ticketTypeId: string) => {
    return ticketTypes.find(t => t.id === ticketTypeId);
  };

  const getEventById = (eventId: string) => {
    return events.find(event => event.id === eventId);
  };

  const getTicketTypesForEvent = (eventId: string) => {
    return ticketTypes.filter(t => t.event_id === eventId && t.is_active);
  };

  const getTotalPrice = () => {
    const ticketType = getTicketTypeById(selectedTicketType);
    return ticketType ? ticketType.price * quantity : 0;
  };

  const downloadTicket = async (ticket: any) => {
    try {
      // Generate the PDF directly without any delay
      const blob = await generateTicketPDF(ticket);

      // Create object URL and trigger download immediately
      const url = URL.createObjectURL(blob);

      // Use feature-detection: if anchor download is supported, use it; otherwise open in new tab (Safari fallback)
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipac-ticket-${ticket.id.substring(0, 8)}.pdf`;
      a.rel = "noopener noreferrer";

      const supportsDownload = typeof a.download !== "undefined";

      if (supportsDownload) {
        // Append to body and click
        document.body.appendChild(a);
        // Try to trigger click in a microtask to stay within user-initiated gesture context where possible
        await Promise.resolve();
        a.click();
        document.body.removeChild(a);
      } else {
        // Fallback: open the PDF in a new tab (some Safari versions ignore download on blob URLs)
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (!newWindow) {
          // If popup blocked, try setting location.href as last resort
          window.location.href = url;
        }
      }

      // Revoke object URL shortly after to allow the browser to finish the download
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.error("Error generating ticket PDF:", error);
      // Even if PDF generation fails, we still want to show success message
      // The PDF generation can be attempted again manually
      throw error; // Re-throw to be caught by caller for better error handling
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!selectedTicketType) {
        throw new Error("Please select a ticket type");
      }

      if (quantity <= 0) {
        throw new Error("Quantity must be at least 1");
      }

      // Ensure required fields are present
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error("Please fill in all required fields");
      }

      // Normalize and validate phone number: must be exactly 10 digits starting with 07
      const normalizedPhone = formData.phone.replace(/\s+/g, "");
      const phoneRegex = /^07[0-9]{8}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        throw new Error("Phone number must be in the format 07xxxxxxxx (10 digits, starting with 07)");
      }

      const ticketType = getTicketTypeById(selectedTicketType);
      if (!ticketType) {
        throw new Error("Selected ticket type not found");
      }

      // If there's a price, process payment with PesaPal
      const totalPrice = getTotalPrice();
      if (totalPrice > 0) {
        const response = await fetch("/api/tickets/pesapal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: normalizedPhone,
            amount: totalPrice.toString(),
            eventId: ticketType.event_id,
            quantity: quantity
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process payment");
        }

        // Redirect to PesaPal payment page
        window.location.href = data.url;
      } else {
        // For free tickets, create ticket directly
        const { data, error } = await supabase
          .from('tickets')
          .insert([{
            event_id: ticketType.event_id,
            email: formData.email,
            quantity: quantity,
            status: 'confirmed',
            price: ticketType.price,
            purchase_channel: 'online',
            buyer_name: `${formData.firstName} ${formData.lastName}`,
            buyer_phone: normalizedPhone
          }])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const event = getEventById(ticketType.event_id);

          // supabase may return an array of created rows (when multiple inserted) or a single row inside data[0]
          const createdRows = Array.isArray(data) ? data : [data[0]];

          // Build ticket objects to download
          const ticketsToDownload = createdRows.map((row: any) => ({
            id: row.id,
            event: {
              title: event?.title || "",
              date: event?.date || "",
              location: event?.location || ""
            },
            buyer_name: `${formData.firstName} ${formData.lastName}`,
            buyer_phone: formData.phone,
            purchase_channel: 'online'
          }));

          // Attempt to download each ticket sequentially with a small delay to avoid browser throttling
          let allDownloadsSucceeded = true;
          for (let i = 0; i < ticketsToDownload.length; i++) {
            try {
              // Small delay between downloads to reduce chance of browser blocking
              if (i > 0) await new Promise((res) => setTimeout(res, 500));
              await downloadTicket(ticketsToDownload[i]);
            } catch (downloadError) {
              console.error('Download failed for ticket', ticketsToDownload[i].id, downloadError);
              allDownloadsSucceeded = false;
            }
          }


          if (allDownloadsSucceeded) {
            setSuccess(`Thank you! Your free ticket for ${event?.title} has been confirmed. The ticket should be downloading now. Check your downloads folder.`);
          } else {
            setSuccess(`Thank you! Your free ticket for ${event?.title} has been confirmed. There was an issue automatically downloading one or more tickets — you can download them manually below or from your confirmation email.`);
          }

          // Keep the tickets available for manual download in the UI
          setDownloadableTickets(ticketsToDownload);

          // Reset form
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          });
          setQuantity(1);
        }
      }
    } catch (err: any) {
      console.error("Ticket purchase error:", err);
      let errorMessage = "Failed to process ticket purchase";

      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (Object.keys(err).length === 0) {
          // Handle empty error object case
          errorMessage = "An unexpected error occurred. Please try again.";
        } else {
          // Try to stringify non-empty objects
          try {
            errorMessage = JSON.stringify(err);
          } catch (stringifyErr) {
            errorMessage = "An unknown error occurred";
          }
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until client-side code is ready
  if (!isClient) {
    return null; // Loading component will be shown instead
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Animated gradients */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Event Tickets
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Select an event and ticket type to purchase your tickets for TIPAC performances
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Events List with Ticket Types */}
          <motion.div
            className="lg:col-span-2 backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Available Events & Ticket Types</h3>

            {events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No events available at the moment.</p>
                <Link href="/events">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                    View All Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {events.map((event) => {
                  const eventTicketTypes = getTicketTypesForEvent(event.id);

                  return (
                    <div key={event.id} className="border border-gray-700 rounded-xl bg-gray-800/20">
                      <div className="p-4 border-b border-gray-700">
                        <h4 className="font-bold text-white text-lg">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          <span className="flex items-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.time}
                          </span>
                          <span className="flex items-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-400 text-sm mb-4">{event.description}</p>

                        {eventTicketTypes.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="font-semibold text-gray-300">Available Ticket Types:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {eventTicketTypes.map((ticketType) => (
                                <motion.div
                                  key={ticketType.id}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedTicketType === ticketType.id
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-gray-600 hover:border-gray-500 bg-gray-800/30"
                                    }`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedTicketType(ticketType.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h6 className="font-medium text-white">{ticketType.name}</h6>
                                      <p className="text-sm text-gray-400">
                                        {ticketType.price > 0 ? `UGX ${ticketType.price.toLocaleString()}` : "Free"}
                                      </p>
                                    </div>
                                    {selectedTicketType === ticketType.id && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No ticket types available for this event.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Purchase Form */}
          <motion.div
            className="backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Ticket Information</h3>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-300 mb-6">{success}</p>
                {downloadableTickets && downloadableTickets.length > 0 && (
                  <div className="mb-4">
                    <Button
                      onClick={async () => {
                        // Attempt to re-download all tickets sequentially
                        for (let i = 0; i < downloadableTickets.length; i++) {
                          try {
                            if (i > 0) await new Promise((res) => setTimeout(res, 500));
                            await downloadTicket(downloadableTickets[i]);
                          } catch (err) {
                            console.error('Manual download failed for', downloadableTickets[i].id, err);
                          }
                        }
                      }}
                      className="mb-3 bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      Download Tickets
                    </Button>

                    <div className="text-sm text-gray-400 mt-2 space-y-2">
                      {downloadableTickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-center gap-3">
                          <span className="font-mono text-sm text-gray-200">{t.id.substring(0, 8)}</span>
                          <Button
                            onClick={() => downloadTicket(t)}
                            className="text-sm px-3 py-1 bg-gray-800/60"
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setSuccess(null);
                    setDownloadableTickets([]);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Get More Tickets
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="firstName" className="text-gray-200 mb-2 block">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-gray-200 mb-2 block">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-200 mb-2 block">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-200 mb-2 block">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="07xxxxxxxx"
                    pattern="^07[0-9]{8}$"
                    maxLength={10}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: 07xxxxxxxx (10 digits)</p>
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-gray-200 mb-2 block">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="quantity"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-200">Ticket Price:</p>
                    </div>
                    <p className="font-medium text-white">
                      UGX {getTicketTypeById(selectedTicketType)?.price?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-200">Quantity:</p>
                    </div>
                    <p className="font-medium text-white">
                      {quantity}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <div>
                      <p className="text-gray-200">Total:</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      UGX {getTotalPrice().toLocaleString()}
                    </p>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 rounded-lg group relative overflow-hidden"
                    disabled={loading || !selectedTicketType}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {loading ? "Processing..." : getTotalPrice() > 0 ? "Proceed to Payment" : "Get Free Tickets"}
                  </Button>
                </motion.div>

                <p className="text-xs text-gray-500 text-center">
                  By purchasing tickets, you agree to our terms and conditions
                </p>
              </form>
            )}
          </motion.div>
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link href="/events">
            <Button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 text-base">
              View All Events
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}