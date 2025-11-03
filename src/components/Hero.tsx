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
    return () => interval && clearInterval(interval);
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
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Button
              asChild
              size="lg"
              className="sleek-btn amber"
            >
              <Link href="/tickets">Buy Ticket</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="sleek-btn blue"
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
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl leading-tight">
              TIPAC
            </h1>
            <p className="text-2xl md:text-3xl mb-10 drop-shadow-xl leading-relaxed text-white/90">
              Theatre Initiative for the Pearl of Africa Children
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Button asChild size="lg" className="sleek-btn amber">
                <Link href="/tickets">Buy Ticket</Link>
              </Button>
              <Button asChild size="lg" className="sleek-btn blue">
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

        .sleek-btn.amber {
          background: linear-gradient(135deg, #ffc107, #ff6b00);
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          box-shadow: 0 4px 25px rgba(255, 166, 0, 0.4);
        }
        .sleek-btn.amber:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 35px rgba(255, 166, 0, 0.6);
        }

        .sleek-btn.blue {
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          box-shadow: 0 4px 25px rgba(59, 130, 246, 0.3);
        }
        .sleek-btn.blue:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 35px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}
