"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { generateTicketPDF, generateMultiTicketPDF } from "@/lib/ticketGenerator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { splitFullNameForPesapal } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image_url?: string | null;
}

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
}

function parsedTicketQuantity(digits: string): number {
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Distinct card styles so multiple ticket types per event are easy to tell apart */
const TICKET_TYPE_VARIANTS = [
  {
    accent: "bg-rose-500",
    accentSoft: "bg-rose-100 text-rose-800",
    border: "border-rose-200",
    borderHover: "hover:border-rose-400",
    cardBg: "bg-gradient-to-br from-rose-50/90 to-white",
    selectedRing: "ring-rose-500/35",
    selectedBorder: "border-rose-500",
    priceClass: "text-rose-700",
    stripe: "from-rose-500 to-pink-600",
  },
  {
    accent: "bg-violet-500",
    accentSoft: "bg-violet-100 text-violet-800",
    border: "border-violet-200",
    borderHover: "hover:border-violet-400",
    cardBg: "bg-gradient-to-br from-violet-50/90 to-white",
    selectedRing: "ring-violet-500/35",
    selectedBorder: "border-violet-500",
    priceClass: "text-violet-700",
    stripe: "from-violet-500 to-purple-600",
  },
  {
    accent: "bg-amber-500",
    accentSoft: "bg-amber-100 text-amber-900",
    border: "border-amber-200",
    borderHover: "hover:border-amber-400",
    cardBg: "bg-gradient-to-br from-amber-50/90 to-white",
    selectedRing: "ring-amber-500/35",
    selectedBorder: "border-amber-500",
    priceClass: "text-amber-800",
    stripe: "from-amber-500 to-orange-600",
  },
  {
    accent: "bg-sky-500",
    accentSoft: "bg-sky-100 text-sky-900",
    border: "border-sky-200",
    borderHover: "hover:border-sky-400",
    cardBg: "bg-gradient-to-br from-sky-50/90 to-white",
    selectedRing: "ring-sky-500/35",
    selectedBorder: "border-sky-500",
    priceClass: "text-sky-800",
    stripe: "from-sky-500 to-cyan-600",
  },
  {
    accent: "bg-emerald-500",
    accentSoft: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
    borderHover: "hover:border-emerald-400",
    cardBg: "bg-gradient-to-br from-emerald-50/90 to-white",
    selectedRing: "ring-emerald-500/35",
    selectedBorder: "border-emerald-500",
    priceClass: "text-emerald-800",
    stripe: "from-emerald-500 to-teal-600",
  },
] as const;

interface TicketFormProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuantityBlur: () => void;
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
  quantityInput: string;
  quantity: number;
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = (navigator as any).platform || "";
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;

  // iPadOS 13+ can report "MacIntel" but has touch points.
  const iOSByUA = /iPad|iPhone|iPod/i.test(ua);
  const iPadOSDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;
  return iOSByUA || iPadOSDesktopMode;
}

const TicketForm: React.FC<TicketFormProps> = ({
  formData,
  onInputChange,
  onQuantityChange,
  onQuantityBlur,
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
  quantityInput,
  quantity,
}) => (
  <>
    {success ? (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <p className="text-gray-700 mb-6 text-sm">{success}</p>
        {downloadableTickets && downloadableTickets.length > 0 && (
          <div className="mb-4">
            <Button
              onClick={onDownloadAll}
              className="mb-3 w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg"
            >
              Download All Tickets
            </Button>

            <div className="text-xs text-gray-600 mt-4 mb-2 font-medium">Your Tickets:</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {downloadableTickets.map((t, index) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-red-50 to-purple-50 rounded-lg border border-red-100">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">#{t.id.substring(0, 8)}</div>
                    <div className="text-xs text-gray-600">{t.event.title}</div>
                  </div>
                  <Button
                    onClick={() => onDownloadTicket(t, index + 1, downloadableTickets.length)}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white rounded-lg shadow"
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
          className="w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg"
        >
          Get More Tickets
        </Button>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <Label htmlFor="fullName" className="text-gray-700 mb-2 block text-sm font-medium">
            Full name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={onInputChange}
            placeholder="John Doe"
            className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-700 mb-2 block text-sm font-medium">
            Email Address
            {getTotalPrice() > 0 ? (
              <span className="text-red-500"> *</span>
            ) : (
              <span className="text-gray-500 font-normal"> (optional for free tickets)</span>
            )}
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="john.doe@example.com"
            className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            required={getTotalPrice() > 0}
            autoComplete="email"
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
            className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Format: 07xxxxxxxx (10 digits)</p>
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
            step="1"
            value={quantityInput}
            onChange={onQuantityChange}
            onBlur={onQuantityBlur}
            className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
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

        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-purple-50 p-4 shadow-sm sm:p-5">
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
              {quantity > 0 ? quantity : quantityInput === "" ? "—" : quantityInput}
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-red-200 text-base">
            <p className="text-gray-800 font-bold">Total:</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-700 bg-clip-text text-transparent">
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
            className="group relative h-14 min-h-[52px] w-full touch-manipulation rounded-xl bg-gradient-to-r from-red-600 to-purple-700 text-base text-white shadow-lg transition-all duration-300 hover:from-red-700 hover:to-purple-800 hover:shadow-xl disabled:opacity-50"
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
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = useMemo(() => parsedTicketQuantity(quantityInput), [quantityInput]);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
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
    setQuantityInput(e.target.value.replace(/\D/g, ""));
  }, []);

  const handleQuantityBlur = useCallback(() => {
    setQuantityInput((prev) => {
      const n = parsedTicketQuantity(prev);
      return n > 0 ? String(n) : "1";
    });
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

  const downloadTicket = useCallback(async (ticket: any, ticketNumber?: number, totalTickets?: number, preOpenedWindow?: Window | null) => {
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

      if (preOpenedWindow && !preOpenedWindow.closed) {
        preOpenedWindow.location.href = url;
      } else if (isIOSDevice()) {
        // iOS browsers often block programmatic "downloads"; navigating works reliably.
        window.location.href = url;
      } else if (supportsDownload) {
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
  const downloadAllTickets = useCallback(async (tickets: any[], preOpenedWindow?: Window | null) => {
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

      if (preOpenedWindow && !preOpenedWindow.closed) {
        preOpenedWindow.location.href = url;
      } else if (isIOSDevice()) {
        window.location.href = url;
      } else if (supportsDownload) {
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

    // iOS Safari blocks popups opened after async work.
    // Pre-open a tab during the user gesture, then navigate it once the PDF blob is ready.
    const preOpenedDownloadWindow =
      isIOSDevice() ? window.open("about:blank", "_blank", "noopener,noreferrer") : null;

    try {
      // Validation
      if (!selectedTicketType) {
        throw new Error("Please select a ticket type");
      }

      if (quantity <= 0) {
        throw new Error("Quantity must be at least 1");
      }

      if (!formData.fullName?.trim() || !formData.phone) {
        throw new Error("Please enter your full name and phone number");
      }

      const { firstName, lastName } = splitFullNameForPesapal(formData.fullName);
      if (!firstName) {
        throw new Error("Please enter your full name");
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
        const email = formData.email?.trim();
        if (!email) {
          throw new Error("Email is required for paid tickets (for your receipt and payment)");
        }
        const response = await fetch("/api/tickets/pesapal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
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
        const displayName = formData.fullName.trim();
        // For free tickets, create tickets directly (one record per ticket)
        const ticketsToInsert = Array(quantity).fill(null).map(() => ({
          event_id: ticketType.event_id,
          email: formData.email?.trim() || null,
          quantity: 1, // Each record represents one ticket
          status: 'confirmed',
          price: ticketType.price,
          purchase_channel: 'online',
          buyer_name: displayName,
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
            buyer_name: displayName,
            buyer_phone: formData.phone,
            purchase_channel: 'online'
          }));

          // Attempt to download each ticket sequentially with a small delay to avoid browser throttling
          let allDownloadsSucceeded = true;
          try {
            // Try to download all tickets in a single PDF
            await downloadAllTickets(ticketsToDownload, preOpenedDownloadWindow);
          } catch (downloadError) {
            console.error('Multi-ticket download failed, falling back to individual downloads', downloadError);
            // Fallback to individual downloads (note: iOS browsers won't reliably auto-download multiple files)
            if (isIOSDevice() && ticketsToDownload.length > 1) {
              allDownloadsSucceeded = false;
            } else {
              for (let i = 0; i < ticketsToDownload.length; i++) {
                try {
                  // Small delay between downloads to reduce chance of browser blocking
                  if (i > 0) await new Promise((res) => setTimeout(res, 500));
                  await downloadTicket(
                    ticketsToDownload[i],
                    i + 1,
                    ticketsToDownload.length,
                    i === 0 ? preOpenedDownloadWindow : null
                  );
                } catch (downloadError) {
                  console.error('Download failed for ticket', ticketsToDownload[i].id, downloadError);
                  allDownloadsSucceeded = false;
                }
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
            fullName: "",
            email: "",
            phone: "",
          });
          setQuantityInput("1");
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
  }, [selectedTicketType, quantity, formData, getTicketTypeById, getEventById, getTotalPrice, downloadTicket, downloadAllTickets]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-purple-50 to-red-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="py-6 sm:py-12 bg-gradient-to-br from-red-50 via-purple-50 to-red-100 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none" />

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-red-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-red-400/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-red-300/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />

        <div
          className={`container mx-auto px-4 sm:px-6 relative z-10 ${
            isMobile && selectedTicketType && !isModalOpen && !success ? "pb-28 sm:pb-28" : ""
          }`}
        >
          <motion.div
            className="text-center mb-6 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-red-600 to-purple-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                Get Your Tickets
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 bg-clip-text bg-gradient-to-r from-red-600 via-purple-600 to-red-800 px-1">
              Event Tickets
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-1">
              Pick an event, then choose a ticket type — each type has its own color. Selecting a type opens checkout in a dialog.
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl">
            {/* Events List with Ticket Types */}
            <motion.div
              className="backdrop-blur-sm bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl border border-white/30 p-4 sm:p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Available Events</h2>
                <div className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow">
                  {events.length} Events
                </div>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-6">No events available at the moment.</p>
                  <Link href="/events">
                    <Button className="bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg px-6 py-2.5">
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
                      { from: 'from-red-100/50', to: 'to-purple-100/50', border: 'border-red-500/30', ring: 'ring-red-500/30', text: 'text-red-700' },
                      { from: 'from-purple-100/50', to: 'to-red-100/50', border: 'border-purple-500/30', ring: 'ring-purple-500/30', text: 'text-purple-700' },
                      { from: 'from-red-50/50', to: 'to-purple-50/50', border: 'border-red-300/30', ring: 'ring-red-300/30', text: 'text-red-600' },
                      { from: 'from-purple-50/50', to: 'to-red-50/50', border: 'border-purple-300/30', ring: 'ring-purple-300/30', text: 'text-purple-600' },
                      { from: 'from-red-100/30', to: 'to-purple-100/30', border: 'border-red-400/30', ring: 'ring-red-400/30', text: 'text-red-800' },
                      { from: 'from-purple-100/30', to: 'to-red-100/30', border: 'border-purple-400/30', ring: 'ring-purple-400/30', text: 'text-purple-800' },
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
                          className={`p-4 sm:p-6 border-b border-gray-100 ${isSelected ? `bg-gradient-to-r ${colorScheme.from} ${colorScheme.to}` : 'bg-gradient-to-r from-red-50/50 to-purple-50/50'}`}
                        >
                          {event.image_url ? (
                            <div className="rounded-xl overflow-hidden mb-3 sm:mb-4 h-32 sm:h-40">
                              <img 
                                src={event.image_url} 
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="rounded-xl overflow-hidden mb-3 sm:mb-4 h-32 sm:h-40 bg-gradient-to-r from-red-500 to-purple-600 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className={`font-bold text-gray-900 text-lg sm:text-xl ${isSelected ? colorScheme.text : ''}`}>
                              {event.title}
                            </h3>
                            <div className="flex gap-2">
                              {isSelected && (
                                <span className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow">
                                  Selected
                                </span>
                              )}
                              <span className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow">
                                {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.time}
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6">
                          <p className="text-gray-600 text-sm mb-4 sm:mb-5 line-clamp-3 sm:line-clamp-2">{event.description}</p>

                          {eventTicketTypes.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                                <h4 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 text-white shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                  </span>
                                  Ticket types
                                </h4>
                                <p className="text-xs text-gray-500 pl-10 sm:pl-0">
                                  Each type uses a different color bar so you can tell them apart quickly.
                                </p>
                              </div>
                              <ul className="mt-3 flex list-none flex-col gap-3 p-0" role="list">
                                {eventTicketTypes.map((ticketType, ttIndex) => {
                                  const v = TICKET_TYPE_VARIANTS[ttIndex % TICKET_TYPE_VARIANTS.length];
                                  const selected = selectedTicketType === ticketType.id;
                                  const isFree = ticketType.price <= 0;
                                  return (
                                    <li key={ticketType.id} className="m-0 p-0">
                                      <motion.div
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={selected}
                                        aria-label={`${ticketType.name}, ${isFree ? "free" : `UGX ${ticketType.price.toLocaleString()}`}${selected ? ", selected" : ""}`}
                                        className={`group touch-manipulation relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${v.cardBg} ${
                                          selected
                                            ? `${v.selectedBorder} shadow-md ring-2 ${v.selectedRing}`
                                            : `${v.border} ${v.borderHover} hover:shadow-md`
                                        }`}
                                        whileHover={isMobile ? undefined : { y: -2 }}
                                        whileTap={{ scale: 0.99 }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedTicketType(ticketType.id);
                                            setIsModalOpen(true);
                                          }
                                        }}
                                        onClick={() => {
                                          setSelectedTicketType(ticketType.id);
                                          setIsModalOpen(true);
                                        }}
                                      >
                                        <div
                                          className={`absolute bottom-0 left-0 top-0 w-1.5 rounded-l-[0.65rem] bg-gradient-to-b ${v.stripe}`}
                                          aria-hidden
                                        />
                                        <div className="relative flex flex-col gap-3 py-4 pl-4 pr-3 sm:flex-row sm:items-center sm:justify-between sm:py-4 sm:pl-5 sm:pr-4">
                                          <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <div
                                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${isFree ? "bg-gradient-to-br from-emerald-500 to-teal-600" : v.accent}`}
                                            >
                                              {isFree ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                              ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <h5 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">{ticketType.name}</h5>
                                                <span
                                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${
                                                    isFree ? "bg-emerald-100 text-emerald-800" : v.accentSoft
                                                  }`}
                                                >
                                                  {isFree ? "Free" : "Paid"}
                                                </span>
                                              </div>
                                              <p
                                                className={`text-lg font-bold tabular-nums sm:text-xl ${isFree ? "text-emerald-700" : v.priceClass}`}
                                              >
                                                {isFree ? "UGX 0" : `UGX ${ticketType.price.toLocaleString()}`}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex shrink-0 items-center justify-between gap-2 pl-[3.75rem] sm:justify-end sm:pl-0">
                                            {!selected && (
                                              <span className="text-xs text-gray-500 sm:hidden">Tap to select</span>
                                            )}
                                            {selected ? (
                                              <span
                                                className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-2 text-sm font-semibold text-white shadow ${v.stripe}`}
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Selected
                                              </span>
                                            ) : (
                                              <span className="hidden text-sm font-medium text-gray-400 sm:inline">Select</span>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    </li>
                                  );
                                })}
                              </ul>
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
          </div>

          {/* Mobile: fixed bar after selecting a ticket type */}
          {(() => {
            if (!isMobile || !selectedTicketType || isModalOpen || success) return null;
            const sel = getTicketTypeById(selectedTicketType);
            if (!sel) return null;
            return (
              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/90 bg-white/95 backdrop-blur-md shadow-[0_-12px_40px_rgba(0,0,0,0.1)] lg:hidden">
                <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Selected ticket</p>
                    <p className="truncate text-sm font-bold text-gray-900">{sel.name}</p>
                    <p className="text-xs text-gray-600">
                      {sel.price > 0 ? `UGX ${sel.price.toLocaleString()} each` : "Free ticket"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 shrink-0 touch-manipulation rounded-xl bg-gradient-to-r from-red-600 to-purple-700 px-5 text-sm font-semibold text-white shadow-md active:scale-[0.98]"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            );
          })()}

          <motion.div
            className="text-center mt-8 sm:mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link href="/">
              <Button className="bg-gradient-to-r from-red-600 to-purple-700 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-purple-800 transition-all duration-300 px-6 py-3 text-base rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home Page
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Outside page container (z-10) so this stacks above Navbar (z-50) */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col justify-end lg:items-center lg:justify-center lg:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-10 flex w-full max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-t-[1.25rem] bg-white shadow-2xl lg:max-h-[min(90vh,760px)] lg:max-w-lg lg:rounded-2xl"
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={
              isMobile
                ? { type: "spring", damping: 28, stiffness: 380 }
                : { type: "spring", damping: 26, stiffness: 320 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pt-2 pb-1 lg:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 pb-3 pt-1 lg:px-5 lg:pt-4">
              <div className="min-w-0">
                <h2 id="ticket-modal-title" className="pr-2 text-lg font-bold text-gray-900 lg:text-xl">
                  Ticket information
                </h2>
                <p className="mt-0.5 hidden text-sm text-gray-600 lg:block">
                  Fill in your details to receive your tickets. Fields marked{" "}
                  <span className="text-red-500">*</span> are required.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200"
                aria-label="Close dialog"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:px-5 lg:pb-6">
              <p className="mb-3 text-sm text-gray-600 lg:hidden">
                Fill in your details. Fields marked <span className="text-red-500">*</span> are required.
              </p>
              <TicketForm
                formData={formData}
                onInputChange={handleInputChange}
                onQuantityChange={handleQuantityChange}
                onQuantityBlur={handleQuantityBlur}
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
                quantityInput={quantityInput}
                quantity={quantity}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      <Footer />
    </main>
  );
}