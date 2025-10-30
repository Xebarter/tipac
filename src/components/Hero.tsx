'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  original_name?: string;
}

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Fetch gallery images on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchGalleryImages() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('gallery_images')
          .select('*')
          .order('created_at', { ascending: false });
          
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

  // Setup auto-rotation interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startRotation = () => {
      if (galleryImages.length > 1 && !isUserInteracting) {
        interval = setInterval(() => {
          setCurrentImageIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
        }, 5000);
      }
    };

    const stopRotation = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startRotation();

    return () => stopRotation();
  }, [galleryImages.length, isUserInteracting]);

  // Handle user interaction timeout
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
    setCurrentImageIndex(prevIndex => 
      (prevIndex + 1) % galleryImages.length
    );
  };

  const goToIndex = (index: number) => {
    handleUserInteraction();
    setCurrentImageIndex(index);
  };

  if (isLoadingInitial) {
    return (
      <section className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4"></div>
          <p className="text-xl text-white font-semibold">Loading gallery...</p>
        </div>
      </section>
    );
  }

  if (error || galleryImages.length === 0) {
    return (
      <section className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center px-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            TIPAC
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Theatre Initiative for the Pearl of Africa Children
          </p>
          <p className="text-lg text-white/70 mb-10">{error || 'No gallery images available at the moment.'}</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-bold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <Link href="/events">Upcoming Events</Link>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-bold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <Link href="/tickets">Buy Ticket</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Head>
        <link 
          rel="preload"
          href={galleryImages[currentImageIndex]?.url || '/images/fallback-placeholder.jpg'}
          as="image"
          fetchPriority="high"
        />
      </Head>
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={image.url}
                  alt={image.alt || "TIPAC performance image"}
                  fill
                  className="object-cover"
                  priority={index === currentImageIndex}
                  sizes="100vw"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Controls */}
        {galleryImages.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button 
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/60 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg z-20"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={goToNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/60 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg z-20"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125 shadow-md' 
                      : 'bg-white/50 hover:bg-white/70 hover:scale-110'
                  }`}
                  aria-label={`Go to image ${index + 1} of ${galleryImages.length}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center text-center text-white z-10 px-4 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl leading-tight">
              TIPAC
            </h1>
            <p className="text-2xl md:text-3xl mb-10 drop-shadow-xl leading-relaxed text-white/90">
              Theatre Initiative for the Pearl of Africa Children
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-sm sm:text-base md:text-lg px-3 sm:px-6 md:px-8 py-3 sm:py-4 font-bold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl min-h-12 sm:min-h-14">
                <Link href="/events">Upcoming Events</Link>
              </Button>
              <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-sm sm:text-base md:text-lg px-3 sm:px-6 md:px-8 py-3 sm:py-4 font-bold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl min-h-12 sm:min-h-14">
                <Link href="/tickets">Buy Ticket</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </>
  );
}