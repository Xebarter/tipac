"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string;
  created_at: string;
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

// Add the TicketType interface for event ticket types
interface TicketType {
  id: string;
  created_at: string;
  event_id: string;
  name: string;
  price: number;
  is_active: boolean;
}

// Define interface for ticket types during event creation
interface NewTicketType {
  name: string;
  price: number;
  is_active: boolean;
}

export default function AdminEventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showTicketForm, setShowTicketForm] = useState<{
    eventId: string;
    show: boolean;
  } | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [newTicketType, setNewTicketType] = useState({
    name: "",
    price: 0,
    is_active: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for new event
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image_url: "",
    is_published: true,
    organizer_name: "",
    organizer_logo_url: "",
    sponsor_logos: [] as Array<{ url: string; name: string }>,
  });

  // File upload states
  const [organizerLogoFile, setOrganizerLogoFile] = useState<File | null>(null);
  const [sponsorLogoFiles, setSponsorLogoFiles] = useState<Map<number, File>>(
    new Map(),
  );

  // File upload states for editing events
  const [editingOrganizerLogoFile, setEditingOrganizerLogoFile] =
    useState<File | null>(null);
  const [editingSponsorLogoFiles, setEditingSponsorLogoFiles] = useState<
    Map<number, File>
  >(new Map());

  // State for ticket types during event creation
  const [eventTicketTypes, setEventTicketTypes] = useState<NewTicketType[]>([
    { name: "", price: 0, is_active: true },
  ]);

  // Load events
  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      setEvents(data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load ticket types for all events
  const loadTicketTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setTicketTypes(data || []);
    } catch (err) {
      console.error("Error loading ticket types:", err);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadTicketTypes();
  }, [loadEvents, loadTicketTypes]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setNewEvent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle ticket type input changes
  const handleTicketTypeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setNewTicketType((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price"
            ? Number(value)
            : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum file size is 5MB.");
      return;
    }

    // Generate preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  // Handle event ticket type input changes
  const handleEventTicketTypeChange = (
    index: number,
    field: keyof NewTicketType,
    value: string | number | boolean,
  ) => {
    const updatedTicketTypes = [...eventTicketTypes];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    setEventTicketTypes(updatedTicketTypes);
  };

  // Add a new ticket type row during event creation
  const addEventTicketType = () => {
    setEventTicketTypes([
      ...eventTicketTypes,
      { name: "", price: 0, is_active: true },
    ]);
  };

  // Remove a ticket type row during event creation
  const removeEventTicketType = (index: number) => {
    if (eventTicketTypes.length <= 1) {
      // If it's the last one, reset it instead of removing
      setEventTicketTypes([{ name: "", price: 0, is_active: true }]);
      return;
    }

    const updatedTicketTypes = [...eventTicketTypes];
    updatedTicketTypes.splice(index, 1);
    setEventTicketTypes(updatedTicketTypes);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `events/${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("gallery").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !newEvent.title.trim() ||
        !newEvent.date ||
        !newEvent.location.trim()
      ) {
        throw new Error("Title, date, and location are required");
      }

      // Upload organizer logo if file is selected
      let organizerLogoUrl = newEvent.organizer_logo_url;
      if (organizerLogoFile) {
        organizerLogoUrl = await uploadImage(organizerLogoFile);
      }

      // Upload sponsor logos if files are selected
      const updatedSponsors = [...newEvent.sponsor_logos];
      for (let i = 0; i < updatedSponsors.length; i++) {
        const file = sponsorLogoFiles.get(i);
        if (file) {
          const url = await uploadImage(file);
          updatedSponsors[i].url = url;
        }
      }

      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location.trim(),
        image_url: newEvent.image_url || null,
        is_published: newEvent.is_published,
        organizer_name: newEvent.organizer_name || null,
        organizer_logo_url: organizerLogoUrl || null,
        sponsor_logos: updatedSponsors.length > 0 ? updatedSponsors : null,
      };

      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      // Create ticket types if provided
      if (eventTicketTypes.some((type) => type.name.trim())) {
        const validTicketTypes = eventTicketTypes.filter((type) =>
          type.name.trim(),
        );
        const ticketTypesData = validTicketTypes.map((type) => ({
          event_id: data.id,
          name: type.name.trim(),
          price: type.price,
          is_active: type.is_active,
        }));

        const { error: ticketTypeError } = await supabase
          .from("ticket_types")
          .insert(ticketTypesData);

        if (ticketTypeError) throw ticketTypeError;
      }

      setSuccess("Event created successfully!");
      setShowCreateForm(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ticket type creation
  const handleCreateTicketType = async (eventId: string) => {
    if (!newTicketType.name) {
      setError("Please enter a ticket type name.");
      return;
    }

    if (newTicketType.price < 0) {
      setError("Price must be zero or positive.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const ticketTypeData = {
        event_id: eventId,
        name: newTicketType.name,
        price: newTicketType.price,
        is_active: newTicketType.is_active,
      };

      const { data, error } = await supabase
        .from("ticket_types")
        .insert([ticketTypeData])
        .select();

      if (error) throw error;

      setSuccess(`Ticket type "${newTicketType.name}" created successfully!`);
      setNewTicketType({
        name: "",
        price: 0,
        is_active: true,
      });

      setShowTicketForm(null);

      // Reload ticket types
      await loadTicketTypes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      setSuccess("Event deleted successfully!");

      // Reload events
      await loadEvents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    }
  };

  // Handle editing an existing event
  const startEditingEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      date: event.date,
      time: event.time || "",
      location: event.location,
      image_url: event.image_url || "",
      is_published: event.is_published,
      organizer_name: event.organizer_name || "",
      organizer_logo_url: event.organizer_logo_url || "",
      sponsor_logos: event.sponsor_logos || [],
    });
    setShowCreateForm(true);

    // Reset ticket types for this event
    setEventTicketTypes([{ name: "", price: 0, is_active: true }]);
  };

  // Handle updating an existing event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload organizer logo if file is selected
      let organizerLogoUrl = editingEvent.organizer_logo_url;
      if (editingOrganizerLogoFile) {
        organizerLogoUrl = await uploadImage(editingOrganizerLogoFile);
      }

      // Upload sponsor logos if files are selected
      const updatedSponsors = [...(editingEvent.sponsor_logos || [])];
      for (let i = 0; i < updatedSponsors.length; i++) {
        const file = editingSponsorLogoFiles.get(i);
        if (file) {
          const url = await uploadImage(file);
          updatedSponsors[i].url = url;
        }
      }

      const { data, error } = await supabase
        .from("events")
        .update({
          title: editingEvent.title.trim(),
          description: editingEvent.description.trim(),
          date: editingEvent.date,
          time: editingEvent.time,
          location: editingEvent.location.trim(),
          image_url: editingEvent.image_url || null,
          is_published: editingEvent.is_published,
          organizer_name: editingEvent.organizer_name || null,
          organizer_logo_url: organizerLogoUrl || null,
          sponsor_logos:
            updatedSponsors && updatedSponsors.length > 0
              ? updatedSponsors
              : null,
        })
        .eq("id", editingEvent.id)
        .select()
        .single();

      if (error) throw error;

      setSuccess("Event updated successfully!");
      setEditingEvent(null);
      setEditingOrganizerLogoFile(null);
      setEditingSponsorLogoFiles(new Map());
      loadEvents();
    } catch (err: any) {
      console.error("Error updating event:", err);
      setError(err.message || "Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = Number.parseInt(hours, 10);
    return hour > 12 ? `${hour - 12}:${minutes} PM` : `${hour}:${minutes} AM`;
  };

  // Get ticket types for a specific event
  const getEventTicketTypes = (eventId: string) => {
    return ticketTypes.filter((ticketType) => ticketType.event_id === eventId);
  };

  // Toggle ticket type form visibility
  const toggleTicketTypeForm = (eventId: string) => {
    if (showTicketForm?.eventId === eventId && showTicketForm?.show) {
      setShowTicketForm({ eventId, show: false });
    } else {
      setShowTicketForm({ eventId, show: true });
      // Reset form when opening
      setNewTicketType({
        name: "",
        price: 0,
        is_active: true,
      });
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      image_url: "",
      is_published: true,
      organizer_name: "",
      organizer_logo_url: "",
      sponsor_logos: [],
    });
    setEventTicketTypes([{ name: "", price: 0, is_active: true }]);
    setPreviewUrl(null);
    setOrganizerLogoFile(null);
    setSponsorLogoFiles(new Map());
  };

  // Clean up file states when editing modal is closed
  useEffect(() => {
    if (!editingEvent) {
      setEditingOrganizerLogoFile(null);
      setEditingSponsorLogoFiles(new Map());
    }
  }, [editingEvent]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Events Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all your events with ease
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {showCreateForm ? (
                <>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
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
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>

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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
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

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h2>
            <form
              onSubmit={editingEvent ? handleEditEvent : handleCreateEvent}
              className="space-y-6"
            >
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
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
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
                    name="date"
                    value={newEvent.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Event Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={newEvent.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Image
                  </label>
                  {previewUrl && (
                    <div className="mb-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 sm:h-52 object-cover rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  {editingEvent && editingEvent.image_url && !previewUrl && (
                    <div className="mb-4">
                      <img
                        src={editingEvent.image_url}
                        alt="Current"
                        className="w-full h-48 sm:h-52 object-cover rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload an image (max 5MB) or enter URL below
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="image_url"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Image URL
                  </label>
                  <input
                    type="text"
                    id="image_url"
                    name="image_url"
                    value={newEvent.image_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Or enter image URL"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    If both image and URL are provided, uploaded image will be
                    used
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_published"
                    name="is_published"
                    type="checkbox"
                    checked={newEvent.is_published}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="is_published"
                    className="ml-3 block text-sm font-medium text-gray-900"
                  >
                    Publish immediately
                  </label>
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
                    name="description"
                    rows={4}
                    value={newEvent.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
                    placeholder="Enter event description"
                  />
                </div>
              </div>

              {/* Organizer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Organizer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Name
                    </label>
                    <input
                      type="text"
                      value={newEvent.organizer_name}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          organizer_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter organizer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Logo URL
                    </label>
                    <input
                      type="text"
                      value={newEvent.organizer_logo_url}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          organizer_logo_url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter organizer logo URL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organizer Logo Upload
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setOrganizerLogoFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Upload organizer logo image (optional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sponsor Logos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Sponsor Logos</h3>
                <div className="space-y-4">
                  {newEvent.sponsor_logos.map((sponsor, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sponsor Name
                          </label>
                          <input
                            type="text"
                            value={sponsor.name}
                            onChange={(e) => {
                              const updatedSponsors = [
                                ...newEvent.sponsor_logos,
                              ];
                              updatedSponsors[index].name = e.target.value;
                              setNewEvent({
                                ...newEvent,
                                sponsor_logos: updatedSponsors,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Sponsor name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sponsor Logo URL
                          </label>
                          <input
                            type="text"
                            value={sponsor.url}
                            onChange={(e) => {
                              const updatedSponsors = [
                                ...newEvent.sponsor_logos,
                              ];
                              updatedSponsors[index].url = e.target.value;
                              setNewEvent({
                                ...newEvent,
                                sponsor_logos: updatedSponsors,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Sponsor logo URL"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sponsor Logo Upload
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const newMap = new Map(sponsorLogoFiles);
                                newMap.set(index, e.target.files[0]);
                                setSponsorLogoFiles(newMap);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Upload sponsor logo image (optional)
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSponsors = [...newEvent.sponsor_logos];
                            updatedSponsors.splice(index, 1);
                            setNewEvent({
                              ...newEvent,
                              sponsor_logos: updatedSponsors,
                            });

                            // Clean up file reference
                            const newMap = new Map(sponsorLogoFiles);
                            newMap.delete(index);
                            setSponsorLogoFiles(newMap);
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        >
                          Remove Sponsor
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setNewEvent({
                        ...newEvent,
                        sponsor_logos: [
                          ...newEvent.sponsor_logos,
                          { name: "", url: "" },
                        ],
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Add Sponsor
                  </button>
                </div>
              </div>

              {/* Ticket Types Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ticket Types
                  </h3>
                  <button
                    type="button"
                    onClick={addEventTicketType}
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

                <div className="space-y-4">
                  {eventTicketTypes.map((ticketType, index) => (
                    <div
                      key={index}
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
                            handleEventTicketTypeChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            handleEventTicketTypeChange(
                              index,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0 for free"
                        />
                      </div>

                      <div className="md:col-span-3 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={ticketType.is_active}
                            onChange={(e) =>
                              handleEventTicketTypeChange(
                                index,
                                "is_active",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Active
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={() => removeEventTicketType(index)}
                          className="text-red-500 hover:text-red-700"
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

                <p className="mt-2 text-sm text-gray-500">
                  {editingEvent
                    ? "Add new ticket types for this event. Existing ticket types will not be affected."
                    : "Create different ticket types for this event. You can add more ticket types later if needed."}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                    setNewEvent({
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      location: "",
                      image_url: "",
                      is_published: true,
                      organizer_name: "",
                      organizer_logo_url: "",
                      sponsor_logos: [],
                    });
                    setEventTicketTypes([
                      { name: "", price: 0, is_active: true },
                    ]);
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="px-6 py-3 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {editingEvent ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
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
                      {editingEvent ? "Update Event" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              All Events
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {events.length} events found
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 px-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No events
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new event.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Event
                    </th>
                    <th
                      scope="col"
                      className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Ticket Types
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => {
                    const eventTickets = getEventTicketTypes(event.id);
                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {event.image_url && (
                              <img
                                src={event.image_url}
                                alt=""
                                className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {event.title}
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-1 mt-1">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(event.date)}
                          </div>
                          {event.time && (
                            <div className="text-sm text-gray-500">
                              {formatTime(event.time)}
                            </div>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 truncate max-w-32">
                            {event.location}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              event.is_published
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {event.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {eventTickets.length > 0 ? (
                            <div className="space-y-1">
                              {eventTickets.map((ticket) => (
                                <div key={ticket.id} className="text-sm">
                                  <span className="font-medium">
                                    {ticket.name}
                                  </span>
                                  :{" "}
                                  <span className="text-gray-600">
                                    {ticket.price > 0
                                      ? `UGX ${ticket.price.toLocaleString()}`
                                      : "Free"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              No ticket types
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1.5 transition-colors duration-200 mr-2"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md p-1.5 transition-colors duration-200"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Edit Event</h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEditEvent}>
                  {/* Basic Event Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={editingEvent.location}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={editingEvent.time}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            time: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingEvent.description}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={editingEvent.image_url || ""}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          image_url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Organizer Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Organizer Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organizer Name
                        </label>
                        <input
                          type="text"
                          value={editingEvent.organizer_name || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              organizer_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter organizer name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organizer Logo URL
                        </label>
                        <input
                          type="text"
                          value={editingEvent.organizer_logo_url || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              organizer_logo_url: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter organizer logo URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Organizer Logo Upload
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditingOrganizerLogoFile(
                              e.target.files?.[0] || null,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Upload organizer logo image (optional)
                        </p>
                        {editingEvent.organizer_logo_url && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Current logo:
                            </p>
                            <img
                              src={editingEvent.organizer_logo_url}
                              alt="Organizer logo"
                              className="h-16 mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sponsor Logos */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Sponsor Logos
                    </h3>
                    <div className="space-y-4">
                      {(editingEvent.sponsor_logos || []).map(
                        (sponsor, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-md p-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Sponsor Name
                                </label>
                                <input
                                  type="text"
                                  value={sponsor.name}
                                  onChange={(e) => {
                                    const updatedSponsors = [
                                      ...(editingEvent.sponsor_logos || []),
                                    ];
                                    updatedSponsors[index].name =
                                      e.target.value;
                                    setEditingEvent({
                                      ...editingEvent,
                                      sponsor_logos: updatedSponsors,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Sponsor name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Sponsor Logo URL
                                </label>
                                <input
                                  type="text"
                                  value={sponsor.url}
                                  onChange={(e) => {
                                    const updatedSponsors = [
                                      ...(editingEvent.sponsor_logos || []),
                                    ];
                                    updatedSponsors[index].url = e.target.value;
                                    setEditingEvent({
                                      ...editingEvent,
                                      sponsor_logos: updatedSponsors,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Sponsor logo URL"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Sponsor Logo Upload
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      const newMap = new Map(
                                        editingSponsorLogoFiles,
                                      );
                                      newMap.set(index, e.target.files[0]);
                                      setEditingSponsorLogoFiles(newMap);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                  Upload sponsor logo image (optional)
                                </p>
                                {sponsor.url && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-600">
                                      Current logo:
                                    </p>
                                    <img
                                      src={sponsor.url}
                                      alt={`Sponsor ${sponsor.name}`}
                                      className="h-12 mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSponsors = [
                                    ...(editingEvent.sponsor_logos || []),
                                  ];
                                  updatedSponsors.splice(index, 1);
                                  setEditingEvent({
                                    ...editingEvent,
                                    sponsor_logos: updatedSponsors,
                                  });

                                  // Clean up file reference
                                  const newMap = new Map(
                                    editingSponsorLogoFiles,
                                  );
                                  newMap.delete(index);
                                  setEditingSponsorLogoFiles(newMap);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                              >
                                Remove Sponsor
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSponsors =
                            editingEvent.sponsor_logos || [];
                          setEditingEvent({
                            ...editingEvent,
                            sponsor_logos: [
                              ...updatedSponsors,
                              { name: "", url: "" },
                            ],
                          });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Add Sponsor
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingEvent.is_published}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            is_published: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Published
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
