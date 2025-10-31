"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ActivateTickets() {
  const [ticketId, setTicketId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tickets/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate ticket");
      }

      setSuccess("Ticket activated successfully!");
      setTicketId("");
      setBuyerName("");
      setBuyerPhone("");
    } catch (err: any) {
      setError(err.message || "Failed to activate ticket");
      console.error("Error activating ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Activate Physical Tickets</h1>
        <p className="text-gray-400">
          Activate physical tickets for buyers
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
            <Label htmlFor="ticketId" className="text-gray-200">
              Ticket ID
            </Label>
            <Input
              id="ticketId"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
              className="mt-1 bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="buyerName" className="text-gray-200">
              Buyer Name
            </Label>
            <Input
              id="buyerName"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Enter buyer's name"
              className="mt-1 bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="buyerPhone" className="text-gray-200">
              Buyer Phone (Optional)
            </Label>
            <Input
              id="buyerPhone"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Enter buyer's phone number"
              className="mt-1 bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-teal-600"
            disabled={loading}
          >
            {loading ? "Activating..." : "Activate Ticket"}
          </Button>
        </form>
      </div>
    </div>
  );
}