'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // Track initial load

  useEffect(() => {
    let isMounted = true;
    async function fetchGalleryImages() {
      try {
        const response = await fetch('/api/gallery-images', {
          next: { revalidate: 3600 },
        });
        if (!response.ok) throw new Error('Failed to fetch gallery images');
        const data = await response.json();
        if (isMounted) {
          if (data.images?.length > 0) {
            setGalleryImages(
              data.images.map((url: string, index: number) => ({
                id: `image-${index}`,
                url,
                alt: `Performance at TIPAC theatre program, showcasing ${
                  url.split('.')[0]
                }`,
              }))
            );
          } else {
            setError('No images available');
          }
          setIsLoadingInitial(false); // Initial load complete
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load images. Please try again later.');
          console.error('Error fetching gallery images:', err);
          setIsLoadingInitial(false); // Initial load failed
        }
      }
    }
    fetchGalleryImages();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (galleryImages.length <= 1 || isUserInteracting) return;
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(imageInterval);
  }, [galleryImages, isUserInteracting]);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    setIsUserInteracting(true);
    setCurrentImageIndex((prev) =>
      direction === 'prev'
        ? (prev - 1 + galleryImages.length) % galleryImages.length
        : (prev + 1) % galleryImages.length
    );
    setTimeout(() => setIsUserInteracting(false), 3000);
  };

  return (
    <>
      <Head>
        <link
          rel="preload"
          href={
            galleryImages.length > 0
              ? `/gallery/${galleryImages[0].url}`
              : '/images/fallback-placeholder.jpg'
          }
          as="image"
          fetchPriority="high"
        />
      </Head>
      <section
        role="region"
        aria-label="Hero section with image slideshow"
        className="w-full flex flex-col min-h-[40rem] relative bg-slate-50 dark:bg-slate-900"
      >
        {/* Image Slideshow Container */}
        <div className="relative w-full h-[50vh] sm:h-[70vh] md:min-h-[40rem]">
          {error ? (
            <div className="absolute inset-0 flex justify-center items-center bg-slate-100 dark:bg-slate-800">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          ) : galleryImages.length === 0 && isLoadingInitial ? (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          ) : (
            <div className="absolute inset-0">
              {galleryImages.map((image, index) => (
                <Image
                  key={image.id}
                  src={`/gallery/${image.url}`}
                  alt={image.alt || `TIPAC theatre program image ${index + 1}`}
                  fill
                  className={`object-cover object-center transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  // Optimization: Consider smaller sizes for initial mobile view
                  // sizes="(max-width: 768px) 75vw, 100vw"
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {galleryImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white text-slate-800 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 z-30"
                    onClick={() => handleImageNavigation('prev')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        handleImageNavigation('prev');
                    }}
                    tabIndex={0}
                    aria-label="Previous image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white text-slate-800 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 z-30"
                    onClick={() => handleImageNavigation('next')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        handleImageNavigation('next');
                    }}
                    tabIndex={0}
                    aria-label="Next image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-30">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setIsUserInteracting(true);
                          setCurrentImageIndex(i);
                          setTimeout(() => setIsUserInteracting(false), 3000);
                        }}
                        className={`w-3 h-3 rounded-full ${
                          currentImageIndex === i ? 'bg-white' : 'bg-white/40'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        aria-label={`Select image ${i + 1}`}
                        tabIndex={0}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="w-full md:absolute md:inset-0 md:flex md:items-center z-20 px-4 md:px-8">
          <div
            className="max-w-md mx-auto md:mx-0 p-4 rounded-xl backdrop-blur-sm text-white text-center md:text-left mt-6 md:mt-0
              bg-gradient-to-br from-indigo-900 via-purple-900 to-black/90 md:bg-black/20 md:backdrop-blur-md"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              Empowering Children Through{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
                Theatre
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-4">
              TIPAC works to inspire, educate, and transform the lives of
              children in Uganda through the power of theatrical arts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-center md:justify-start">
              <Link href="/contact" passHref>
                <Button className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:opacity-90 text-white font-medium">
                  Contact Us
                </Button>
              </Link>
              <Link href="/donation" passHref>
                <Button className="bg-gradient-to-r from-green-500 via-lime-500 to-yellow-500 hover:opacity-90 text-white font-medium">
                  Donate
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-500"></div>
                <div className="w-8 h-8 rounded-full bg-red-500"></div>
                <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-sm">
                #MDD & Poetry Festival 2025 @ National Theatre
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}