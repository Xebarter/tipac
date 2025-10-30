"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// Removed revalidate since this is a client component

export default async function GalleryPage() {
  // Fetch images from Supabase
  const { data: images, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery images:', error);
    // Return empty array in case of error
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold mb-6">Our Gallery</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore photos from our past events, performances, and workshops.
            </p>
            <p className="text-red-500">Failed to load gallery images.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto py-16 px-4">
          <h1 className="text-4xl font-bold mb-6">Our Gallery</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explore photos from our past events, performances, and workshops. These moments showcase the joy, creativity, and impact of our theatre programs.
          </p>
          
          {images && images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-lg border border-border shadow-sm">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.original_name || 'TIPAC performance image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  {image.original_name && (
                    <div className="p-2 bg-gray-50">
                      <p className="text-xs truncate">{image.original_name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No images available in the gallery yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}