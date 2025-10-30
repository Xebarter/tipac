"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  price: number;
  status: string;
}

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
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

  // Fetch events and tickets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          .order('date', { ascending: true });

        if (eventsError) throw eventsError;

        // Fetch tickets to get pricing info
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, event_id, price, status');

        if (ticketsError) throw ticketsError;

        setEvents(eventsData || []);
        setTickets(ticketsData || []);
        
        // Check if an event was passed as a query parameter
        const eventIdFromQuery = searchParams.get('event');
        if (eventIdFromQuery && eventsData?.some((e: Event) => e.id === eventIdFromQuery)) {
          setSelectedEvent(eventIdFromQuery);
        } else if (eventsData && eventsData.length > 0) {
          // Auto-select the first event if available
          setSelectedEvent(eventsData[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load events. Please try again later.");
      }
    };

    fetchData();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getEventPrice = (eventId: string) => {
    const ticket = tickets.find(t => t.event_id === eventId && t.status !== 'cancelled');
    return ticket ? ticket.price : 0;
  };

  const getEventById = (eventId: string) => {
    return events.find(event => event.id === eventId);
  };

  const getTotalPrice = () => {
    const price = getEventPrice(selectedEvent);
    return price * quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!selectedEvent) {
        throw new Error("Please select an event");
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
            eventId: selectedEvent,
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
            event_id: selectedEvent,
            email: formData.email,
            quantity: quantity,
            status: 'confirmed',
            price: getEventPrice(selectedEvent)
          }])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          setSuccess(`Thank you! Your free ticket for ${getEventById(selectedEvent)?.title} has been confirmed.`);
          
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
            Buy Event Tickets
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Get your tickets for TIPAC events and join us in celebrating the transformative power of theatre.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Events List */}
          <motion.div
            className="backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-6 relative overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Available Events</h3>
            
            {events.length === 0 ? (
              <p className="text-gray-400">No events available at the moment. Please check back later.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {events.map((event) => {
                  const eventPrice = getEventPrice(event.id);
                  return (
                    <div 
                      key={event.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedEvent === event.id 
                          ? "border-purple-500 bg-purple-900/20" 
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedEvent(event.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">{event.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-400">
                            {event.time} at {event.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">
                            {eventPrice > 0 ? `UGX ${eventPrice}` : "Free"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                        {event.description}
                      </p>
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
            <h3 className="text-2xl font-bold text-white mb-6">Purchase Tickets</h3>
            
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
                <div>
                  <Label htmlFor="event" className="text-gray-200 text-sm mb-1 block">
                    Selected Event
                  </Label>
                  {selectedEvent ? (
                    <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                      <p className="font-medium text-white">
                        {getEventById(selectedEvent)?.title}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(getEventById(selectedEvent)?.date || "").toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Please select an event from the list</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-200 text-sm">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-200 text-sm">
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
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-200">Total Price:</p>
                      <p className="text-sm text-gray-400">
                        {quantity} ticket(s) @ UGX {getEventPrice(selectedEvent)}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      UGX {getTotalPrice()}
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
                    disabled={loading || !selectedEvent}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {loading ? "Processing..." : "Buy Tickets"}
                  </Button>
                </motion.div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}