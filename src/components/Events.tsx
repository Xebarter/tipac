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
            is_published
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
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                Events
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
              Upcoming Events
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join us for our upcoming theatre performances, workshops, and cultural events.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-2xl mx-auto shadow-sm">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="upcoming-events" className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
              Events
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
            Upcoming Events
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join us for our upcoming theatre performances, workshops, and cultural events.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-sm border border-gray-100 backdrop-blur-sm bg-white/80">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600 mb-6">
                We don't have any events scheduled at the moment. Please check back later.
              </p>
              <Link href="/events">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
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
              // Define color schemes for events
              const colorSchemes = [
                { from: 'from-purple-100/50', to: 'to-pink-100/50', border: 'border-purple-500/30', ring: 'ring-purple-500/30', text: 'text-purple-700', badge: 'from-purple-500 to-pink-500' },
                { from: 'from-blue-100/50', to: 'to-cyan-100/50', border: 'border-blue-500/30', ring: 'ring-blue-500/30', text: 'text-blue-700', badge: 'from-blue-500 to-cyan-500' },
                { from: 'from-green-100/50', to: 'to-emerald-100/50', border: 'border-green-500/30', ring: 'ring-green-500/30', text: 'text-green-700', badge: 'from-green-500 to-emerald-500' },
                { from: 'from-yellow-100/50', to: 'to-amber-100/50', border: 'border-yellow-500/30', ring: 'ring-yellow-500/30', text: 'text-yellow-700', badge: 'from-yellow-500 to-amber-500' },
                { from: 'from-rose-100/50', to: 'to-pink-100/50', border: 'border-rose-500/30', ring: 'ring-rose-500/30', text: 'text-rose-700', badge: 'from-rose-500 to-pink-500' },
                { from: 'from-indigo-100/50', to: 'to-violet-100/50', border: 'border-indigo-500/30', ring: 'ring-indigo-500/30', text: 'text-indigo-700', badge: 'from-indigo-500 to-violet-500' },
              ];
              
              // Get color scheme based on event index
              const colorScheme = colorSchemes[index % colorSchemes.length];
              
              return (
                <div
                  key={event.id}
                  className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group backdrop-blur-sm bg-white/70 border border-gray-100 ${events.length === 1
                      ? 'lg:max-w-4xl lg:mx-auto lg:flex lg:flex-col'
                      : ''
                    }`}
                >
                  {/* Event Image */}
                  <div className={`relative overflow-hidden ${events.length === 1
                      ? 'lg:h-96'
                      : 'h-48'
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
                      <div className={`w-full h-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center ${events.length === 1
                          ? 'lg:h-96'
                          : ''
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r ${colorScheme.badge} rounded-full backdrop-blur-sm shadow`}>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className={`p-6 ${events.length === 1 ? 'lg:p-10 lg:flex lg:flex-col' : ''}`}>
                    <div className={`flex justify-between items-start mb-3 ${events.length === 1 ? 'lg:mb-6' : ''}`}>
                      <h3 className={`font-bold text-gray-900 group-hover:text-purple-600 transition-colors ${events.length === 1
                          ? 'text-2xl lg:text-3xl'
                          : 'text-xl'
                        }`}>
                        {event.title}
                      </h3>
                      <div className="text-right">
                        <p className={`font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${events.length === 1
                            ? 'text-lg lg:text-xl'
                            : 'text-sm'
                          }`}>{event.time}</p>
                      </div>
                    </div>

                    <div className={`flex items-center text-gray-600 ${events.length === 1
                        ? 'text-base lg:text-lg lg:mb-2'
                        : 'text-sm mb-4'
                      }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`mr-2 ${events.length === 1
                          ? 'h-5 w-5 lg:h-6 lg:w-6'
                          : 'h-4 w-4'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>

                    <p className={`text-gray-700 ${events.length === 1
                        ? 'lg:text-lg lg:mb-8'
                        : 'mb-6 line-clamp-3'
                      }`}>
                      {event.description}
                    </p>

                    <div className={`${events.length === 1 ? 'lg:mt-auto' : ''}`}>
                      <Link href={`/tickets?event=${event.id}`}>
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl ${events.length === 1
                              ? 'text-base lg:text-lg lg:px-8 lg:py-3'
                              : 'text-sm px-4 py-2'
                            }`}
                        >
                          Get Tickets
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/events">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}