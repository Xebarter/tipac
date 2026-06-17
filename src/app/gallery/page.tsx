"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ImageIcon } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl bg-purple-100/60 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("gallery_images")
          .select("id, url")
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching gallery images:", error);
          setError("Failed to load gallery images.");
          setImages([]);
        } else {
          setImages(data ?? []);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error fetching gallery images:", err);
        setError("Failed to load gallery images.");
        setImages([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-purple-100">
      <Navbar />

      <main className="flex-grow relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(126,34,206,0.05)_0%,transparent_75%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container mx-auto py-16 md:py-24 px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center bg-white/60 backdrop-blur-md rounded-[2rem] px-6 py-10 md:py-14 shadow-xl border border-white/40 mb-12 md:mb-16 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl tipac-gradient mb-6 shadow-lg">
              <ImageIcon className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">
                Gallery
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Explore photos from our past events, performances, and workshops.
              These moments showcase the joy, creativity, and impact of our
              theatre programs.
            </p>
            {!loading && images.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                {images.length} photo{images.length !== 1 ? "s" : ""} — click
                to view full size or download
              </p>
            )}
          </motion.div>

          {loading ? (
            <GallerySkeleton />
          ) : error ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-red-100 shadow-lg">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Please try refreshing the page.
              </p>
            </div>
          ) : images.length > 0 ? (
            <GalleryGrid images={images} />
          ) : (
            <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-purple-100 shadow-lg">
              <ImageIcon className="h-12 w-12 text-purple-300 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">
                No photos available yet
              </p>
              <p className="text-muted-foreground mt-2">
                Check back soon for highlights from our events and programs.
              </p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="tipac-gradient mt-16 md:mt-24 p-8 md:p-10 rounded-2xl text-center shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-3 text-white">
              Want to see more?
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Follow us on social media for regular updates on our events and
              programs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() =>
                  window.open("https://www.facebook.com", "_blank")
                }
              >
                Facebook
              </Button>
              <Button
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() =>
                  window.open("https://www.instagram.com", "_blank")
                }
              >
                Instagram
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
