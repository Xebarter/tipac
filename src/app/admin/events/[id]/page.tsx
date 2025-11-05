"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  is_published: boolean;
  organizer_name?: string;
  organizer_logo_url?: string;
  sponsor_logos?: Array<{ url: string; name: string }>;
}

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface NewTicketType {
  name: string;
  price: number;
  is_active: boolean;
}

export default function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [newTicketTypes, setNewTicketTypes] = useState<NewTicketType[]>([
    { name: "", price: 0, is_active: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEventAndTickets();
  }, [eventId]);

  const loadEventAndTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Load ticket types
      const { data: ticketTypesData, error: ticketTypesError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (ticketTypesError) throw ticketTypesError;
      setTicketTypes(ticketTypesData || []);

    } catch (err) {
      console.error("Error loading event:", err);
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (field: keyof Event, value: any) => {
    if (!event) return;
    setEvent({ ...event, [field]: value });
  };

  const handleTicketTypeChange = (id: string, field: keyof TicketType, value: any) => {
    setTicketTypes(types =>
      types.map(type =>
        type.id === id ? { ...type, [field]: value } : type
      )
    );
  };

  const handleNewTicketTypeChange = (index: number, field: keyof NewTicketType, value: any) => {
    setNewTicketTypes(types =>
      types.map((type, i) =>
        i === index ? { ...type, [field]: value } : type
      )
    );
  };

  const addNewTicketType = () => {
    setNewTicketTypes([...newTicketTypes, { name: "", price: 0, is_active: true }]);
  };

  const removeNewTicketType = (index: number) => {
    if (newTicketTypes.length <= 1) {
      setNewTicketTypes([{ name: "", price: 0, is_active: true }]);
    } else {
      setNewTicketTypes(types => types.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Update event details
      const { error: eventError } = await supabase
        .from("events")
        .update({
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          image_url: event.image_url,
          is_published: event.is_published,
          organizer_name: event.organizer_name,
          organizer_logo_url: event.organizer_logo_url,
          sponsor_logos: event.sponsor_logos
        })
        .eq("id", event.id);

      if (eventError) throw eventError;

      // Update existing ticket types
      for (const ticketType of ticketTypes) {
        const { error: ticketTypeError } = await supabase
          .from("ticket_types")
          .update({
            name: ticketType.name,
            price: ticketType.price,
            is_active: ticketType.is_active
          })
          .eq("id", ticketType.id);

        if (ticketTypeError) throw ticketTypeError;
      }

      // Add new ticket types
      const validNewTicketTypes = newTicketTypes.filter(type => type.name.trim());
      if (validNewTicketTypes.length > 0) {
        const ticketTypesData = validNewTicketTypes.map(type => ({
          event_id: event.id,
          name: type.name.trim(),
          price: type.price,
          is_active: type.is_active
        }));

        const { error: newTicketTypeError } = await supabase
          .from("ticket_types")
          .insert(ticketTypesData);

        if (newTicketTypeError) throw newTicketTypeError;
      }

      setSuccess("Event and ticket types updated successfully!");
      // Reset new ticket types form
      setNewTicketTypes([{ name: "", price: 0, is_active: true }]);
      // Reload data
      await loadEventAndTickets();

    } catch (err) {
      console.error("Error updating event:", err);
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error: {error}</h1>
          <Button onClick={() => router.push("/admin/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button onClick={() => router.push("/admin/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <Button onClick={() => router.push("/admin/events")}>Back to Events</Button>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details Section */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={event.title}
                  onChange={(e) => handleEventChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={event.description}
                  onChange={(e) => handleEventChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={event.date}
                    onChange={(e) => handleEventChange("date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={event.time}
                    onChange={(e) => handleEventChange("time", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={event.location}
                  onChange={(e) => handleEventChange("location", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={event.image_url || ""}
                  onChange={(e) => handleEventChange("image_url", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="organizer_name">Organizer Name</Label>
                <Input
                  id="organizer_name"
                  value={event.organizer_name || ""}
                  onChange={(e) => handleEventChange("organizer_name", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="organizer_logo_url">Organizer Logo URL</Label>
                <Input
                  id="organizer_logo_url"
                  value={event.organizer_logo_url || ""}
                  onChange={(e) => handleEventChange("organizer_logo_url", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={event.is_published}
                  onChange={(e) => handleEventChange("is_published", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
          </div>

          {/* Existing Ticket Types Section */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Existing Ticket Types</h2>

            {ticketTypes.length > 0 ? (
              <div className="space-y-4">
                {ticketTypes.map((ticketType) => (
                  <div
                    key={ticketType.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="md:col-span-5">
                      <Label>Ticket Name *</Label>
                      <Input
                        value={ticketType.name}
                        onChange={(e) =>
                          handleTicketTypeChange(ticketType.id, "name", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Price (UGX)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={ticketType.price}
                        onChange={(e) =>
                          handleTicketTypeChange(ticketType.id, "price", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="md:col-span-3 flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={ticketType.is_active}
                          onChange={(e) =>
                            handleTicketTypeChange(ticketType.id, "is_active", e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2">Active</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No existing ticket types</p>
            )}
          </div>

          {/* Add New Ticket Types Section */}
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Ticket Types</h2>
              <button
                type="button"
                onClick={addNewTicketType}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Ticket Type
              </button>
            </div>

            <div className="space-y-4">
              {newTicketTypes.map((ticketType, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="md:col-span-5">
                    <Label>Ticket Name</Label>
                    <Input
                      value={ticketType.name}
                      onChange={(e) =>
                        handleNewTicketTypeChange(index, "name", e.target.value)
                      }
                      placeholder="e.g., General Admission, VIP"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Price (UGX)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={ticketType.price}
                      onChange={(e) =>
                        handleNewTicketTypeChange(index, "price", Number(e.target.value))
                      }
                      placeholder="0 for free"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ticketType.is_active}
                        onChange={(e) =>
                          handleNewTicketTypeChange(index, "is_active", e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                  </div>

                  <div className="md:col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => removeNewTicketType(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/events")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}