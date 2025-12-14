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
              original_name: img.original_name,
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
          console.error(err);
          setIsLoadingInitial(false);
        }
      }
    }

    fetchGalleryImages();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (galleryImages.length > 1 && !isUserInteracting) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % galleryImages.length);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [galleryImages.length, isUserInteracting]);

  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    setTimeout(() => setIsUserInteracting(false), 10000);
  }, []);

  const goToPrevious = () => {
    handleUserInteraction();
    setCurrentImageIndex(prev =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    handleUserInteraction();
    setCurrentImageIndex(prev => (prev + 1) % galleryImages.length);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 via-purple-900 to-fuchsia-800">
      {/* Glass overlay */}
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700
        bg-black/30 backdrop-blur-xl
        ${isLoadingInitial ? 'opacity-80' : 'opacity-50'}`}
      />

      <Head>
        <link
          rel="preload"
          as="image"
          href={galleryImages[currentImageIndex]?.url}
        />
      </Head>

      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.15)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-red-600/30 to-purple-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-rose-600/20 to-violet-600/20 rounded-full blur-3xl z-0" />

      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {galleryImages.length > 0 && (
          <div className="relative w-full h-full">
            <Image
              src={galleryImages[currentImageIndex].url}
              alt={galleryImages[currentImageIndex].alt || 'TIPAC Performance'}
              fill
              priority
              className="object-cover transition-opacity duration-1000"
              sizes="100vw"
              quality={80}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block mb-6 bg-gradient-to-r from-red-600 to-purple-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
            Theater Initiative for the Pearl of Africa Children
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
            TIPAC
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl mx-auto drop-shadow-md">
            {/* Optional subtitle */}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/tickets">
              <Button className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white shadow-xl px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                Buy Ticket
              </Button>
            </Link>

            <Link href="/events">
              <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 shadow-xl px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {galleryImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition z-10"
            aria-label="Previous image"
          >
            ‹
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition z-10"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {galleryImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                handleUserInteraction();
                setCurrentImageIndex(index);
              }}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-3 hover:bg-white/80'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loader */}
      {isLoadingInitial && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm z-20 text-center">
          {error}
        </div>
      )}
    </section>
  );
}

