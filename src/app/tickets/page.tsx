"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { generateTicketPDF, generateMultiTicketPDF } from "@/lib/ticketGenerator";

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

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface TicketFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  success: string | null;
  onSubmit: (e: React.FormEvent) => void;
  getTotalPrice: () => number;
  getTicketTypeById: (id: string) => TicketType | undefined;
  loading: boolean;
  selectedTicketType: string;
  downloadableTickets: any[];
  onDownloadTicket: (ticket: any, ticketNumber?: number, totalTickets?: number) => Promise<void>;
  onDownloadAll: () => Promise<void>;
  onClose: () => void;
  quantity: number;
}

const TicketForm: React.FC<TicketFormProps> = ({
  formData,
  onInputChange,
  onQuantityChange,
  error,
  success,
  onSubmit,
  getTotalPrice,
  getTicketTypeById,
  loading,
  selectedTicketType,
  downloadableTickets,
  onDownloadTicket,
  onDownloadAll,
  onClose,
  quantity,
}) => (
  <>
    {success ? (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <p className="text-gray-700 mb-6 text-sm">{success}</p>
        {downloadableTickets && downloadableTickets.length > 0 && (
          <div className="mb-4">
            <Button
              onClick={onDownloadAll}
              className="mb-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              Download All Tickets
            </Button>

            <div className="text-xs text-gray-600 mt-4 mb-2 font-medium">Your Tickets:</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {downloadableTickets.map((t, index) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">#{t.id.substring(0, 8)}</div>
                    <div className="text-xs text-gray-600">{t.event.title}</div>
                  </div>
                  <Button
                    onClick={() => onDownloadTicket(t, index + 1, downloadableTickets.length)}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          Get More Tickets
        </Button>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-gray-700 mb-2 block text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              placeholder="John"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl text-base shadow-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-gray-700 mb-2 block text-sm font-medium">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              placeholder="Doe"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl text-base shadow-sm"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-700 mb-2 block text-sm font-medium">
            Email Address
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="john.doe@example.com"
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl text-base shadow-sm"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-gray-700 mb-2 block text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            type="tel"
            inputMode="numeric"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            placeholder="07xxxxxxxx"
            pattern="^07[0-9]{8}$"
            maxLength={10}
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl text-base shadow-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: 07xxxxxxxx (10 digits)</p>
        </div>

        <div>
          <Label htmlFor="quantity" className="text-gray-700 mb-2 block text-sm font-medium">
            Quantity <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            id="quantity"
            min="1"
            max="10"
            value={quantity}
            onChange={onQuantityChange}
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl text-base shadow-sm"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-3 text-sm">
            <p className="text-gray-600">Ticket Type:</p>
            <p className="font-medium text-gray-900">
              {getTicketTypeById(selectedTicketType)?.name || "Not selected"}
            </p>
          </div>

          <div className="flex justify-between items-center mb-3 text-sm">
            <p className="text-gray-600">Unit Price:</p>
            <p className="font-medium text-gray-900">
              UGX {getTicketTypeById(selectedTicketType)?.price?.toLocaleString() || 0}
            </p>
          </div>

          <div className="flex justify-between items-center mb-3 text-sm">
            <p className="text-gray-600">Quantity:</p>
            <p className="font-medium text-gray-900">
              {quantity}
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-purple-200 text-base">
            <p className="text-gray-800 font-bold">Total:</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            className="w-full h-14 text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 rounded-xl group relative overflow-hidden disabled:opacity-50"
            disabled={loading || !selectedTicketType}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : getTotalPrice() > 0 ? (
              "Proceed to Payment"
            ) : (
              "Get Free Tickets"
            )}
          </Button>
        </motion.div>

        <p className="text-xs text-gray-500 text-center">
          By purchasing tickets, you agree to our terms and conditions
        </p>
      </form>
    )}
  </>
);

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
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
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll to selected event when it changes
  useEffect(() => {
    if (!isClient) return;

    const eventIdFromQuery = searchParams?.get('event');
    if (eventIdFromQuery) {
      // Wait a bit for the DOM to be ready
      setTimeout(() => {
        const element = document.getElementById(`event-${eventIdFromQuery}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [searchParams, isClient]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)));
  }, []);

  const getTicketTypeById = useCallback((ticketTypeId: string) => {
    return ticketTypes.find(t => t.id === ticketTypeId);
  }, [ticketTypes]);

  const getEventById = useCallback((eventId: string) => {
    return events.find(event => event.id === eventId);
  }, [events]);

  const getTicketTypesForEvent = useCallback((eventId: string) => {
    return ticketTypes.filter(t => t.event_id === eventId && t.is_active);
  }, [ticketTypes]);

  const getTotalPrice = useCallback(() => {
    const ticketType = getTicketTypeById(selectedTicketType);
    return ticketType ? ticketType.price * quantity : 0;
  }, [selectedTicketType, quantity, getTicketTypeById]);

  const downloadTicket = useCallback(async (ticket: any, ticketNumber?: number, totalTickets?: number) => {
    try {
      // Add ticket number information to ticket data if provided
      const ticketData = ticketNumber !== undefined && totalTickets !== undefined
        ? { ...ticket, ticketNumber, totalTickets }
        : ticket;

      // Generate the PDF directly without any delay
      const blob = await generateTicketPDF(ticketData);

      // Create object URL and trigger download immediately
      const url = URL.createObjectURL(blob);

      // Use feature-detection: if anchor download is supported, use it; otherwise open in new tab (Safari fallback)
      const a = document.createElement("a");
      const ticketLabel = ticketNumber !== undefined ? `ticket-${ticketNumber}` : `ticket-${ticket.id.substring(0, 8)}`;
      a.href = url;
      a.download = `tipac-${ticketLabel}.pdf`;
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
  }, []);

  // New function to download all tickets in a single PDF
  const downloadAllTickets = useCallback(async (tickets: any[]) => {
    try {
      // Generate a single PDF with all tickets
      const blob = await generateMultiTicketPDF(tickets);

      // Create object URL and trigger download immediately
      const url = URL.createObjectURL(blob);

      // Use feature-detection: if anchor download is supported, use it; otherwise open in new tab (Safari fallback)
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipac-${tickets.length}-tickets.pdf`;
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
      console.error("Error generating multi-ticket PDF:", error);
      throw error;
    }
  }, []);

  const onDownloadAll = useCallback(async () => {
    // Download all tickets in a single PDF
    try {
      await downloadAllTickets(downloadableTickets);
    } catch (err) {
      console.error('Manual download failed', err);
      // Fallback to individual downloads
      for (let i = 0; i < downloadableTickets.length; i++) {
        try {
          if (i > 0) await new Promise((res) => setTimeout(res, 500));
          await downloadTicket(downloadableTickets[i], i + 1, downloadableTickets.length);
        } catch (err) {
          console.error('Manual download failed for', downloadableTickets[i].id, err);
        }
      }
    }
  }, [downloadableTickets, downloadTicket, downloadAllTickets]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        // For free tickets, create tickets directly (one record per ticket)
        const ticketsToInsert = Array(quantity).fill(null).map(() => ({
          event_id: ticketType.event_id,
          email: formData.email,
          quantity: 1, // Each record represents one ticket
          status: 'confirmed',
          price: ticketType.price,
          purchase_channel: 'online',
          buyer_name: `${formData.firstName} ${formData.lastName}`,
          buyer_phone: normalizedPhone
        }));

        const { data, error } = await supabase
          .from('tickets')
          .insert(ticketsToInsert)
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const event = getEventById(ticketType.event_id);

          // supabase may return an array of created rows (when multiple inserted) or a single row inside data[0]
          const createdRows = Array.isArray(data) ? data : [data[0]];

          // Build ticket objects to download
          const ticketsToDownload = createdRows.map((row: any, index: number) => ({
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
          try {
            // Try to download all tickets in a single PDF
            await downloadAllTickets(ticketsToDownload);
          } catch (downloadError) {
            console.error('Multi-ticket download failed, falling back to individual downloads', downloadError);
            // Fallback to individual downloads
            for (let i = 0; i < ticketsToDownload.length; i++) {
              try {
                // Small delay between downloads to reduce chance of browser blocking
                if (i > 0) await new Promise((res) => setTimeout(res, 500));
                await downloadTicket(ticketsToDownload[i], i + 1, ticketsToDownload.length);
              } catch (downloadError) {
                console.error('Download failed for ticket', ticketsToDownload[i].id, downloadError);
                allDownloadsSucceeded = false;
              }
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
  }, [selectedTicketType, quantity, formData, getTicketTypeById, getEventById, getTotalPrice, downloadTicket]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (success) {
      setSuccess(null);
      setDownloadableTickets([]);
    }
  }, [success]);

  // Show loading state until client-side code is ready
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
              Get Your Tickets
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
            Event Tickets
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Select an event and ticket type to purchase your tickets for TIPAC performances
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {/* Events List with Ticket Types */}
          <motion.div
            className="lg:col-span-2 backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl border border-white/30 p-5 sm:p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Available Events</h2>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow">
                {events.length} Events
              </div>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-6">No events available at the moment.</p>
                <Link href="/events">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg px-6 py-2.5">
                    View All Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {events.map((event, index) => {
                  const eventTicketTypes = getTicketTypesForEvent(event.id);
                  const isSelected = searchParams?.get('event') === event.id;
                  
                  // Define color schemes for events
                  const colorSchemes = [
                    { from: 'from-purple-100/50', to: 'to-pink-100/50', border: 'border-purple-500/30', ring: 'ring-purple-500/30', text: 'text-purple-700' },
                    { from: 'from-blue-100/50', to: 'to-cyan-100/50', border: 'border-blue-500/30', ring: 'ring-blue-500/30', text: 'text-blue-700' },
                    { from: 'from-green-100/50', to: 'to-emerald-100/50', border: 'border-green-500/30', ring: 'ring-green-500/30', text: 'text-green-700' },
                    { from: 'from-yellow-100/50', to: 'to-amber-100/50', border: 'border-yellow-500/30', ring: 'ring-yellow-500/30', text: 'text-yellow-700' },
                    { from: 'from-rose-100/50', to: 'to-pink-100/50', border: 'border-rose-500/30', ring: 'ring-rose-500/30', text: 'text-rose-700' },
                    { from: 'from-indigo-100/50', to: 'to-violet-100/50', border: 'border-indigo-500/30', ring: 'ring-indigo-500/30', text: 'text-indigo-700' },
                  ];
                  
                  // Get color scheme based on event index
                  const colorScheme = colorSchemes[index % colorSchemes.length];

                  return (
                    <motion.div
                      id={`event-${event.id}`}
                      key={event.id}
                      className={`border border-gray-200 rounded-2xl bg-white/70 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden backdrop-blur-sm ${isSelected ? `ring-4 ${colorScheme.ring} -m-1 relative` : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      animate={isSelected ? {
                        scale: [1, 1.02, 1],
                        transition: { duration: 0.5 }
                      } : {}}
                    >
                      <div
                        className={`p-5 sm:p-6 border-b border-gray-100 ${isSelected ? `bg-gradient-to-r ${colorScheme.from} ${colorScheme.to}` : 'bg-gradient-to-r from-purple-50/50 to-pink-50/50'}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className={`font-bold text-gray-900 text-lg sm:text-xl ${isSelected ? colorScheme.text : ''}`}>
                            {event.title}
                          </h3>
                          <div className="flex gap-2">
                            {isSelected && (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow">
                                Selected
                              </span>
                            )}
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow">
                              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.time}
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <p className="text-gray-600 text-sm mb-5 line-clamp-2">{event.description}</p>

                        {eventTicketTypes.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                              </svg>
                              Available Ticket Types
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {eventTicketTypes.map((ticketType) => (
                                <motion.div
                                  key={ticketType.id}
                                  className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedTicketType === ticketType.id
                                    ? "border-purple-500 bg-gradient-to-br from-purple-50/70 via-pink-50/70 to-rose-50/70 shadow-md ring-2 ring-purple-500/20"
                                    : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:bg-gradient-to-br hover:from-purple-50/30 hover:to-pink-50/30"
                                    }`}
                                  whileHover={{ y: -3, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setSelectedTicketType(ticketType.id);
                                    if (isMobile) {
                                      setIsModalOpen(true);
                                    }
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="relative flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg ring-1 ring-white/20 ${ticketType.price > 0
                                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500'
                                        : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                                        }`}>
                                        {ticketType.price > 0 ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">{ticketType.name}</h5>
                                        <p className="text-sm text-gray-600 flex items-center">
                                          {ticketType.price > 0 ? (
                                            <>
                                              <span className="font-medium text-purple-600">UGX {ticketType.price.toLocaleString()}</span>
                                            </>
                                          ) : (
                                            <span className="font-medium text-emerald-600">Free</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    {selectedTicketType === ticketType.id && (
                                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 shadow-lg ring-2 ring-purple-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 italic text-sm flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              No ticket types available for this event
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Purchase Form - Hidden on mobile */}
          <motion.div
            className="hidden lg:block backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl border border-white/30 p-5 sm:p-6 relative overflow-hidden sticky top-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ticket Information</h2>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-9 h-9 rounded-lg flex items-center justify-center shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 border border-purple-100 shadow-sm">
              <div className="flex items-start">
                <div className="mr-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Fill in your details to receive your tickets. All fields marked with <span className="text-red-500">*</span> are required.
                </p>
              </div>
            </div>

            <TicketForm
              formData={formData}
              onInputChange={handleInputChange}
              onQuantityChange={handleQuantityChange}
              error={error}
              success={success}
              onSubmit={handleSubmit}
              getTotalPrice={getTotalPrice}
              getTicketTypeById={getTicketTypeById}
              loading={loading}
              selectedTicketType={selectedTicketType}
              downloadableTickets={downloadableTickets}
              onDownloadTicket={downloadTicket}
              onDownloadAll={onDownloadAll}
              onClose={closeModal}
              quantity={quantity}
            />
          </motion.div>
        </div>

        {/* Mobile Modal */}
        {isMobile && isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col absolute bottom-0"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 pb-0 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Ticket Information</h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <TicketForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onQuantityChange={handleQuantityChange}
                  error={error}
                  success={success}
                  onSubmit={handleSubmit}
                  getTotalPrice={getTotalPrice}
                  getTicketTypeById={getTicketTypeById}
                  loading={loading}
                  selectedTicketType={selectedTicketType}
                  downloadableTickets={downloadableTickets}
                  onDownloadTicket={downloadTicket}
                  onDownloadAll={onDownloadAll}
                  onClose={closeModal}
                  quantity={quantity}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="text-center mt-8 sm:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 px-6 py-3 text-base rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return to Home Page
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}