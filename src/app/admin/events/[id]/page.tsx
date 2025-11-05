"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

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
    { name: "", price: 0, is_active: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSponsorLogo, setUploadingSponsorLogo] = useState<
    number | null
  >(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState<string | null>(null);

  useEffect(() => {
    loadEventAndTickets();
  }, [eventId]);

  const handleDeleteTicketType = async (ticketId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this ticket type? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsDeletingTicket(ticketId);
      const { error } = await supabase
        .from("ticket_types")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      // Remove the ticket type from local state
      setTicketTypes((types) => types.filter((type) => type.id !== ticketId));
    } catch (err) {
      console.error("Error deleting ticket type:", err);
      alert("Failed to delete ticket type. Please try again.");
    } finally {
      setIsDeletingTicket(null);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "event" | "sponsor" | "organizer",
    sponsorIndex?: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    try {
      if (type === "event" || type === "organizer") {
        setUploadingImage(true);
      } else {
        setUploadingSponsorLogo(sponsorIndex ?? null);
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const folderName =
        type === "event"
          ? "events"
          : type === "organizer"
            ? "organizers"
            : "sponsors";
      const fileName = `${folderName}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(fileName);

      // Update the appropriate field with the new URL
      if (type === "event") {
        handleEventChange("image_url", publicUrl);
      } else if (type === "organizer") {
        handleEventChange("organizer_logo_url", publicUrl);
      } else if (typeof sponsorIndex === "number") {
        const updatedSponsors = [...(event.sponsor_logos || [])];
        updatedSponsors[sponsorIndex] = {
          ...updatedSponsors[sponsorIndex],
          url: publicUrl,
        };
        handleEventChange("sponsor_logos", updatedSponsors);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error uploading image. Please try again.");
    } finally {
      if (type === "event" || type === "organizer") {
        setUploadingImage(false);
      } else {
        setUploadingSponsorLogo(null);
      }
    }
  };

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

  const handleTicketTypeChange = (
    id: string,
    field: keyof TicketType,
    value: any,
  ) => {
    setTicketTypes((types) =>
      types.map((type) =>
        type.id === id ? { ...type, [field]: value } : type,
      ),
    );
  };

  const handleNewTicketTypeChange = (
    index: number,
    field: keyof NewTicketType,
    value: any,
  ) => {
    setNewTicketTypes((types) =>
      types.map((type, i) =>
        i === index ? { ...type, [field]: value } : type,
      ),
    );
  };

  const addNewTicketType = () => {
    setNewTicketTypes([
      ...newTicketTypes,
      { name: "", price: 0, is_active: true },
    ]);
  };

  const removeNewTicketType = (index: number) => {
    if (newTicketTypes.length <= 1) {
      setNewTicketTypes([{ name: "", price: 0, is_active: true }]);
    } else {
      setNewTicketTypes((types) => types.filter((_, i) => i !== index));
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
          sponsor_logos: event.sponsor_logos,
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
            is_active: ticketType.is_active,
          })
          .eq("id", ticketType.id);

        if (ticketTypeError) throw ticketTypeError;
      }

      // Add new ticket types
      const validNewTicketTypes = newTicketTypes.filter((type) =>
        type.name.trim(),
      );
      if (validNewTicketTypes.length > 0) {
        const ticketTypesData = validNewTicketTypes.map((type) => ({
          event_id: event.id,
          name: type.name.trim(),
          price: type.price,
          is_active: type.is_active,
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
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Error: {error}
          </h1>
          <Button onClick={() => router.push("/admin/events")}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button onClick={() => router.push("/admin/events")}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Edit Event
              </h1>
              <p className="text-gray-600 mt-1">Update your event details</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              onClick={() => router.push("/admin/events")}
            >
              Back to Events
            </Button>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              Event Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={event.title}
                  onChange={(e) => handleEventChange("title", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Event Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={event.date}
                  onChange={(e) => handleEventChange("date", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Event Time *
                </label>
                <input
                  type="time"
                  id="time"
                  value={event.time}
                  onChange={(e) => handleEventChange("time", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  value={event.location}
                  onChange={(e) =>
                    handleEventChange("location", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter event location"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={event.description}
                  onChange={(e) =>
                    handleEventChange("description", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  rows={4}
                  placeholder="Enter event description"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="image"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Event Image
                </label>
                {event.image_url && (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={event.image_url}
                      alt="Event"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "event")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingImage}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Upload an image (max 5MB) or enter URL below
                    </p>
                  </div>
                  <input
                    type="text"
                    id="image_url"
                    value={event.image_url || ""}
                    onChange={(e) =>
                      handleEventChange("image_url", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Or enter image URL"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Organizer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="organizer_name"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Organizer Name
                    </label>
                    <input
                      type="text"
                      id="organizer_name"
                      value={event.organizer_name || ""}
                      onChange={(e) =>
                        handleEventChange("organizer_name", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter organizer name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="organizer_logo"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Organizer Logo
                    </label>
                    {event.organizer_logo_url && (
                      <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={event.organizer_logo_url}
                          alt="Organizer Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "organizer")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          disabled={uploadingImage}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Upload a logo (max 5MB) or enter URL below
                        </p>
                      </div>
                      <input
                        type="text"
                        id="organizer_logo_url"
                        value={event.organizer_logo_url || ""}
                        onChange={(e) =>
                          handleEventChange(
                            "organizer_logo_url",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Or enter logo URL"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Sponsor Logos</Label>
                {event.sponsor_logos?.map((sponsor, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <Label>Sponsor Name</Label>
                      <Input
                        value={sponsor.name}
                        onChange={(e) => {
                          const updatedSponsors = [
                            ...(event.sponsor_logos || []),
                          ];
                          updatedSponsors[index] = {
                            ...sponsor,
                            name: e.target.value,
                          };
                          handleEventChange("sponsor_logos", updatedSponsors);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Logo</Label>
                      <div className="space-y-2">
                        {sponsor.url && (
                          <div className="relative w-full h-20">
                            <Image
                              src={sponsor.url}
                              alt={sponsor.name}
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={sponsor.url}
                            onChange={(e) => {
                              const updatedSponsors = [
                                ...(event.sponsor_logos || []),
                              ];
                              updatedSponsors[index] = {
                                ...sponsor,
                                url: e.target.value,
                              };
                              handleEventChange(
                                "sponsor_logos",
                                updatedSponsors,
                              );
                            }}
                            placeholder="Logo URL"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "sponsor", index)
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingSponsorLogo === index}
                            />
                            <Button
                              type="button"
                              disabled={uploadingSponsorLogo === index}
                            >
                              {uploadingSponsorLogo === index
                                ? "Uploading..."
                                : "Upload"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-6"
                      onClick={() => {
                        const updatedSponsors = event.sponsor_logos?.filter(
                          (_, i) => i !== index,
                        );
                        handleEventChange("sponsor_logos", updatedSponsors);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const updatedSponsors = [
                      ...(event.sponsor_logos || []),
                      { name: "", url: "" },
                    ];
                    handleEventChange("sponsor_logos", updatedSponsors);
                  }}
                >
                  Add Sponsor
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={event.is_published}
                  onChange={(e) =>
                    handleEventChange("is_published", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
          </div>

          {/* Ticket Types Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ticket Types
                </h3>
                <button
                  type="button"
                  onClick={addNewTicketType}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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

              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => (
                    <div
                      key={ticketType.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ticket Name *
                        </label>
                        <input
                          type="text"
                          value={ticketType.name}
                          onChange={(e) =>
                            handleTicketTypeChange(
                              ticketType.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (UGX)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={ticketType.price}
                          onChange={(e) =>
                            handleTicketTypeChange(
                              ticketType.id,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-3 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={ticketType.is_active}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                ticketType.id,
                                "is_active",
                                e.target.checked,
                              )
                            }
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Active
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteTicketType(ticketType.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          disabled={isDeletingTicket === ticketType.id}
                        >
                          {isDeletingTicket === ticketType.id ? (
                            <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No existing ticket types</p>
              )}

              {newTicketTypes.some((type) => type.name.trim()) && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    New Ticket Types
                  </h4>
                  <div className="space-y-4">
                    {newTicketTypes.map((ticketType, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="md:col-span-5">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ticket Name
                          </label>
                          <input
                            type="text"
                            value={ticketType.name}
                            onChange={(e) =>
                              handleNewTicketTypeChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., General Admission, VIP"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (UGX)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={ticketType.price}
                            onChange={(e) =>
                              handleNewTicketTypeChange(
                                index,
                                "price",
                                Number(e.target.value),
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0 for free"
                          />
                        </div>

                        <div className="md:col-span-3 flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={ticketType.is_active}
                              onChange={(e) =>
                                handleNewTicketTypeChange(
                                  index,
                                  "is_active",
                                  e.target.checked,
                                )
                              }
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Active
                            </span>
                          </label>
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeNewTicketType(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="px-6 py-3 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
