"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { generateTicketPDF, generateMultiTicketPDF } from "@/lib/ticketGenerator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { splitFullName } from "@/lib/utils";

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

type PayRail = "mobile_money" | "card";

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
  payRail: PayRail;
  onPayRailChange: (rail: PayRail) => void;
  mmPhase: "idle" | "awaiting_pin" | "confirmed";
  onCancelMm: () => void;
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
  payRail,
  onPayRailChange,
  mmPhase,
  onCancelMm,
}) => {
  const total = getTotalPrice();
  const isPaid = total > 0;

  return (
  <>
    {success || mmPhase === "confirmed" ? (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <p className="text-gray-900 mb-1 text-lg font-semibold">You&apos;re in</p>
        <p className="text-gray-600 mb-6 text-sm">{success}</p>
        {downloadableTickets && downloadableTickets.length > 0 && (
          <div className="mb-4">
            <Button
              onClick={onDownloadAll}
              className="mb-3 w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg"
            >
              Download {downloadableTickets.length > 1 ? "all" : "ticket"}
            </Button>

            {downloadableTickets.length > 1 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {downloadableTickets.map((t, index) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-red-50 to-purple-50 rounded-lg border border-red-100">
                    <div className="font-medium text-gray-800 text-sm truncate">
                      #{t.id.substring(0, 8)}
                    </div>
                    <Button
                      onClick={() => onDownloadTicket(t, index + 1, downloadableTickets.length)}
                      className="text-xs px-3 py-1.5 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white rounded-lg shadow"
                    >
                      PDF
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg"
        >
          Done
        </Button>
      </div>
    ) : mmPhase === "awaiting_pin" ? (
      <div className="text-center py-8 px-2">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p className="text-gray-900 font-semibold mb-1">Check your phone</p>
        <p className="text-sm text-gray-600 mb-6">
          Enter PIN on <span className="font-medium text-gray-900">{formData.phone}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onCancelMm}
          className="border-gray-300"
        >
          Cancel
        </Button>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="quantity" className="text-gray-700 mb-1.5 block text-sm font-medium">
              Qty
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
          <div className="pb-3 text-right min-w-[7.5rem]">
            <p className="text-xs text-gray-500 truncate">
              {getTicketTypeById(selectedTicketType)?.name || "—"}
            </p>
            <p className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-700 bg-clip-text text-transparent tabular-nums">
              UGX {total.toLocaleString()}
            </p>
          </div>
        </div>

        {isPaid && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => onPayRailChange("mobile_money")}
              className={`h-11 rounded-lg text-sm font-semibold transition-colors ${
                payRail === "mobile_money"
                  ? "bg-gradient-to-r from-red-600 to-purple-700 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              MoMo
            </button>
            <button
              type="button"
              onClick={() => onPayRailChange("card")}
              className={`h-11 rounded-lg text-sm font-semibold transition-colors ${
                payRail === "card"
                  ? "bg-gradient-to-r from-red-600 to-purple-700 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Card
            </button>
          </div>
        )}

        <div>
          <Label htmlFor="phone" className="sr-only">Phone</Label>
          <Input
            type="tel"
            inputMode="numeric"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            placeholder="Phone · 07xxxxxxxx"
            pattern="^07[0-9]{8}$"
            maxLength={10}
            className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            required
            autoComplete="tel"
          />
        </div>

        {(!isPaid || payRail === "card") && (
          <div>
            <Label htmlFor="fullName" className="sr-only">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={onInputChange}
              placeholder="Full name"
              className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              required
              autoComplete="name"
            />
          </div>
        )}

        {isPaid && payRail === "card" && (
          <div>
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="Email"
              className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              required
              autoComplete="email"
            />
          </div>
        )}

        {!isPaid && (
          <div>
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="Email (optional)"
              className="h-12 min-h-[48px] rounded-xl border-gray-300 bg-white text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              autoComplete="email"
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

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
                …
              </span>
            ) : !isPaid ? (
              "Get free ticket"
            ) : (
              `Pay UGX ${total.toLocaleString()}`
            )}
          </Button>
        </motion.div>
      </form>
    )}
  </>
  );
};

export default function TicketsPage() {
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
  const [payRail, setPayRail] = useState<PayRail>("mobile_money");
  const [mmPhase, setMmPhase] = useState<"idle" | "awaiting_pin" | "confirmed">("idle");
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);

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
        setError("Couldn’t load events");
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

  // Poll mobile money until paid / failed
  useEffect(() => {
    if (mmPhase !== "awaiting_pin" || !pendingTicketId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts += 1;
        try {
          const res = await fetch(
            `/api/tickets/mobile-money/status?ticketId=${encodeURIComponent(pendingTicketId)}`
          );
          const data = await res.json().catch(() => null);
          if (res.ok && data) {
            if (data.status === "confirmed") {
              const ticketType = getTicketTypeById(selectedTicketType);
              const event = ticketType ? getEventById(ticketType.event_id) : null;
              const ticketRes = await fetch(`/api/tickets/fetch/${pendingTicketId}`);
              const ticketPayload = await ticketRes.json().catch(() => null);
              const ticket = ticketPayload?.ticket || ticketPayload;
              if (!cancelled) {
                if (ticket) {
                  const downloadable = {
                    id: ticket.id,
                    event: {
                      title: ticket.event?.title || event?.title || "",
                      date: ticket.event?.date || event?.date || "",
                      location: ticket.event?.location || event?.location || "",
                      organizer_name: ticket.event?.organizer_name,
                      organizer_logo_url: ticket.event?.organizer_logo_url,
                      sponsor_logos: ticket.event?.sponsor_logos,
                    },
                    buyer_name: ticket.buyer_name || "",
                    buyer_phone: ticket.buyer_phone || formData.phone,
                    purchase_channel: "online",
                  };
                  setDownloadableTickets([downloadable]);
                  try {
                    await downloadTicket(downloadable);
                  } catch (err) {
                    console.warn("Auto download failed", err);
                  }
                }
                setMmPhase("confirmed");
                setSuccess(event?.title ? `Ticket for ${event.title}` : "Ticket ready");
                setLoading(false);
              }
              return;
            }
            if (data.status === "failed") {
              if (!cancelled) {
                setMmPhase("idle");
                setPendingTicketId(null);
                setLoading(false);
                setError("Payment didn’t go through");
              }
              return;
            }
          }
        } catch (err) {
          console.error("MM poll error", err);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) {
        setLoading(false);
        setError("Still waiting — keep this page open");
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [
    mmPhase,
    pendingTicketId,
    selectedTicketType,
    getTicketTypeById,
    getEventById,
    formData.phone,
    downloadTicket,
  ]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // iOS Safari blocks popups opened after async work.
    const preOpenedDownloadWindow =
      isIOSDevice() ? window.open("about:blank", "_blank", "noopener,noreferrer") : null;

    try {
      if (!selectedTicketType) {
        throw new Error("Pick a ticket first");
      }

      if (quantity <= 0) {
        throw new Error("Qty must be at least 1");
      }

      const normalizedPhone = formData.phone.replace(/\s+/g, "");
      if (!/^07[0-9]{8}$/.test(normalizedPhone)) {
        throw new Error("Use 07xxxxxxxx");
      }

      const ticketType = getTicketTypeById(selectedTicketType);
      if (!ticketType) {
        throw new Error("Ticket not found");
      }

      const totalPrice = getTotalPrice();

      if (totalPrice > 0 && payRail === "mobile_money") {
        const response = await fetch("/api/tickets/mobile-money", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: normalizedPhone,
            amount: totalPrice,
            eventId: ticketType.event_id,
            quantity,
            ticketTypeId: ticketType.id,
            fullName: formData.fullName?.trim() || undefined,
            email: formData.email?.trim() || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Couldn’t start MoMo payment");
        }
        setPendingTicketId(data.ticketId);
        setMmPhase("awaiting_pin");
        return;
      }

      if (totalPrice > 0 && payRail === "card") {
        if (!formData.fullName?.trim()) {
          throw new Error("Enter your name");
        }
        const email = formData.email?.trim();
        if (!email) {
          throw new Error("Email required for card");
        }
        const { firstName, lastName } = splitFullName(formData.fullName);
        if (!firstName) {
          throw new Error("Enter your name");
        }

        const response = await fetch("/api/tickets/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phoneNumber: normalizedPhone,
            amount: totalPrice.toString(),
            eventId: ticketType.event_id,
            quantity,
            ticketTypeId: ticketType.id,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Payment failed");
        }

        window.location.href = data.url;
        return;
      }

      // Free tickets
      if (!formData.fullName?.trim()) {
        throw new Error("Enter your name");
      }
      const displayName = formData.fullName.trim();
      const ticketsToInsert = Array(quantity).fill(null).map(() => ({
        event_id: ticketType.event_id,
        ticket_type_id: ticketType.id,
        email: formData.email?.trim() || null,
        quantity: 1,
        status: "confirmed",
        price: ticketType.price,
        purchase_channel: "online",
        buyer_name: displayName,
        buyer_phone: normalizedPhone,
      }));

      const { data, error } = await supabase
        .from("tickets")
        .insert(ticketsToInsert)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const event = getEventById(ticketType.event_id);
        const createdRows = Array.isArray(data) ? data : [data[0]];
        const ticketsToDownload = createdRows.map((row: any) => ({
          id: row.id,
          event: {
            title: event?.title || "",
            date: event?.date || "",
            location: event?.location || "",
          },
          buyer_name: displayName,
          buyer_phone: formData.phone,
          purchase_channel: "online",
        }));

        let allDownloadsSucceeded = true;
        try {
          await downloadAllTickets(ticketsToDownload, preOpenedDownloadWindow);
        } catch (downloadError) {
          console.error("Multi-ticket download failed, falling back", downloadError);
          if (isIOSDevice() && ticketsToDownload.length > 1) {
            allDownloadsSucceeded = false;
          } else {
            for (let i = 0; i < ticketsToDownload.length; i++) {
              try {
                if (i > 0) await new Promise((res) => setTimeout(res, 500));
                await downloadTicket(
                  ticketsToDownload[i],
                  i + 1,
                  ticketsToDownload.length,
                  i === 0 ? preOpenedDownloadWindow : null
                );
              } catch (dlErr) {
                console.error("Download failed", dlErr);
                allDownloadsSucceeded = false;
              }
            }
          }
        }

        if (allDownloadsSucceeded) {
          setSuccess(event?.title ? `Ticket for ${event.title}` : "Ticket ready");
        } else {
          setSuccess("Download below if it didn’t start");
        }

        setDownloadableTickets(ticketsToDownload);
        setFormData({ fullName: "", email: "", phone: "" });
        setQuantityInput("1");
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Ticket purchase error:", err);
      let errorMessage = "Failed to process ticket purchase";

      if (err && typeof err === "object") {
        if (err.message) {
          errorMessage = err.message;
        } else if (Object.keys(err).length === 0) {
          errorMessage = "An unexpected error occurred. Please try again.";
        } else {
          try {
            errorMessage = JSON.stringify(err);
          } catch {
            errorMessage = "An unknown error occurred";
          }
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
      setMmPhase("idle");
      setPendingTicketId(null);
      setLoading(false);
    }
  }, [
    selectedTicketType,
    quantity,
    formData,
    payRail,
    getTicketTypeById,
    getEventById,
    getTotalPrice,
    downloadTicket,
    downloadAllTickets,
  ]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setMmPhase("idle");
    setPendingTicketId(null);
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
          <p className="mt-4 text-gray-600">Loading…</p>
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
            className="text-center mb-5 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 bg-clip-text bg-gradient-to-r from-red-600 via-purple-600 to-red-800 px-1">
              Tickets
            </h1>
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
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">No events yet</p>
                  <Link href="/events">
                    <Button className="bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 shadow-lg px-6 py-2.5">
                      Browse events
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
                            <span className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow">
                              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.time}
                            </span>
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6">
                          {eventTicketTypes.length > 0 ? (
                            <ul className="flex list-none flex-col gap-2.5 p-0" role="list">
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
                                      <div className="relative flex items-center justify-between gap-3 py-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h5 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">
                                              {ticketType.name}
                                            </h5>
                                            {isFree && (
                                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                                Free
                                              </span>
                                            )}
                                          </div>
                                          <p
                                            className={`mt-0.5 text-base font-bold tabular-nums sm:text-lg ${isFree ? "text-emerald-700" : v.priceClass}`}
                                          >
                                            {isFree ? "Free" : `UGX ${ticketType.price.toLocaleString()}`}
                                          </p>
                                        </div>
                                        <span
                                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow ${
                                            selected
                                              ? `bg-gradient-to-r ${v.stripe}`
                                              : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                                          }`}
                                          aria-hidden
                                        >
                                          {selected ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                          )}
                                        </span>
                                      </div>
                                    </motion.div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-center text-sm text-gray-500 py-2">Sold out</p>
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
                    <p className="truncate text-sm font-bold text-gray-900">{sel.name}</p>
                    <p className="text-xs text-gray-600">
                      {sel.price > 0 ? `UGX ${sel.price.toLocaleString()}` : "Free"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 shrink-0 touch-manipulation rounded-xl bg-gradient-to-r from-red-600 to-purple-700 px-5 text-sm font-semibold text-white shadow-md active:scale-[0.98]"
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            );
          })()}
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
              <h2 id="ticket-modal-title" className="pr-2 text-lg font-bold text-gray-900 lg:text-xl">
                Checkout
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:px-5 lg:pb-6">
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
                payRail={payRail}
                onPayRailChange={setPayRail}
                mmPhase={mmPhase}
                onCancelMm={() => {
                  setMmPhase("idle");
                  setPendingTicketId(null);
                  setLoading(false);
                  setError(null);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      <Footer />
    </main>
  );
}