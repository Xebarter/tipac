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
          .select("*")
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join us for our upcoming theatre performances, workshops, and cultural events.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join us for our upcoming theatre performances, workshops, and cultural events.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 max-w-2xl mx-auto shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600 mb-6">
                We don't have any events scheduled at the moment. Please check back later.
              </p>
              <Link href="/events">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className={`grid gap-8 ${
            events.length === 1 
              ? 'grid-cols-1' 
              : events.length === 2 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {events.map((event) => (
              <div
                key={event.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100 ${
                  events.length === 1 
                    ? 'lg:max-w-4xl lg:mx-auto lg:flex lg:flex-col' 
                    : ''
                }`}
              >
                {/* Event Image */}
                <div className={`relative overflow-hidden ${
                  events.length === 1 
                    ? 'lg:h-96' 
                    : 'h-48'
                }`}>
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ${
                      events.length === 1 
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
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-black/30 rounded-full backdrop-blur-sm">
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
                    <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors ${
                      events.length === 1 
                        ? 'text-2xl lg:text-3xl' 
                        : 'text-xl'
                    }`}>
                      {event.title}
                    </h3>
                    <div className="text-right">
                      <p className={`font-semibold text-blue-600 ${
                        events.length === 1 
                          ? 'text-lg lg:text-xl' 
                          : 'text-sm'
                      }`}>{event.time}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center text-gray-600 ${
                    events.length === 1 
                      ? 'text-base lg:text-lg lg:mb-2' 
                      : 'text-sm mb-4'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`mr-2 ${
                      events.length === 1 
                        ? 'h-5 w-5 lg:h-6 lg:w-6' 
                        : 'h-4 w-4'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                  
                  <p className={`text-gray-700 ${
                    events.length === 1 
                      ? 'lg:text-lg lg:mb-8' 
                      : 'mb-6 line-clamp-3'
                  }`}>
                    {event.description}
                  </p>
                  
                  <div className={`${events.length === 1 ? 'lg:mt-auto' : ''}`}>
                    <Link href={`/tickets/event/${event.id}`}>
                      <Button 
                        size="sm" 
                        className={`bg-blue-600 hover:bg-blue-700 transition-all duration-300 ${
                          events.length === 1 
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
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link href="/events">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}