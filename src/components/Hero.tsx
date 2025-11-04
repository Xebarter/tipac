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

  // Fetch gallery images
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

  // Auto-rotation
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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">TIPAC</h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Theatre Initiative for the Pearl of Africa Children
          </p>
          <p className="text-lg text-white/70 mb-10">
            {error || 'No gallery images available at the moment.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-md mx-auto">
            <Button
              asChild
              className="sleek-btn amber flex-1 max-w-[200px] mx-auto sm:mx-0"
            >
              <Link href="/tickets">Buy Ticket</Link>
            </Button>
            <Button
              asChild
              className="sleek-btn blue flex-1 max-w-[200px] mx-auto sm:mx-0"
            >
              <Link href="/events">Upcoming Events</Link>
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
        {/* Background images */}
        <div className="absolute inset-0">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
            >
              <Image
                src={image.url}
                alt={image.alt || 'TIPAC performance image'}
                fill
                className="object-cover"
                priority={index === currentImageIndex}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center text-white z-10 px-4 animate-fade-in">
          <div className="max-w-4xl mx-auto flex flex-col items-center" style={{ marginTop: '20%' }}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl leading-tight">
              TIPAC
            </h1>
            <p className="text-2xl md:text-3xl mb-10 drop-shadow-xl leading-relaxed text-white/90">
              Theatre Initiative for the Pearl of Africa Children
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-md">
              <Button asChild className="sleek-btn amber flex-1 max-w-[200px] mx-auto sm:mx-0">
                <Link href="/tickets">Buy Ticket</Link>
              </Button>
              <Button asChild className="sleek-btn blue flex-1 max-w-[200px] mx-auto sm:mx-0">
                <Link href="/events">Upcoming Events</Link>
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

        .sleek-btn {
          position: relative;
          font-weight: 700;
          padding: 1rem 2.5rem;
          border-radius: 1.25rem;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 1.1rem;
        }

        .sleek-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3));
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .sleek-btn:hover::before {
          opacity: 1;
        }

        /* Buy Ticket (brightest, most prominent) */
        .sleek-btn.amber, .sleek-btn.amber:where(*) {
          /* vibrant coral-red to golden-yellow gradient - maximum brightness */
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 30%, #ffa500 60%, #ffb700 100%) !important;
          color: #ffffff !important;
          text-shadow: 0 2px 8px rgba(255, 107, 53, 0.3), 0 1px 3px rgba(0,0,0,0.2);
          box-shadow: 0 10px 40px 0 rgba(255, 107, 53, 0.9), 0 1px 0 rgba(255,255,255,0.1) inset;
          border: 2px solid #ffffff;
          filter: brightness(1.1) saturate(1.2);
          font-weight: 700;
        }
        .sleek-btn.amber:hover {
          transform: translateY(-5px) scale(1.1) rotate(-1deg);
          box-shadow: 0 18px 60px 0 rgba(255, 107, 53, 1), 0 1px 0 rgba(255,255,255,0.12) inset;
          filter: brightness(1.18) saturate(1.28) drop-shadow(0 10px 28px rgba(255, 107, 53, 0.4));
        }

        /* Upcoming Events (bright, but secondary) */
        .sleek-btn.blue, .sleek-btn.blue:where(*) {
          /* vibrant cyan-blue to purple gradient - bright but less intense */
          background: linear-gradient(135deg, #00d4ff 0%, #0099ff 40%, #5b5bff 80%, #8b5cf6 100%) !important;
          color: #ffffff !important;
          text-shadow: 0 1px 4px rgba(0, 153, 255, 0.2), 0 1px 2px rgba(0,0,0,0.15);
          box-shadow: 0 8px 32px rgba(0, 153, 255, 0.5), 0 1px 0 rgba(255,255,255,0.08) inset;
          border: 2px solid #ffffff;
          filter: brightness(1.05) saturate(1.15);
          font-weight: 600;
        }
        .sleek-btn.blue:hover {
          transform: translateY(-4px) scale(1.08) rotate(1deg);
          box-shadow: 0 14px 48px rgba(0, 153, 255, 0.65);
          filter: brightness(1.12) saturate(1.22);
        }
      `}</style>
    </>
  );
}
