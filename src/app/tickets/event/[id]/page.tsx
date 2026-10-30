"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";
import { splitFullName } from "@/lib/utils";
import { generateTicketPDF } from "@/lib/ticketGenerator";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

type PayRail = "mobile_money" | "card";

export default function EventTicketsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [ticketTypeId, setTicketTypeId] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = useMemo(() => {
    const n = Number.parseInt(quantityInput, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [quantityInput]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantityInput(e.target.value.replace(/\D/g, ""));
  }, []);

  const handleQuantityBlur = useCallback(() => {
    setQuantityInput((prev) => {
      const n = Number.parseInt(prev, 10);
      return Number.isFinite(n) && n > 0 ? String(n) : "1";
    });
  }, []);

  const [payRail, setPayRail] = useState<PayRail>("mobile_money");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mmPhase, setMmPhase] = useState<"idle" | "awaiting_pin" | "confirmed">("idle");
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !eventId) return;

    const fetchData = async () => {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .eq("is_published", true)
          .single();

        if (eventError) throw eventError;

        if (!eventData) {
          setError("Event not found");
          return;
        }

        setEvent(eventData);

        const { data: ticketTypesData, error: ticketTypesError } = await supabase
          .from("ticket_types")
          .select("id, price")
          .eq("event_id", eventId)
          .eq("is_active", true);

        if (ticketTypesError || !ticketTypesData || ticketTypesData.length === 0) {
          setTicketPrice(0);
          setTicketTypeId(null);
        } else {
          setTicketPrice(ticketTypesData[0].price);
          setTicketTypeId(ticketTypesData[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load event details. Please try again later.");
      }
    };

    fetchData();
  }, [eventId, isClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getTotalPrice = () => ticketPrice * quantity;

  const downloadTicket = async (ticket: any) => {
    try {
      setDownloading(true);
      const blob = await generateTicketPDF(ticket);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipac-ticket-${String(ticket.id).substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Ticket download failed", err);
      setError("Could not download ticket PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const fetchConfirmedTicket = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/fetch/${ticketId}`);
    if (!res.ok) return null;
    return res.json();
  };

  // Poll mobile money until paid / failed
  useEffect(() => {
    if (mmPhase !== "awaiting_pin" || !pendingTicketId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40; // ~2 minutes at 3s

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts += 1;
        try {
          const res = await fetch(
            `/api/tickets/mobile-money/status?ticketId=${encodeURIComponent(pendingTicketId)}`
          );
          const data = await res.json().catch(() => null);
          if (!res.ok || !data) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }

          if (data.status === "confirmed") {
            const ticket = await fetchConfirmedTicket(pendingTicketId);
            if (!cancelled) {
              setMmPhase("confirmed");
              setConfirmedTicket(ticket);
              setSuccess(
                `Payment successful! Your ticket for ${event?.title || "the event"} is ready.`
              );
              setLoading(false);
              if (ticket) {
                void downloadTicket(ticket);
              }
            }
            return;
          }

          if (data.status === "failed") {
            if (!cancelled) {
              setMmPhase("idle");
              setPendingTicketId(null);
              setLoading(false);
              setError("Payment was not completed. Please try again.");
            }
            return;
          }
        } catch (err) {
          console.error("MM poll error", err);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (!cancelled) {
        setLoading(false);
        setError(
          "Still waiting for payment confirmation. If you approved on your phone, refresh this page or check your SMS."
        );
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: poll only while awaiting_pin
  }, [mmPhase, pendingTicketId, event?.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!eventId) throw new Error("Event not found");
      if (quantity <= 0) throw new Error("Quantity must be at least 1");

      const normalizedPhone = formData.phone.replace(/\s+/g, "");
      if (!/^07[0-9]{8}$/.test(normalizedPhone)) {
        throw new Error("Phone number must be in the format 07xxxxxxxx (10 digits, starting with 07)");
      }

      const totalPrice = getTotalPrice();

      // Free tickets — name + phone only
      if (totalPrice <= 0) {
        if (!formData.fullName?.trim()) {
          throw new Error("Please enter your full name");
        }
        const displayName = formData.fullName.trim();
        const { data, error: insertError } = await supabase
          .from("tickets")
          .insert([
            {
              event_id: eventId,
              ticket_type_id: ticketTypeId,
              email: formData.email?.trim() || null,
              quantity,
              status: "confirmed",
              price: ticketPrice,
              purchase_channel: "online",
              buyer_name: displayName,
              buyer_phone: normalizedPhone,
            },
          ])
          .select();

        if (insertError) throw insertError;

        if (data?.[0]) {
          setSuccess(`Thank you! Your free ticket for ${event?.title} has been confirmed.`);
          setFormData({ fullName: "", email: "", phone: "" });
          setQuantityInput("1");
        }
        setLoading(false);
        return;
      }

      if (payRail === "mobile_money") {
        const response = await fetch("/api/tickets/mobile-money", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: normalizedPhone,
            amount: totalPrice,
            eventId,
            quantity,
            ticketTypeId,
            fullName: formData.fullName?.trim() || undefined,
            email: formData.email?.trim() || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to start Mobile Money payment");
        }

        setPendingTicketId(data.ticketId);
        setMmPhase("awaiting_pin");
        // Poll effect clears loading when paid/failed
        return;
      }

      // Card checkout
      if (!formData.fullName?.trim()) {
        throw new Error("Please enter your full name");
      }
      const email = formData.email?.trim();
      if (!email) {
        throw new Error("Email is required for card payments");
      }
      const { firstName, lastName } = splitFullName(formData.fullName);
      if (!firstName) {
        throw new Error("Please enter your full name");
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
          eventId,
          quantity,
          ticketTypeId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      window.location.href = data.url;
      // navigating away — leave loading true
    } catch (err: any) {
      setError(err.message || "Failed to process ticket purchase");
      console.error("Ticket purchase error:", err);
      setMmPhase("idle");
      setPendingTicketId(null);
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
              <p className="text-red-200 text-center">{error}</p>
              <div className="mt-6 text-center">
                <Link href="/events">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Back to Events
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const totalPrice = getTotalPrice();
  const isPaid = totalPrice > 0;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
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
            {event ? event.title : "Event Tickets"}
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {event ? "Purchase your tickets for this event" : "Select event and purchase your tickets"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {event && (
            <motion.div
              className="lg:col-span-2 backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Event Details</h3>

              <div className="space-y-4">
                <div className="p-5 rounded-xl border-2 border-purple-500 bg-gradient-to-r from-purple-900/30 to-blue-900/30 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{event.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center text-gray-300">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-gray-300">{event.time}</span>
                        <span className="text-gray-300">{event.location}</span>
                      </div>
                      <p className="text-gray-400 mt-3">{event.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold text-lg text-white">
                        {ticketPrice > 0 ? `UGX ${ticketPrice.toLocaleString()}` : "Free"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Purchase Tickets</h3>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-center">{error}</p>
              </div>
            )}

            {(success || mmPhase === "confirmed") && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 mb-4">
                <p className="text-green-200 text-center">{success}</p>

                {confirmedTicket && (
                  <Button
                    onClick={() => downloadTicket(confirmedTicket)}
                    disabled={downloading}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {downloading ? "Preparing…" : "Download Ticket"}
                  </Button>
                )}

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => {
                      setSuccess(null);
                      setMmPhase("idle");
                      setPendingTicketId(null);
                      setConfirmedTicket(null);
                      setError(null);
                      setFormData({ fullName: "", email: "", phone: "" });
                      setQuantityInput("1");
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    Buy More
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-gray-600 to-gray-800">
                      Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {mmPhase === "awaiting_pin" && (
              <div className="bg-blue-900/40 border border-blue-600/50 rounded-lg p-5 mb-4 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4" />
                <p className="text-white font-semibold mb-1">Approve on your phone</p>
                <p className="text-gray-300 text-sm">
                  A Mobile Money prompt was sent to <span className="text-white">{formData.phone}</span>.
                  Enter your PIN to finish — this page updates automatically.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-gray-600 text-gray-200"
                  onClick={() => {
                    setMmPhase("idle");
                    setPendingTicketId(null);
                    setLoading(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {!success && mmPhase !== "confirmed" && mmPhase !== "awaiting_pin" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-200 text-sm">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantityInput}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                  />
                </div>

                {isPaid && (
                  <div className="space-y-2">
                    <Label className="text-gray-200 text-sm">Pay with</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-gray-800/60 border border-gray-700">
                      <button
                        type="button"
                        onClick={() => setPayRail("mobile_money")}
                        className={`h-10 rounded-md text-sm font-medium transition-colors ${
                          payRail === "mobile_money"
                            ? "bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Mobile Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayRail("card")}
                        className={`h-10 rounded-md text-sm font-medium transition-colors ${
                          payRail === "card"
                            ? "bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Card
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200 text-sm">
                    Phone number *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="07xxxxxxxx"
                    pattern="^07[0-9]{8}$"
                    maxLength={10}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                    required
                    autoComplete="tel"
                    autoFocus={isPaid && payRail === "mobile_money"}
                  />
                  <p className="text-xs text-gray-500">
                    {isPaid && payRail === "mobile_money"
                      ? "We’ll send a payment prompt to this number (MTN or Airtel)."
                      : "Format: 07xxxxxxxx"}
                  </p>
                </div>

                {/* Card / free: collect name (+ email for card) */}
                {(!isPaid || payRail === "card") && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-200 text-sm">
                      Full name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                      required
                      autoComplete="name"
                    />
                  </div>
                )}

                {isPaid && payRail === "card" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200 text-sm">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                      required
                      autoComplete="email"
                    />
                  </div>
                )}

                {!isPaid && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200 text-sm">
                      Email <span className="text-gray-500">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                      autoComplete="email"
                    />
                  </div>
                )}

                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-200">Ticket Price</p>
                    <p className="font-medium text-white">UGX {ticketPrice.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-200">Quantity</p>
                    <p className="font-medium text-white">
                      {quantity > 0 ? quantity : quantityInput === "" ? "—" : quantityInput}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <p className="text-gray-200">Total</p>
                    <p className="text-xl font-bold text-white">
                      UGX {totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 rounded-lg"
                    disabled={loading || !event}
                  >
                    {loading
                      ? "Processing…"
                      : !isPaid
                        ? "Get Free Tickets"
                        : payRail === "mobile_money"
                          ? `Pay UGX ${totalPrice.toLocaleString()}`
                          : `Pay with Card · UGX ${totalPrice.toLocaleString()}`}
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
