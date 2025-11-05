"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  date: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  event_id: string;
}

export default function GenerateBatchTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTicketType, setSelectedTicketType] = useState("");
  const [numTickets, setNumTickets] = useState(10);
  const [batchCode, setBatchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchTicketTypes(selectedEvent);
    } else {
      setTicketTypes([]);
      setSelectedTicketType("");
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);

      // Unique batch code with timestamp
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
      const timestamp = Date.now();
      setBatchCode(`BATCH-${dateStr}-${timestamp}`);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    }
  };

  const fetchTicketTypes = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("id, name, price, event_id")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
      
      // Auto-select first ticket type if only one exists
      if (data && data.length === 1) {
        setSelectedTicketType(data[0].id);
      } else {
        setSelectedTicketType("");
      }
    } catch (err) {
      console.error("Error fetching ticket types:", err);
      setError("Failed to load ticket types");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get selected ticket type price
      const ticketType = ticketTypes.find(tt => tt.id === selectedTicketType);
      const price = ticketType ? ticketType.price : 0;

      const response = await fetch("/api/tickets/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEvent,
          num_tickets: numTickets,
          batch_code: batchCode,
          price: price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate batch tickets");
      }

      // Trigger PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${batchCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Successfully generated ${numTickets} tickets for batch ${batchCode}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate batch tickets");
      console.error("Error generating batch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 py-10 px-6 flex flex-col items-center">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Generate Batch Tickets
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Create physical tickets for offline distribution
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full max-w-2xl p-4 rounded-lg border border-red-700 bg-red-900/40 backdrop-blur-sm"
        >
          <p className="text-center text-red-200 font-medium">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full max-w-2xl p-4 rounded-lg border border-green-700 bg-green-900/40 backdrop-blur-sm"
        >
          <p className="text-center text-green-200 font-medium">{success}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl rounded-2xl bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-md"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="event" className="text-gray-300 text-sm font-medium">
              Event
            </Label>
            <select
              id="event"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full mt-2 bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({new Date(event.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="numTickets" className="text-gray-300 text-sm font-medium">
              Number of Tickets
            </Label>
            <Input
              id="numTickets"
              type="number"
              min="1"
              max="1000"
              value={numTickets}
              onChange={(e) => setNumTickets(parseInt(e.target.value) || 1)}
              className="mt-2 bg-black/30 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="ticketType" className="text-gray-300 text-sm font-medium">
              Ticket Type
            </Label>
            <select
              id="ticketType"
              value={selectedTicketType}
              onChange={(e) => setSelectedTicketType(e.target.value)}
              className="w-full mt-2 bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={!selectedEvent || ticketTypes.length === 0}
              required
            >
              <option value="">
                {selectedEvent 
                  ? (ticketTypes.length === 0 ? 'No active ticket types found' : 'Select a ticket type') 
                  : 'Please select an event first'}
              </option>
              {ticketTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.price.toLocaleString()} UGX)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Select the ticket type to generate. Price is automatically set based on selected type.
            </p>
          </div>

          <div>
            <Label htmlFor="batchCode" className="text-gray-300 text-sm font-medium">
              Batch Code
            </Label>
            <Input
              id="batchCode"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="mt-2 bg-black/30 border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              A unique batch code is automatically generated. You can modify it if needed.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              type="submit"
              disabled={loading || !selectedEvent || !selectedTicketType}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
            >
              {loading ? "Generating..." : "Generate Batch Tickets"}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      <p className="text-gray-500 text-xs mt-8 text-center">
        Powered by Supabase • Secure Ticket Management
      </p>
    </div>
  );
}
