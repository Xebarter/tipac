"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  created_at: string;
  event_id: string;
  ticket_type_id: string | null;
  email: string;
  quantity: number;
  status: string;
  pesapal_transaction_id: string | null;
  pesapal_status: string | null;
  price: number;
  purchase_channel: string;
  batch_code: string | null;
  is_active: boolean;
  buyer_name: string | null;
  buyer_phone: string | null;
  used: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
}

interface Batch {
  id: string;
  created_at: string;
  batch_code: string;
  event_id: string;
  num_tickets: number;
  is_active: boolean;
}

type TicketViewerData = {
  id: string;
  event: {
    title: string;
    date: string;
    location: string;
    organizer_name?: string | null;
    organizer_logo_url?: string | null;
    sponsor_logos?: Array<{ url: string; name: string }>;
  };
  buyer_name: string;
  buyer_phone: string;
  purchase_channel: string;
  confirmation_code?: string | null;
};

export default function AdminTicketsDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketsTotalCount, setTicketsTotalCount] = useState<number | null>(null);
  const [ticketsHasMore, setTicketsHasMore] = useState(true);
  const [ticketsPageSize] = useState(50);
  const [ticketsPageLoading, setTicketsPageLoading] = useState(false);
  const [searchTickets, setSearchTickets] = useState<Ticket[]>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPageSize] = useState(50);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'batches' | 'used' | 'customers' | 'generate'>('tickets');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | "online" | "physical_batch">("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<TicketViewerData | null>(null);
  const [viewerQrDataUrl, setViewerQrDataUrl] = useState<string | null>(null);
  const [viewerActionLoading, setViewerActionLoading] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalTickets: 0,
    onlineTickets: 0,
    batchTickets: 0,
    usedTickets: 0,
    totalRevenue: null as number | null
  });
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Form state for batch generation
  const [batchForm, setBatchForm] = useState({
    event_id: '',
    num_tickets: 10,
    batch_code: '',
    price: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const eventTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const ev of events) m.set(ev.id, ev.title);
    return m;
  }, [events]);

  const loadEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date')
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadTicketCounts = async () => {
    // Counts are cheap compared to downloading all rows.
    try {
      const [{ count: total }, { count: online }, { count: batch }, { count: used }] = await Promise.all([
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("purchase_channel", "online"),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("purchase_channel", "physical_batch"),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("used", true),
      ]);

      setTicketsTotalCount(total ?? 0);
      setStats((prev) => ({
        ...prev,
        totalTickets: total ?? 0,
        onlineTickets: online ?? 0,
        batchTickets: batch ?? 0,
        usedTickets: used ?? 0,
        // Revenue requires a server-side aggregate of (price * quantity). Keep it null for now to avoid heavy full-table scans/downloads.
        totalRevenue: prev.totalRevenue,
      }));
    } catch (err) {
      console.error("Failed to load ticket counts:", err);
    }
  };

  const loadOnlineRevenue = async () => {
    // Supabase/PostgREST doesn't support SUM(price*quantity) directly without a DB function/view.
    // We compute it client-side but only for successful online sales and only selecting needed columns,
    // paging to avoid a single huge response.
    setRevenueLoading(true);
    try {
      const { count, error: countErr } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("purchase_channel", "online")
        .eq("status", "confirmed");

      if (countErr) throw countErr;

      const total = count ?? 0;
      if (total === 0) {
        setStats((prev) => ({ ...prev, totalRevenue: 0 }));
        return;
      }

      const pageSize = 1000;
      let sum = 0;
      for (let from = 0; from < total; from += pageSize) {
        const to = Math.min(from + pageSize - 1, total - 1);
        const { data, error } = await supabase
          .from("tickets")
          .select("price, quantity")
          .eq("purchase_channel", "online")
          .eq("status", "confirmed")
          .range(from, to);

        if (error) throw error;
        for (const row of data || []) {
          const price = Number((row as any).price) || 0;
          const qty = Number((row as any).quantity) || 0;
          sum += price * qty;
        }
      }

      setStats((prev) => ({ ...prev, totalRevenue: sum }));
    } catch (err) {
      console.error("Failed to load online revenue:", err);
      // Keep dash if revenue fails, but don't break the page.
      setStats((prev) => ({ ...prev, totalRevenue: null }));
    } finally {
      setRevenueLoading(false);
    }
  };

  const loadTicketsPage = async (opts?: { reset?: boolean }) => {
    const reset = opts?.reset ?? false;
    if (ticketsPageLoading) return;
    if (!reset && !ticketsHasMore) return;

    setTicketsPageLoading(true);
    try {
      const currentCount = reset ? 0 : tickets.length;

      // IMPORTANT: The UI filters tickets client-side by tab (Active vs Used).
      // If we page through "all tickets", a page can contain 0 rows matching the current tab,
      // which looks like the "Load more" button isn't working.
      // To avoid that, we may fetch multiple pages until we actually bring in new visible rows.
      const wantUsed =
        activeTab === "tickets" ? false : activeTab === "used" ? true : null;

      let accumulated: Ticket[] = [];
      let cursorFrom = currentCount;
      let hasMore = true;
      let attempts = 0;

      while (hasMore && attempts < 6) {
        const cursorTo = cursorFrom + ticketsPageSize - 1;

        const { data, error: ticketsError } = await supabase
          .from("tickets")
          .select(
            "id, created_at, event_id, ticket_type_id, email, quantity, status, pesapal_transaction_id, pesapal_status, price, purchase_channel, batch_code, is_active, buyer_name, buyer_phone, used"
          )
          .order("created_at", { ascending: false })
          .range(cursorFrom, cursorTo);

        if (ticketsError) throw ticketsError;

        const page = (data || []) as Ticket[];
        if (page.length === 0) {
          hasMore = false;
          break;
        }

        accumulated = accumulated.concat(page);

        // Stop early once we've added at least one row that will be visible in this tab,
        // or once we've loaded enough data for a "page" worth of results.
        const visibleAdded =
          wantUsed == null ? page.length : page.filter((t) => t.used === wantUsed).length;

        if (visibleAdded > 0 || accumulated.length >= ticketsPageSize) {
          break;
        }

        // If the backend returned less than the requested range, we've reached the end.
        if (page.length < ticketsPageSize) {
          hasMore = false;
          break;
        }

        cursorFrom += ticketsPageSize;
        attempts += 1;
      }

      setTickets((prev) => (reset ? accumulated : [...prev, ...accumulated]));

      const got = accumulated.length;
      if (!hasMore || got < ticketsPageSize) {
        setTicketsHasMore(false);
      } else if (ticketsTotalCount != null) {
        setTicketsHasMore(currentCount + got < ticketsTotalCount);
      }
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setTicketsPageLoading(false);
    }
  };

  const loadSearchPage = async (opts?: { reset?: boolean }) => {
    const reset = opts?.reset ?? false;
    const q = searchQuery.trim();
    if (!q) {
      setSearchTickets([]);
      setSearchHasMore(false);
      return;
    }
    if (searchLoading) return;
    if (!reset && !searchHasMore) return;

    setSearchLoading(true);
    try {
      const currentCount = reset ? 0 : searchTickets.length;
      const from = currentCount;
      const to = currentCount + searchPageSize - 1;

      const wantUsed =
        activeTab === "tickets" ? false : activeTab === "used" ? true : null;

      let query = supabase
        .from("tickets")
        .select(
          "id, created_at, event_id, ticket_type_id, email, quantity, status, pesapal_transaction_id, pesapal_status, price, purchase_channel, batch_code, is_active, buyer_name, buyer_phone, used"
        )
        .order("created_at", { ascending: false })
        // Basic multi-field search (does not include event title; that’s derived client-side).
        .or(
          [
            `id.ilike.%${q}%`,
            `email.ilike.%${q}%`,
            `buyer_name.ilike.%${q}%`,
            `buyer_phone.ilike.%${q}%`,
            `batch_code.ilike.%${q}%`,
            `pesapal_transaction_id.ilike.%${q}%`,
          ].join(",")
        )
        .range(from, to);

      if (wantUsed != null) query = query.eq("used", wantUsed);
      if (eventFilter !== "all") query = query.eq("event_id", eventFilter);
      if (channelFilter !== "all") query = query.eq("purchase_channel", channelFilter);

      const { data, error: searchErr } = await query;
      if (searchErr) throw searchErr;

      const next = (data || []) as Ticket[];
      setSearchTickets((prev) => (reset ? next : [...prev, ...next]));
      setSearchHasMore(next.length === searchPageSize);
    } catch (err) {
      console.error("Error searching tickets:", err);
      setError(err instanceof Error ? err.message : "Failed to search tickets");
    } finally {
      setSearchLoading(false);
    }
  };

  const loadBatches = async () => {
    if (batchesLoading) return;
    setBatchesLoading(true);
    try {
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);
    } catch (err) {
      console.error("Error loading batches:", err);
      setError(err instanceof Error ? err.message : "Failed to load batches");
    } finally {
      setBatchesLoading(false);
    }
  };

  const refreshAll = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setTicketsHasMore(true);
    try {
      await Promise.all([loadEvents(), loadTicketCounts(), loadOnlineRevenue()]);
      await loadTicketsPage({ reset: true });
      if (activeTab === "batches") await loadBatches();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "batches") {
      // Load batches only when tab is opened (and refresh if empty).
      if (batches.length === 0) loadBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleBatchStatus = async (batchId: string, currentStatus: boolean) => {
    try {
      // Update batch status
      const { error: batchError } = await supabase
        .from('batches')
        .update({ is_active: !currentStatus })
        .eq('id', batchId);
      
      if (batchError) throw batchError;
      
      // Also update all tickets in this batch
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        const { error: ticketsError } = await supabase
          .from('tickets')
          .update({ is_active: !currentStatus })
          .eq('batch_code', batch.batch_code);
        
        if (ticketsError) throw ticketsError;
      }
      
      setSuccess(`Batch ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      
      // Reload data
      await refreshAll();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const activateAllTicketsInBatch = async (batchId: string, batchCode: string) => {
    try {
      // Update all tickets in this batch to be active
      const { error: ticketsError } = await supabase
        .from('tickets')
        .update({ is_active: true })
        .eq('batch_code', batchCode);
      
      if (ticketsError) throw ticketsError;
      
      setSuccess(`All tickets in batch activated successfully!`);
      
      // Reload data
      await refreshAll();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleDeleteBatch = async (batch: Batch) => {
    const ok = confirm(
      `Delete batch ${batch.batch_code}?\n\nThis will permanently delete the batch record and all tickets under this batch. This cannot be undone.`
    );
    if (!ok) return;

    try {
      setDeletingBatchId(batch.id);
      setError(null);
      setSuccess(null);

      // Delete tickets first to avoid FK constraints (if any).
      const { error: ticketsDeleteError } = await supabase
        .from("tickets")
        .delete()
        .eq("batch_code", batch.batch_code);

      if (ticketsDeleteError) throw ticketsDeleteError;

      const { error: batchDeleteError } = await supabase
        .from("batches")
        .delete()
        .eq("id", batch.id);

      if (batchDeleteError) throw batchDeleteError;

      await refreshAll();
      setSuccess(`Batch ${batch.batch_code} deleted.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete batch");
    } finally {
      setDeletingBatchId(null);
    }
  };

  const handleBatchFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchForm(prev => ({
      ...prev,
      [name]: name === 'num_tickets' || name === 'price' ? Number(value) : value
    }));
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tickets/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate batch tickets');
      }
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${batchForm.batch_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Batch tickets generated successfully!');
      setBatchForm({
        event_id: '',
        num_tickets: 10,
        batch_code: '',
        price: 0
      });
      
      // Reload data to show new batch
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEventTitle = (eventId: string) => {
    return eventTitleById.get(eventId) || 'Unknown Event';
  };

  const getBatchStatus = (batchCode: string | null) => {
    if (!batchCode) return 'N/A';
    const batch = batches.find(b => b.batch_code === batchCode);
    return batch ? (batch.is_active ? 'Active' : 'Inactive') : 'Not Found';
  };

  const openTicketViewer = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket);
      setViewerOpen(true);
      setViewerLoading(true);
      setViewerError(null);
      setViewerData(null);
      setViewerQrDataUrl(null);

      const [latestStatus, viewerResponse] = await Promise.all([
        supabase
          .from("tickets")
          .select("used, is_active, purchase_channel, created_at, event_id")
          .eq("id", ticket.id)
          .maybeSingle(),
        fetch(`/api/tickets/fetch/${ticket.id}`),
      ]);

      if (latestStatus.error) {
        // Non-fatal; we'll still show the modal with whatever we have.
        console.warn("Failed to refresh latest ticket status:", latestStatus.error);
      } else if (latestStatus.data) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...(latestStatus.data as Partial<Ticket>) } : prev));
      }

      const data = await viewerResponse.json().catch(() => null);
      if (!viewerResponse.ok || !data) {
        throw new Error(data?.error || "Failed to load ticket details");
      }

      setViewerData(data as TicketViewerData);

      // Generate QR code (client-side) for the ticket id.
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(ticket.id, {
        width: 420,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
      setViewerQrDataUrl(qr);
    } catch (err: any) {
      setViewerError(err?.message || "Failed to load ticket");
    } finally {
      setViewerLoading(false);
    }
  };

  const closeTicketViewer = () => {
    if (viewerActionLoading) return;
    setViewerOpen(false);
    setViewerError(null);
    setViewerData(null);
    setViewerQrDataUrl(null);
    setSelectedTicket(null);
  };

  const updateTicket = async (ticketId: string, patch: Partial<Ticket>) => {
    const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
    if (error) throw error;
  };

  const handleToggleUsed = async () => {
    if (!selectedTicket) return;
    try {
      setViewerActionLoading(true);
      await updateTicket(selectedTicket.id, { used: !selectedTicket.used } as any);
      await refreshAll();
      setSelectedTicket((prev) => (prev ? { ...prev, used: !prev.used } : prev));
      setSuccess(`Ticket marked as ${!selectedTicket.used ? "used" : "unused"}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setViewerError(err?.message || "Failed to update ticket");
    } finally {
      setViewerActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedTicket) return;
    try {
      setViewerActionLoading(true);
      await updateTicket(selectedTicket.id, { is_active: !selectedTicket.is_active } as any);
      await refreshAll();
      setSelectedTicket((prev) => (prev ? { ...prev, is_active: !prev.is_active } : prev));
      setSuccess(`Ticket ${!selectedTicket.is_active ? "activated" : "deactivated"}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setViewerError(err?.message || "Failed to update ticket");
    } finally {
      setViewerActionLoading(false);
    }
  };

  const handleDownloadTicketPdf = async () => {
    if (!viewerData) return;
    try {
      setViewerActionLoading(true);
      const { generateTicketPDF } = await import("@/lib/ticketGenerator");
      const blob = await generateTicketPDF(viewerData as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tipac-ticket-${viewerData.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err: any) {
      setViewerError(err?.message || "Failed to generate PDF");
    } finally {
      setViewerActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    const ok = confirm("Delete this ticket? This cannot be undone.");
    if (!ok) return;
    try {
      setViewerActionLoading(true);
      const { error } = await supabase.from("tickets").delete().eq("id", selectedTicket.id);
      if (error) throw error;
      await refreshAll();
      setSuccess("Ticket deleted.");
      setTimeout(() => setSuccess(null), 3000);
      closeTicketViewer();
    } catch (err: any) {
      setViewerError(err?.message || "Failed to delete ticket");
    } finally {
      setViewerActionLoading(false);
    }
  };

  // Filter tickets based on active tab
  const isSearchMode = searchQuery.trim().length > 0;
  const baseTickets = isSearchMode ? searchTickets : tickets;

  const filteredTickets = activeTab === 'tickets' 
    ? baseTickets.filter(t => t.used !== true)
    : activeTab === 'used'
    ? baseTickets.filter(t => t.used === true)
    : baseTickets;

  const visibleTickets = filteredTickets.filter((t) => {
    if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
    if (channelFilter !== "all" && t.purchase_channel !== channelFilter) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      t.id,
      t.email,
      t.buyer_name,
      t.buyer_phone,
      t.batch_code,
      t.pesapal_transaction_id,
      getEventTitle(t.event_id),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  // When searching, hit the DB so results aren’t limited to loaded pages.
  useEffect(() => {
    if (!(activeTab === "tickets" || activeTab === "used")) return;

    const q = searchQuery.trim();
    // Clear search results quickly when query is cleared.
    if (!q) {
      setSearchTickets([]);
      setSearchHasMore(false);
      setSearchLoading(false);
      return;
    }

    const handle = setTimeout(() => {
      loadSearchPage({ reset: true });
    }, 300);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, eventFilter, channelFilter, activeTab]);

  // Group tickets by customer for the customers tab
  const customers = tickets
    .filter(ticket => ticket.purchase_channel === 'online' && ticket.buyer_name && ticket.buyer_phone)
    .reduce((acc, ticket) => {
      const key = `${ticket.buyer_name}-${ticket.buyer_phone}`;
      if (!acc[key]) {
        acc[key] = {
          name: ticket.buyer_name,
          phone: ticket.buyer_phone,
          ticketsCount: 0,
        };
      }
      acc[key].ticketsCount += ticket.quantity;
      return acc;
    }, {} as Record<string, { name: string | null; phone: string | null; ticketsCount: number }>);

  const customersList = Object.values(customers);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tickets Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of all tickets, batches, and customers</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await refreshAll();
            }}
            disabled={isLoading || ticketsPageLoading || batchesLoading}
            aria-busy={isLoading || ticketsPageLoading || batchesLoading}
            aria-label={isLoading || ticketsPageLoading || batchesLoading ? "Refreshing…" : "Refresh data"}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading || ticketsPageLoading || batchesLoading ? (
              <svg className="h-4 w-4 animate-spin text-gray-700" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-7.745M19 5a9 9 0 00-14 7.745" />
              </svg>
            )}
            {isLoading || ticketsPageLoading || batchesLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="relative flex min-h-[96px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                Total tickets
              </p>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {stats.totalTickets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Online Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative flex min-h-[96px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                Online tickets
              </p>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {stats.onlineTickets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Batch Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-100/60 blur-2xl" />
          <div className="relative flex min-h-[96px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                Batch tickets
              </p>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {stats.batchTickets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Used Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="relative flex min-h-[96px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                Used tickets
              </p>
              <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {stats.usedTickets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Online Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-100/60 blur-2xl" />
          <div className="relative flex min-h-[96px] flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
                Online revenue
              </p>
              <div className="rounded-xl bg-green-50 p-2 text-green-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none break-words">
                {revenueLoading ? "Loading…" : stats.totalRevenue == null ? "—" : `UGX ${stats.totalRevenue.toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-xl border border-gray-200 bg-white p-2 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active Tickets
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'batches'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ticket Batches
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Generate Batch
          </button>
          <button
            onClick={() => setActiveTab('used')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'used'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Used Tickets
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Customers
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'generate' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Generate Ticket Batch</h2>
            <p className="text-sm text-gray-500 mt-1">Create a batch of physical tickets for an event</p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleGenerateBatch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="event_id" className="block text-sm font-medium text-gray-700">
                    Event
                  </label>
                  <select
                    id="event_id"
                    name="event_id"
                    value={batchForm.event_id}
                    onChange={handleBatchFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({formatDate(event.date)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="num_tickets" className="block text-sm font-medium text-gray-700">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    id="num_tickets"
                    name="num_tickets"
                    min="1"
                    max="1000"
                    value={batchForm.num_tickets}
                    onChange={handleBatchFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="batch_code" className="block text-sm font-medium text-gray-700">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    id="batch_code"
                    name="batch_code"
                    value={batchForm.batch_code}
                    onChange={handleBatchFormChange}
                    required
                    placeholder="Enter unique batch code"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Ticket (UGX)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    value={batchForm.price}
                    onChange={handleBatchFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isGenerating
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Batch"
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">How to use:</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-blue-700">
                <li>Select the event for which you want to generate tickets</li>
                <li>Specify the number of tickets to generate (1-1000)</li>
                <li>Enter a unique batch code (used to identify this batch)</li>
                <li>Optionally set a price per ticket (0 for free tickets)</li>
                <li>Click "Generate Batch" to create the tickets and download the PDF</li>
              </ul>
            </div>
          </div>
        </div>
      ) : activeTab === 'tickets' || activeTab === 'used' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'tickets' ? 'Active Tickets' : 'Used Tickets'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Showing {visibleTickets.length} of {filteredTickets.length}
                  {ticketsTotalCount != null ? ` (loaded ${tickets.length} of ${ticketsTotalCount})` : ` (loaded ${tickets.length})`}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:max-w-3xl">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket id, name, phone, email, batch code…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All channels</option>
                  <option value="online">Online</option>
                  <option value="physical_batch">Batch</option>
                </select>
              </div>
            </div>
          </div>
          
          {visibleTickets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {activeTab === 'tickets' ? 'No active tickets' : 'No used tickets'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || eventFilter !== "all" || channelFilter !== "all"
                  ? "No tickets match your filters."
                  : activeTab === 'tickets'
                    ? 'Tickets will appear here once they are purchased.'
                    : 'Used tickets will appear here after verification at the event.'}
              </p>
            </div>
          ) : (
            <div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-200">
                {visibleTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => openTicketViewer(ticket)}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`View ticket ${ticket.id.substring(0, 8)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getEventTitle(ticket.event_id)}
                        </p>
                        <p className="mt-0.5 text-xs font-mono text-gray-600 break-all">
                          {ticket.id.substring(0, 8)}…
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                            ticket.purchase_channel === "online"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {ticket.purchase_channel === "online" ? "Online" : "Batch"}
                        </span>
                        <span
                          className={`px-2 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                            ticket.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Purchaser</p>
                        <p className="mt-0.5 text-gray-900 truncate">{ticket.email || ticket.buyer_name || "—"}</p>
                        <p className="text-gray-500 truncate">{ticket.buyer_phone || ""}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</p>
                        <p className="mt-0.5 text-gray-900 font-semibold tabular-nums">
                          {ticket.price > 0 ? `UGX ${(ticket.price * ticket.quantity).toLocaleString()}` : "Free"}
                        </p>
                        <p className="text-gray-500 tabular-nums">
                          Qty: {ticket.quantity} · {formatDate(ticket.created_at)}
                        </p>
                      </div>
                    </div>

                    {ticket.purchase_channel === "physical_batch" && (
                      <div className="mt-2 text-xs text-gray-600">
                        Batch: <span className="font-mono">{ticket.batch_code || "—"}</span> ·{" "}
                        <span className={ticket.is_active ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                          {ticket.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchaser
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibleTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openTicketViewer(ticket)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTicketViewer(ticket);
                          }
                        }}
                        aria-label={`View ticket ${ticket.id.substring(0, 8)}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {ticket.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getEventTitle(ticket.event_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.email || ticket.buyer_name || 'N/A'}
                          {ticket.buyer_phone && (
                            <div className="text-gray-500 text-xs">{ticket.buyer_phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.purchase_channel === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {ticket.purchase_channel === 'online' ? 'Online' : 'Batch'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.price > 0 ? `UGX ${(ticket.price * ticket.quantity).toLocaleString()}` : 'Free'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${
                              ticket.status === "confirmed" 
                                ? "bg-green-100 text-green-800" 
                                : ticket.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {ticket.status}
                            </span>
                            {ticket.purchase_channel === 'physical_batch' && (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                ticket.is_active
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {ticket.is_active ? "Active" : "Inactive"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                <p className="text-xs text-gray-500">
                  {isSearchMode
                    ? `${searchTickets.length} matching tickets loaded`
                    : ticketsTotalCount != null
                    ? `${tickets.length} / ${ticketsTotalCount} tickets loaded`
                    : `${tickets.length} tickets loaded`}
                </p>
                <button
                  type="button"
                  onClick={() => (isSearchMode ? loadSearchPage() : loadTicketsPage())}
                  disabled={
                    isSearchMode
                      ? searchLoading || !searchHasMore
                      : ticketsPageLoading || !ticketsHasMore
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearchMode
                    ? searchLoading
                      ? "Searching…"
                      : searchHasMore
                      ? "Load more"
                      : "All loaded"
                    : ticketsPageLoading
                    ? "Loading…"
                    : ticketsHasMore
                    ? "Load more"
                    : "All loaded"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'customers' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customers</h2>
            <p className="text-sm text-gray-500 mt-1">Customers who purchased tickets online</p>
          </div>
          
          {customersList.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
              <p className="mt-1 text-sm text-gray-500">Customers will appear here after purchasing tickets online.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-200">
                {customersList.map((customer, index) => (
                  <div key={index} className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-medium">
                          {customer.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                        <p className="text-xs text-gray-600 truncate">{customer.phone}</p>
                      </div>
                      <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800 tabular-nums">
                        {customer.ticketsCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Purchased
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customersList.map((customer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-800 font-medium">
                                {customer.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
                            {customer.ticketsCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        // Batches tab content
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ticket Batches</h2>
          </div>
          
          {batchesLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No batches</h3>
              <p className="mt-1 text-sm text-gray-500">Batches will appear here after generating ticket batches.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-200">
                {batches.map((batch) => (
                  <div key={batch.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          <span className="font-mono">{batch.batch_code}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600 truncate">{getEventTitle(batch.event_id)}</p>
                        <p className="mt-1 text-xs text-gray-600 tabular-nums">
                          {batch.num_tickets} tickets · {formatDate(batch.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full ${
                        batch.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {batch.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleBatchStatus(batch.id, batch.is_active)}
                        disabled={deletingBatchId === batch.id}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          batch.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {batch.is_active ? "Deactivate" : "Activate"}
                      </button>

                      {!batch.is_active && (
                        <button
                          onClick={() => activateAllTicketsInBatch(batch.id, batch.batch_code)}
                          disabled={deletingBatchId === batch.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Activate Tickets
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteBatch(batch)}
                        disabled={deletingBatchId === batch.id}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                          deletingBatchId === batch.id ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {deletingBatchId === batch.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batches.map((batch) => (
                      <tr key={batch.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {batch.batch_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getEventTitle(batch.event_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.num_tickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(batch.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            batch.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {batch.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleBatchStatus(batch.id, batch.is_active)}
                              disabled={deletingBatchId === batch.id}
                              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                batch.is_active
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {batch.is_active ? "Deactivate" : "Activate"}
                            </button>
                            
                            {!batch.is_active && (
                              <button
                                onClick={() => activateAllTicketsInBatch(batch.id, batch.batch_code)}
                                disabled={deletingBatchId === batch.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Activate Tickets
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteBatch(batch)}
                              disabled={deletingBatchId === batch.id}
                              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                deletingBatchId === batch.id
                                  ? "bg-red-400 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              {deletingBatchId === batch.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Ticket Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4">
          <div
            className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-hidden sm:rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 sm:px-5 py-4 sticky top-0 z-10">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Viewer</h3>
                <p className="mt-1 text-sm text-gray-600 truncate">
                  {viewerData?.event?.title || getEventTitle(selectedTicket?.event_id || "")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTicketViewer}
                disabled={viewerActionLoading}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 overflow-y-auto">
              {/* Ticket preview */}
              <div className="p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                {viewerLoading ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : viewerError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {viewerError}
                  </div>
                ) : viewerData ? (
                  <div className="mx-auto max-w-md">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="px-5 py-4 bg-gradient-to-r from-red-600 to-purple-700 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                          {viewerData.event.organizer_name || "TIPAC"}
                        </p>
                        <h4 className="mt-1 text-lg font-bold leading-tight">
                          {viewerData.event.title}
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/90">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                            <span>📅</span>
                            <span>{viewerData.event.date ? new Date(viewerData.event.date).toLocaleDateString() : ""}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                            <span>📍</span>
                            <span className="truncate max-w-[220px]">{viewerData.event.location}</span>
                          </span>
                        </div>
                      </div>

                      <div className="px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket ID</p>
                            <p className="mt-1 font-mono text-sm text-gray-900 break-all">{viewerData.id}</p>
                          </div>
                          {viewerQrDataUrl && (
                            <img
                              src={viewerQrDataUrl}
                              alt="Ticket QR code"
                              className="h-28 w-28 rounded-lg border border-gray-200 bg-white p-1"
                            />
                          )}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buyer</p>
                            <p className="mt-1 font-medium text-gray-900 truncate">{viewerData.buyer_name || "—"}</p>
                            <p className="text-xs text-gray-600 truncate">{viewerData.buyer_phone || "—"}</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Channel</p>
                            <p className="mt-1 font-medium text-gray-900">{viewerData.purchase_channel || "online"}</p>
                            <p className="text-xs text-gray-600 truncate">
                              {viewerData.confirmation_code ? `Ref: ${viewerData.confirmation_code}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Tip: click “Download PDF” to get the exact printable ticket.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Actions + details */}
              <div className="p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTicketPdf}
                    disabled={viewerLoading || viewerActionLoading || !viewerData}
                    className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleUsed}
                    disabled={viewerLoading || viewerActionLoading || !selectedTicket}
                    className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {selectedTicket?.used ? "Mark unused" : "Mark used"}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleActive}
                    disabled={viewerLoading || viewerActionLoading || !selectedTicket}
                    className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {selectedTicket?.is_active ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteTicket}
                    disabled={viewerLoading || viewerActionLoading || !selectedTicket}
                    className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Admin status</h4>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Used</p>
                      <p className="mt-1 font-medium text-gray-900">{selectedTicket?.used ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active</p>
                      <p className="mt-1 font-medium text-gray-900">{selectedTicket?.is_active ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Channel</p>
                      <p className="mt-1 font-medium text-gray-900">{selectedTicket?.purchase_channel || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {selectedTicket?.created_at ? new Date(selectedTicket.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {viewerError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {viewerError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}