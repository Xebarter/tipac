"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string;
  title: string;
  date: string;
}

export default function GenerateBatchTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [numTickets, setNumTickets] = useState(10);
  const [batchCode, setBatchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      // Set default batch code with timestamp to ensure uniqueness
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
      const timestamp = Date.now();
      setBatchCode(`BATCH-${dateStr}-${timestamp}`);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tickets/generate-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: selectedEvent,
          num_tickets: numTickets,
          batch_code: batchCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate batch tickets");
      }

      // Trigger download of the PDF
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Generate Batch Tickets</h1>
        <p className="text-gray-400">
          Create physical tickets for offline distribution
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-200 text-center">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
          <p className="text-green-200 text-center">{success}</p>
        </div>
      )}

      <div className="max-w-2xl bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="event" className="text-gray-200">
              Event
            </Label>
            <select
              id="event"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Label htmlFor="numTickets" className="text-gray-200">
              Number of Tickets
            </Label>
            <Input
              id="numTickets"
              type="number"
              min="1"
              max="1000"
              value={numTickets}
              onChange={(e) => setNumTickets(parseInt(e.target.value) || 1)}
              className="mt-1 bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="batchCode" className="text-gray-200">
              Batch Code
            </Label>
            <Input
              id="batchCode"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="mt-1 bg-gray-900 border-gray-700 text-white"
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              A unique batch code is automatically generated. You can modify it if needed.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Batch Tickets"}
          </Button>
        </form>
      </div>
    </div>
  );
}