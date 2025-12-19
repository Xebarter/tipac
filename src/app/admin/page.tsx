"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [name, value] = cookie.split("=");
      acc[name] = value;
      return acc;
    }, {} as {[key: string]: string});
    
    if (!cookies['admin_session']) {
      router.push('/admin/login');
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
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/admin/login');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
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
        </div>
      </main>
    </div>
  );
}

function DashboardOverview({ events, messages, galleryImages, tickets }: { 
  events: any[], 
  messages: any[], 
  galleryImages: any[], 
  tickets: any[] 
}) {
  // Calculate ticket counts
  const onlineTickets = tickets.filter((ticket: any) => ticket && ticket.purchase_channel === 'online').length;
  const batchTickets = tickets.filter((ticket: any) => ticket && ticket.purchase_channel === 'physical_batch').length;
  
  const stats = [
    { name: "Events", value: events.length, href: "/admin/events" },
    { name: "Messages", value: messages.length, href: "/admin/messages" },
    { name: "Gallery Images", value: galleryImages.length, href: "/admin/gallery" },
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
      href: "/admin/tickets" 
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
            <dt className="text-base font-normal text-muted-foreground">{stat.name}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </dd>
          </div>
        </Link>
      ))}
    </div>
  );
}