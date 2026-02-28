"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image_url: string | null;
  is_published: boolean;
  sponsor_logos?: Array<{ name: string; url: string }> | null;
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select(`
            id,
            title,
            date,
            time,
            location,
            description,
            image_url,
            is_published,
            sponsor_logos
          `)
          .eq("is_published", true)
          .gte("date", new Date().toISOString().split("T")[0]) // Only future events
          .order("date", { ascending: true })
          .limit(3); // Limit to 3 events on the home page

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Supabase error: ${error.message}`);
        }

        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-rose-50 via-purple-50 to-rose-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.12)_0%,transparent_70%)] pointer-events-none"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-rose-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-fuchsia-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-rose-400/20 to-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-rose-600 to-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                Events
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-rose-600 via-fuchsia-600 to-purple-600">
              Upcoming Events
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join us for our upcoming theatre performances, workshops, and cultural events.
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 max-w-2xl mx-auto shadow-sm">
            <p className="text-rose-700 text-center">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="upcoming-events" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
      {/* Subtle grid background for modern technical feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold shadow-sm mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            Schedule & Tickets
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Upcoming Events
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join us for our upcoming theatre performances, workshops, and exclusive cultural events. Secure your spot today.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-3xl p-10 max-w-2xl mx-auto shadow-sm border border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Upcoming Events</h3>
              <p className="text-slate-500 mb-8 text-lg">
                We don't have any events scheduled at the moment. Please check back later or view past events.
              </p>
              <Link href="/events">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-md font-medium px-6 py-2.5 rounded-xl transition-all h-auto text-base">
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className={`grid gap-8 ${events.length === 1
            ? 'grid-cols-1'
            : events.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
            {events.map((event, index) => {
              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col h-full transform hover:-translate-y-1 ${events.length === 1
                    ? 'lg:max-w-4xl lg:mx-auto lg:flex-row lg:h-auto'
                    : ''
                    }`}
                >
                  <div className={`relative overflow-hidden shrink-0 ${events.length === 1
                    ? 'lg:w-[45%] h-64 lg:h-auto'
                    : 'h-56'
                    }`}>
                    {event.image_url && event.image_url.trim() !== '' ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Handle broken image links by hiding the image and showing the placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Find the parent div and add a class to show the placeholder
                          const parentDiv = target.closest('div.relative');
                          if (parentDiv) {
                            parentDiv.classList.add('show-placeholder');
                          }
                        }}
                      />
                    ) : null}

                    {/* Fallback placeholder when there's no image or image fails to load */}
                    {(!event.image_url || event.image_url.trim() === '') && (
                      <div className={`w-full h-full bg-slate-100 flex items-center justify-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-sm uppercase tracking-wide`}>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className={`p-8 flex flex-col flex-grow ${events.length === 1 ? 'lg:w-[55%]' : ''}`}>
                    <div className={`flex flex-col gap-2 mb-4`}>
                      <div className="flex items-center text-slate-500 text-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.time}
                      </div>
                      <h3 className={`font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight ${events.length === 1
                        ? 'text-3xl'
                        : 'text-2xl'
                        }`}>
                        {event.title}
                      </h3>
                    </div>

                    <div className={`flex items-center text-slate-500 mb-6 font-medium text-sm`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>

                    <p className={`text-slate-600 mb-8 leading-relaxed ${events.length === 1
                      ? 'text-lg'
                      : 'line-clamp-3 text-base'
                      }`}>
                      {event.description}
                    </p>

                    {/* Sponsor Logos Section */}
                    {event.sponsor_logos && event.sponsor_logos.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center mb-3">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sponsored by</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          {event.sponsor_logos.map((sponsor, idx) => (
                            <div key={idx} className="flex items-center justify-center bg-gray-50 rounded-lg p-2 h-16 w-24 border border-gray-200">
                              {sponsor.url ? (
                                <img
                                  src={sponsor.url}
                                  alt={sponsor.name}
                                  className="max-h-12 max-w-full object-contain"
                                />
                              ) : (
                                <span className="text-gray-600 text-xs text-center font-medium">{sponsor.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">
                        {event.sponsor_logos && event.sponsor_logos.length > 0 ? "Sponsored Event" : "Standard Ticket"}
                      </div>
                      <Link href={`/tickets?event=${event.id}`}>
                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-primary text-white transition-colors duration-300 shadow-sm font-medium h-10 px-6 rounded-lg text-sm"
                        >
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16 pb-8">
          <Link href="/events">
            <Button className="bg-white text-slate-900 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-8 py-6 text-base font-semibold rounded-xl shadow-sm transition-all duration-300 h-auto">
              View All Upcoming Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}