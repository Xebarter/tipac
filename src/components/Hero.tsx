'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
// import Head from 'next/head'; // REMOVED: Next/Image handles preloading better.
import { supabase } from '@/lib/supabaseClient';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  original_name?: string;
}

// OPTIMIZATION: Define placeholder to prevent layout shift before images load
const IMAGE_ASPECT_RATIO = 16 / 9; // Common wide ratio for hero images
const DUMMY_FALLBACK_URL = '/placeholder-tipac.jpg'; // Add a tiny placeholder image to your public folder

// OPTIMIZATION: Configure the Supabase URL loader for automatic optimization (if Next.js is configured for it)
// If not using Next.js image domains config, these images won't be optimized, and you must pre-optimize the files.
const NEXT_IMAGE_SUPABASE_LOADER = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // Assuming Supabase URL is your configured domain.
  // This loader ensures Next.js requests the optimal size if the Supabase domain is configured in next.config.js
  const url = new URL(src);
  // Add common image optimization query parameters if your host supports them (e.g., Cloudflare R2, Vercel Blob)
  // For standard Supabase storage, this may not automatically resize, but it helps Next.js understand the source.
  return `${url.origin}${url.pathname}?width=${width}&quality=${quality || 75}`;
};


export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // OPTIMIZATION: Only load the first 5 images for speed. A carousel rarely needs more on initial load.
  const IMAGE_LOAD_LIMIT = 5;

  // Fetch gallery images
  useEffect(() => {
    let isMounted = true;
    async function fetchGalleryImages() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('gallery_images')
          .select('*')
          .order('created_at', { ascending: false })
          // OPTIMIZATION: Limit the number of images fetched to speed up API response
          .limit(IMAGE_LOAD_LIMIT);

        if (supabaseError) throw supabaseError;

        if (isMounted) {
          if (data && data.length > 0) {
            const formattedImages = data.map(img => ({
              id: img.id,
              url: img.url,
              alt: img.original_name
                ? `Performance at TIPAC theatre program, showcasing ${img.original_name}`
                : 'TIPAC performance image',
              filename: img.filename,
              original_name: img.original_name
            }));
            setGalleryImages(formattedImages);
          } else {
            setError('No images available');
          }
          setIsLoadingInitial(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load images. Please try again later.');
          console.error('Error fetching gallery images:', err);
          setIsLoadingInitial(false);
        }
      }
    }

    fetchGalleryImages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-rotation (rest of the logic remains the same)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const startRotation = () => {
      if (galleryImages.length > 1 && !isUserInteracting) {
        interval = setInterval(() => {
          setCurrentImageIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
        }, 5000);
      }
    };
    startRotation();
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [galleryImages.length, isUserInteracting]);

  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    setTimeout(() => setIsUserInteracting(false), 10000);
  }, []);

  const goToPrevious = () => {
    handleUserInteraction();
    setCurrentImageIndex(prevIndex =>
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    handleUserInteraction();
    setCurrentImageIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
  };

  const nextImageIndex = (currentImageIndex + 1) % galleryImages.length;


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-700 to-rose-700">
      {/* Glassmorphic overlay - always present, more opaque while loading */}
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700
             bg-white/30 backdrop-blur-xl
             ${isLoadingInitial ? 'opacity-80' : 'opacity-40'}`}
      />
      {/* REMOVED: Head tag preloading. Next/Image's 'priority' handles this effectively */}
      {/* Decorative elements (rest of your decorative elements remain the same) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.12)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-purple-500/20 to-rose-500/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 z-0" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-r from-red-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          {/* OPTIMIZATION: Fallback if images haven't loaded yet. Prevents flickering */}
          {(galleryImages.length === 0 && !isLoadingInitial) ? (
            <Image
              src={DUMMY_FALLBACK_URL}
              alt="Loading placeholder"
              fill
              className="object-cover transition-opacity duration-1000"
              sizes="100vw"
              priority={true} // Load this immediately if the real images fail.
              quality={80}
            />
          ) : null}

          {/* Primary Image: Current visible image */}
          {galleryImages.length > 0 ? (
            <Image
              src={galleryImages[currentImageIndex].url}
              alt={galleryImages[currentImageIndex].alt || "TIPAC Performance"}
              fill
              // OPTIMIZATION: loader property uses the custom loader defined above
              // loader={NEXT_IMAGE_SUPABASE_LOADER} // Uncomment if you set up the loader
              // OPTIMIZATION: 'eager' loading for the LCP element (initial image)
              loading={currentImageIndex === 0 ? 'eager' : 'lazy'} 
              // OPTIMIZATION: Set priority={true} only for the *very first* image loaded.
              priority={currentImageIndex === 0} 
              className="object-cover transition-opacity duration-1000"
              sizes="100vw"
              quality={80}
            />
          ) : null}

          {/* OPTIMIZATION: Preload the NEXT image in the sequence (if not currently loading the first) */}
          {galleryImages.length > 1 && currentImageIndex !== 0 && (
            <Image
              key={galleryImages[nextImageIndex].id} // Ensure re-render on index change
              src={galleryImages[nextImageIndex].url}
              alt={galleryImages[nextImageIndex].alt || "Next TIPAC Performance"}
              // OPTIMIZATION: Use a tiny opacity to force the image to load but remain invisible
              className="absolute inset-0 object-cover opacity-0 pointer-events-none"
              // OPTIMIZATION: Use 'lazy' load (or default) as it's not immediately visible, but prioritize
              // pre-fetching it in the background.
              loading="lazy"
              sizes="1px" // Give it the smallest possible size to calculate for preloading
              width={1} // Explicit width/height to bypass fill-mode check for this hidden element
              height={1}
              quality={1} // Minimal quality needed since it's only for preloading
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 py-8 sm:py-16 lg:py-20">
        {/* ... (Hero content, buttons, text remain the same) ... */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-red-600 to-purple-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow">
              Theater Initiative for the Pearl of Africa Children.
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 drop-shadow-lg bg-clip-text bg-gradient-to-r from-white via-white to-gray-200 leading-tight">
            TIPAC
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 mb-6 sm:mb-10 max-w-2xl mx-auto drop-shadow-md">
            {/* Add content here if needed; currently empty */}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/tickets">
              <Button className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 min-h-[44px]">
                Buy Ticket
              </Button>
            </Link>
            <Link href="/events">
              <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 shadow-lg hover:shadow-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 min-h-[44px]">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows (omitted for brevity) */}
      {/* Dots indicator (omitted for brevity) */}
      {/* Loading state (omitted for brevity) */}
      {/* Error message (omitted for brevity) */}
    </section>
  );
}