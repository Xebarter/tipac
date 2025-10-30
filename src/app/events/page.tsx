"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
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

export default function EventsPage() {
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
          .order("date", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          console.error("Error details:", error.details);
          throw new Error(`Supabase error: ${error.message} (code: ${error.code})`);
        }

        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        if (err instanceof Error) {
          setError(`Failed to load events: ${err.message}`);
        } else {
          setError("Failed to load events. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Upcoming Events
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join us for our upcoming theatre performances, workshops, and cultural events.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">No Upcoming Events</h3>
              <p className="text-gray-400 mb-6">
                We don't have any events scheduled at the moment. Please check back later.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {events.map((event) => (
              <motion.div
                key={event.id}
                className="bg-gray-800/30 backdrop-blur-md rounded-xl overflow-hidden border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-300 bg-blue-900/50 rounded-full">
                        {new Date(event.date).toLocaleDateString("en-US", { 
                          weekday: "short", 
                          month: "short", 
                          day: "numeric" 
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{event.time}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                    {event.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center text-gray-400 text-sm mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Link href={`/tickets?event=${event.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-sm"
                      >
                        Get Tickets
                      </Button>
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link href="/tickets">
            <Button className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg">
              View All Tickets
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}