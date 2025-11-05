"use client";

import { useState, useEffect, useRef } from "react";
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
  sponsor_logos?: Array<{ name: string; url: string }>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

      // Set image preview if there's an existing image
      if (eventData.image_url) {
        setImagePreview(eventData.image_url);
      }

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum file size is 5MB.");
      return;
    }

    setSelectedImage(file);
    
    // Generate preview
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    handleEventChange("image_url", preview);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `events/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Instead of checking if bucket exists, directly attempt to upload
      // This avoids issues with listBuckets permissions or other problems
      const { data, error } = await supabase.storage
        .from('gallery')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      let imageUrl = event.image_url;

      // Upload image if a new one was selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      // Update event details
      const { error: eventError } = await supabase
        .from("events")
        .update({
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          image_url: imageUrl,
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

      // Add new ticket types - only if there are valid ticket types with names
      const validNewTicketTypes = newTicketTypes.filter(type => type.name.trim() !== "");
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
      // Reset image selection
      setSelectedImage(null);
      // Reload data
      await loadEventAndTickets();

    } catch (err) {
      console.error("Error updating event:", err);
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSponsorChange = (index: number, field: keyof Event['sponsor_logos'][0], value: string) => {
    if (!event) return;
    
    const updatedSponsors = [...(event.sponsor_logos || [])];
    updatedSponsors[index] = {
      ...updatedSponsors[index],
      [field]: value
    };
    
    setEvent({
      ...event,
      sponsor_logos: updatedSponsors
    });
  };

  const addSponsor = () => {
    if (!event) return;
    
    setEvent({
      ...event,
      sponsor_logos: [...(event.sponsor_logos || []), { name: '', url: '' }]
    });
  };

  const removeSponsor = (index: number) => {
    if (!event) return;
    
    const updatedSponsors = [...(event.sponsor_logos || [])];
    updatedSponsors.splice(index, 1);
    
    setEvent({
      ...event,
      sponsor_logos: updatedSponsors
    });
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
                <Label htmlFor="image">Event Image</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <div className="flex items-start gap-6">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                    >
                      Choose Image
                    </Button>
                    {(imagePreview || event.image_url) && (
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500 mb-2">Preview:</div>
                        <img
                          src={imagePreview || event.image_url || ""}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    JPEG, PNG, GIF, or WebP (max 5MB)
                  </p>
                </div>
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

          {/* Organizer Information */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Organizer Information</h2>
            
            <div className="space-y-4">
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
            </div>
          </div>

          {/* Sponsor Logos */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sponsor Logos</h2>
              <Button type="button" onClick={addSponsor} variant="outline" size="sm">
                Add Sponsor
              </Button>
            </div>
            
            <div className="space-y-4">
              {event.sponsor_logos && event.sponsor_logos.length > 0 ? (
                event.sponsor_logos.map((sponsor, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Sponsor Name</Label>
                        <Input
                          value={sponsor.name}
                          onChange={(e) => handleSponsorChange(index, "name", e.target.value)}
                          placeholder="Sponsor name"
                        />
                      </div>
                      <div>
                        <Label>Sponsor Logo URL</Label>
                        <Input
                          value={sponsor.url}
                          onChange={(e) => handleSponsorChange(index, "url", e.target.value)}
                          placeholder="Sponsor logo URL"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={() => removeSponsor(index)}
                        variant="outline"
                        size="sm"
                      >
                        Remove Sponsor
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No sponsors added</p>
              )}
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
                      <Label>Ticket Name</Label>
                      <Input
                        value={ticketType.name}
                        onChange={(e) =>
                          handleTicketTypeChange(ticketType.id, "name", e.target.value)
                        }
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
              <Button type="button" onClick={addNewTicketType} variant="outline" size="sm">
                Add Ticket Type
              </Button>
            </div>

            <div className="space-y-4">
              {newTicketTypes.map((ticketType, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="md:col-span-5">
                    <Label>Ticket Name</Label>
                    <Input
                      value={ticketType.name}
                      onChange={(e) => handleNewTicketTypeChange(index, "name", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Price (UGX)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={ticketType.price}
                      onChange={(e) => handleNewTicketTypeChange(index, "price", Number(e.target.value))}
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ticketType.is_active}
                        onChange={(e) => handleNewTicketTypeChange(index, "is_active", e.target.checked)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                  </div>

                  <div className="md:col-span-1 flex items-center">
                    <Button
                      type="button"
                      onClick={() => removeNewTicketType(index)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
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