"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface Ticket {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  price: number;
  status: string;
}

export default function EventTicketsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [ticketTypeId, setTicketTypeId] = useState<string | null>(null);
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch event and ticket info
  useEffect(() => {
    if (!isClient || !eventId) return;

    const fetchData = async () => {
      try {
        // Fetch the specific event
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

        // Fetch ticket price and type for this event from ticket_types table
        const { data: ticketTypesData, error: ticketTypesError } =
          await supabase
            .from("ticket_types")
            .select("id, price")
            .eq("event_id", eventId)
            .eq("is_active", true);

        // If there's no ticket type data for this event, default to 0 (free)
        if (
          ticketTypesError ||
          !ticketTypesData ||
          ticketTypesData.length === 0
        ) {
          setTicketPrice(0);
          setTicketTypeId(null);
        } else {
          // Use the price and id of the first ticket type (in the future, we might want to show all types)
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

  const getTotalPrice = () => {
    return ticketPrice * quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!eventId) {
        throw new Error("Event not found");
      }

      if (quantity <= 0) {
        throw new Error("Quantity must be at least 1");
      }

      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Please fill in all required fields");
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
            phoneNumber: formData.phone,
            amount: totalPrice.toString(),
            eventId: eventId,
            quantity: quantity,
            ticketTypeId: ticketTypeId,
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
          .from("tickets")
          .insert([
            {
              event_id: eventId,
              ticket_type_id: ticketTypeId,
              email: formData.email,
              quantity: quantity,
              status: "confirmed",
              price: ticketPrice,
              purchase_channel: "online",
            },
          ])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          setSuccess(
            `Thank you! Your free ticket for ${event?.title} has been confirmed.`,
          );

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
      setError(err.message || "Failed to process ticket purchase");
      console.error("Ticket purchase error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until client-side code is ready
  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Animated gradients */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
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
            {event
              ? "Purchase your tickets for this event"
              : "Select event and purchase your tickets"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Event Details */}
          {event && (
            <motion.div
              className="lg:col-span-2 backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                Event Details
              </h3>

              <div className="space-y-4">
                <div className="p-5 rounded-xl border-2 border-purple-500 bg-gradient-to-r from-purple-900/30 to-blue-900/30 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">
                        {event.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center text-gray-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center text-gray-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {event.time}
                        </span>
                        <span className="flex items-center text-gray-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {event.location}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-3">{event.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold text-lg text-white">
                        {ticketPrice > 0
                          ? `UGX ${ticketPrice.toLocaleString()}`
                          : "Free"}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-purple-300 bg-purple-900/50 rounded-full">
                        Selected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Purchase Form */}
          <motion.div
            className="backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Purchase Tickets
            </h3>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 mb-4">
                <p className="text-green-200 text-center">{success}</p>

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => setSuccess(null)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    Buy More Tickets
                  </Button>
                  <Link href="/">
                    <Button className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-200 text-sm">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(10, Number.parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-gray-200 text-sm"
                    >
                      First Name *
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
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-200 text-sm">
                      Last Name *
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 text-sm">
                    Email *
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200 text-sm">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+256123456789"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                  />
                </div>

                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-200">Ticket Price:</p>
                    </div>
                    <p className="font-medium text-white">
                      UGX {ticketPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-200">Quantity:</p>
                    </div>
                    <p className="font-medium text-white">{quantity}</p>
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
                    disabled={loading || !event}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {loading
                      ? "Processing..."
                      : getTotalPrice() > 0
                        ? "Proceed to Payment"
                        : "Get Free Tickets"}
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
