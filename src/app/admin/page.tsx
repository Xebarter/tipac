"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Calendar,
  Image as ImageIcon,
  Mail,
  Ticket,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  PackageCheck,
  Users,
} from "lucide-react";

interface Stats {
  eventsTotal: number;
  eventsPublished: number;
  messagesTotal: number;
  messagesUnread: number;
  galleryTotal: number;
  ticketsTotal: number;
  ticketsOnline: number;
  ticketsBatch: number;
  applicationsTotal: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    eventsTotal: 0,
    eventsPublished: 0,
    messagesTotal: 0,
    messagesUnread: 0,
    galleryTotal: 0,
    ticketsTotal: 0,
    ticketsOnline: 0,
    ticketsBatch: 0,
    applicationsTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split("; ").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.split("=");
        acc[name] = value;
        return acc;
      },
      {} as { [key: string]: string }
    );

    if (!cookies["admin_session"]) {
      router.push("/admin/login");
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const [
        { count: eventsTotal },
        { count: eventsPublished },
        { count: messagesTotal },
        { count: messagesUnread },
        { count: galleryTotal },
        { data: ticketsData },
        { count: applicationsTotal },
      ] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("gallery_images").select("*", { count: "exact", head: true }),
        // Include status so the dashboard can show "successful online" at a glance.
        supabase.from("tickets").select("purchase_channel, status"),
        supabase.from("school_applications").select("*", { count: "exact", head: true }),
      ]);

      const ticketsOnline = (ticketsData || []).filter(
        (t: any) => t.purchase_channel === "online" && t.status === "confirmed"
      ).length;
      const ticketsBatch = (ticketsData || []).filter((t: any) => t.purchase_channel === "physical_batch").length;

      setStats({
        eventsTotal: eventsTotal ?? 0,
        eventsPublished: eventsPublished ?? 0,
        messagesTotal: messagesTotal ?? 0,
        messagesUnread: messagesUnread ?? 0,
        galleryTotal: galleryTotal ?? 0,
        ticketsTotal: (ticketsData || []).length,
        ticketsOnline,
        ticketsBatch,
        applicationsTotal: applicationsTotal ?? 0,
      });
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const statCards = [
    {
      label: "Total Events",
      value: stats.eventsTotal,
      sub: `${stats.eventsPublished} published`,
      icon: Calendar,
      href: "/admin/events",
      color: "purple",
      gradient: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      badge: stats.eventsPublished > 0 ? "Live" : undefined,
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      label: "Messages",
      value: stats.messagesTotal,
      sub: stats.messagesUnread > 0 ? `${stats.messagesUnread} unread` : "All read",
      icon: Mail,
      href: "/admin/messages",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: stats.messagesUnread > 0 ? `${stats.messagesUnread} new` : undefined,
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      label: "Gallery Images",
      value: stats.galleryTotal,
      sub: "Total uploads",
      icon: ImageIcon,
      href: "/admin/gallery",
      color: "pink",
      gradient: "from-pink-500 to-rose-500",
      bg: "bg-pink-50",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      badge: undefined,
      badgeColor: "",
    },
    {
      label: "Total Tickets",
      value: stats.ticketsTotal,
      sub: `Online: ${stats.ticketsOnline} · Batch: ${stats.ticketsBatch}`,
      icon: Ticket,
      href: "/admin/tickets",
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      badge: undefined,
      badgeColor: "",
    },
    {
      label: "Applications",
      value: stats.applicationsTotal,
      sub: "School applications",
      icon: Users,
      href: "/admin/applications",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      badge: undefined,
      badgeColor: "",
    },
  ];

  const quickActions = [
    {
      label: "Create New Event",
      desc: "Add event, tickets & sponsors",
      href: "/admin/events",
      icon: Calendar,
      color: "from-purple-500 to-violet-600",
    },
    {
      label: "Upload Gallery",
      desc: "Add photos to the gallery",
      href: "/admin/gallery",
      icon: ImageIcon,
      color: "from-pink-500 to-rose-500",
    },
    {
      label: "View Tickets",
      desc: "Manage all ticket sales",
      href: "/admin/tickets",
      icon: ShoppingCart,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Verify Tickets",
      desc: "Scan & validate at the door",
      href: "/admin/verify",
      icon: PackageCheck,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page heading */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.10)_0%,transparent_55%),radial-gradient(circle_at_85%_25%,rgba(236,72,153,0.10)_0%,transparent_55%),radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.08)_0%,transparent_60%)]" />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Admin overview
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quick snapshot of events, tickets, messages, and applications.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>
                  {lastUpdatedAt
                    ? `Last updated ${lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Loading…"}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchStats}
                disabled={refreshing}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {refreshing ? (
                  <svg className="h-4 w-4 animate-spin text-gray-700" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-7.745M19 5a9 9 0 00-14 7.745" />
                  </svg>
                )}
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />

            <div className="flex items-start justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              {card.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}
            </div>

            <div>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md mb-1" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              )}
              <p className="text-sm font-medium text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>

            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Quick Actions</h2>
          <p className="text-xs text-gray-500">Most common admin tasks</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 flex-shrink-0">
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{action.label}</p>
                <p className="text-xs text-white/70 mt-0.5 truncate">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/50 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Ticket breakdown */}
      {!loading && stats.ticketsTotal > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-700">Ticket Sales Breakdown</h2>
            <Link
              href="/admin/tickets"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Online Sales",
                value: stats.ticketsOnline,
                color: "bg-purple-500",
                lightColor: "bg-purple-100",
              },
              {
                label: "Batch / Physical",
                value: stats.ticketsBatch,
                color: "bg-amber-500",
                lightColor: "bg-amber-100",
              },
            ].map((row) => {
              const pct = stats.ticketsTotal > 0 ? Math.round((row.value / stats.ticketsTotal) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-gray-600 font-medium">{row.label}</span>
                    <span className="text-gray-900 font-semibold tabular-nums">
                      {row.value} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${row.lightColor} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}