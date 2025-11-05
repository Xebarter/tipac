"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "./components/Sidebar";

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const cookies = document.cookie.split("; ").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.split("=");
        acc[name] = value;
        return acc;
      },
      {} as { [key: string]: string },
    );

    if (!cookies["admin_session"]) {
      router.push("/admin/login");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    // Fetch events count
    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Fetch unread messages count
    const { count: messagesCount } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Fetch gallery images count
    const { count: galleryCount } = await supabase
      .from("gallery_images")
      .select("*", { count: "exact", head: true });

    // Fetch tickets data for counting
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select("purchase_channel");

    setEvents(Array(eventsCount).fill(null));
    setMessages(Array(messagesCount).fill(null));
    setGalleryImages(Array(galleryCount).fill(null));
    setTickets(ticketsData || []);
  };

  const handleLogout = () => {
    // Remove the admin session cookie
    document.cookie =
      "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin/login");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

          <DashboardOverview
            events={events}
            messages={messages}
            galleryImages={galleryImages}
            tickets={tickets}
          />

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/admin/messages"
                className="bg-card p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">Messages</h3>
                <p className="text-muted-foreground">
                  View and manage messages
                </p>
              </Link>

              <Link
                href="/admin/events"
                className="bg-card p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">Events</h3>
                <p className="text-muted-foreground">
                  Manage events and participants
                </p>
              </Link>

              <Link
                href="/admin/gallery"
                className="bg-card p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">Gallery</h3>
                <p className="text-muted-foreground">Manage gallery images</p>
              </Link>

              <Link
                href="/admin/tickets"
                className="bg-card p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">Tickets</h3>
                <p className="text-muted-foreground">
                  View ticket sales and statistics
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardOverview({
  events,
  messages,
  galleryImages,
  tickets,
}: {
  events: any[];
  messages: any[];
  galleryImages: any[];
  tickets: any[];
}) {
  // Calculate ticket counts
  const onlineTickets = tickets.filter(
    (ticket: any) => ticket && ticket.purchase_channel === "online",
  ).length;
  const batchTickets = tickets.filter(
    (ticket: any) => ticket && ticket.purchase_channel === "physical_batch",
  ).length;

  const stats = [
    { name: "Events", value: events.length, href: "/admin/events" },
    { name: "Messages", value: messages.length, href: "/admin/messages" },
    {
      name: "Gallery Images",
      value: galleryImages.length,
      href: "/admin/gallery",
    },
    {
      name: "Tickets Available",
      value: (
        <div className="flex flex-col">
          <span className="text-2xl">{tickets.length}</span>
          <span className="text-xs font-normal text-muted-foreground mt-1">
            Online: {onlineTickets} | Batch: {batchTickets}
          </span>
        </div>
      ),
      href: "/admin/tickets",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Link
          key={index}
          href={stat.href}
          className="overflow-hidden rounded-lg bg-card shadow hover:shadow-md transition-shadow"
        >
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-muted-foreground">
              {stat.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </dd>
          </div>
        </Link>
      ))}
    </div>
  );
}

function GalleryManagement() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from("gallery_images")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setImages(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch gallery images from Supabase:", error);
        // Fallback to API
        try {
          const res = await fetch("/admin/api/gallery");
          const data = await res.json();
          setImages(data.images || []);
          setLoading(false);
        } catch (apiError) {
          console.error("Failed to fetch gallery images from API:", apiError);
          setLoading(false);
        }
      }
    };

    fetchImages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      // Get image data first to get the filename
      const { data: imageData, error: fetchError } = await supabase
        .from("gallery_images")
        .select("filename")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from database
      const { error: deleteError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Delete from storage
      if (imageData?.filename) {
        const { error: storageError } = await supabase.storage
          .from("gallery")
          .remove([imageData.filename]);

        if (storageError) {
          console.warn("Could not remove file from storage:", storageError);
          // Continue even if storage deletion fails
        }
      }

      setImages(images.filter((img) => img.id !== id));
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${Math.random().toString(36)}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("gallery").getPublicUrl(fileName);

        // Insert record into gallery_images table
        const { data, error: insertError } = await supabase
          .from("gallery_images")
          .insert([
            {
              url: publicUrl,
              filename: fileName,
              original_name: file.name,
            },
          ])
          .select();

        if (insertError) throw insertError;

        // Update state with new image
        setImages([data[0], ...images]);
        successCount++;
      } catch (error) {
        console.error("Failed to upload image:", error);
        errorCount++;
      }
    }

    // Show result message
    if (successCount > 0) {
      alert(`${successCount} image(s) uploaded successfully!`);
    }
    if (errorCount > 0) {
      alert(
        `Failed to upload ${errorCount} image(s). Check console for details.`,
      );
    }

    // Reset the input
    e.target.value = "";
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Gallery Management
        </h2>
        <label className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md cursor-pointer">
          Upload Images
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            multiple
          />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div className="bg-muted border-2 border-dashed rounded-xl w-full h-40 flex items-center justify-center">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.original_name || "Gallery image"}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {image.original_name || image.filename}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-foreground truncate">
                  {image.original_name || image.filename}
                </h3>
                <div className="flex justify-between mt-2">
                  <button className="text-primary hover:text-primary/80 text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("date", { ascending: false });

        if (error) throw error;

        setEvents(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch events from Supabase:", error);
        // Fallback to API
        try {
          const res = await fetch("/admin/api/events");
          const data = await res.json();
          setEvents(data.events || []);
          setLoading(false);
        } catch (apiError) {
          console.error("Failed to fetch events from API:", apiError);
          setLoading(false);
        }
      }
    };

    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event");
    }
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Events Management
        </h2>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md">
          Create New Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Event
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {event.title || "Untitled Event"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {event.date
                        ? new Date(event.date).toLocaleDateString()
                        : "No date"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                      Published
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary hover:text-primary/80 mr-3">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-muted-foreground"
                  >
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TicketsManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            *,
            events (title)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTickets(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tickets from Supabase:", error);
        // Fallback to API
        try {
          const res = await fetch("/admin/api/tickets");
          const data = await res.json();
          setTickets(data.tickets || []);
          setLoading(false);
        } catch (apiError) {
          console.error("Failed to fetch tickets from API:", apiError);
          setLoading(false);
        }
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Ticket Management
        </h2>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md">
          Generate Tickets
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Event
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Purchaser
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {ticket.events?.title ||
                        ticket.event?.title ||
                        "Unknown Event"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {ticket.email || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {ticket.quantity || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                      {ticket.status || "Confirmed"}
                    </span>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-muted-foreground"
                  >
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
