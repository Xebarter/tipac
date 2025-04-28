'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

// TypeScript interfaces for type safety
interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

interface LayoutClasses {
  container: string;
  content: string;
  gallery: string;
}

// Layout configuration for maintainability
const layoutConfigs: LayoutClasses[] = [
  {
    container: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
    content: 'order-2 lg:order-1',
    gallery: 'order-1 lg:order-2',
  },
  {
    container: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
    content: 'order-2 lg:order-1 text-center lg:text-left',
    gallery: 'order-1 lg:order-2',
  },
  {
    container: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
    content: 'order-2 lg:order-1',
    gallery: 'order-1 lg:order-2',
  },
];

// Reusable component for featured image layout
const FeaturedImage = ({
  currentImageIndex,
  galleryImages,
  handleImageNavigation,
}: {
  currentImageIndex: number;
  galleryImages: GalleryImage[];
  handleImageNavigation: (direction: 'prev' | 'next') => void;
}) => (
  <div className="relative w-full min-h-[24rem] rounded-xl overflow-hidden shadow-xl">
    <Image
      src={`/gallery/${galleryImages[currentImageIndex].url}`}
      alt={galleryImages[currentImageIndex].alt || `TIPAC theatre program image ${currentImageIndex + 1}`}
      fill
      className="object-cover object-center transition-opacity duration-300"
      priority={currentImageIndex === 0}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <p className="text-lg font-medium">
          Image {currentImageIndex + 1} of {galleryImages.length}
        </p>
      </div>
    </div>
    <button
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={() => handleImageNavigation('prev')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleImageNavigation('prev');
      }}
      tabIndex={0}
      aria-label="Previous image"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <button
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={() => handleImageNavigation('next')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleImageNavigation('next');
      }}
      tabIndex={0}
      aria-label="Next image"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </div>
);

// Reusable component for grid layout
const GridLayout = ({
  currentImageIndex,
  galleryImages,
}: {
  currentImageIndex: number;
  galleryImages: GalleryImage[];
}) => (
  <div className="w-full min-h-[24rem] grid grid-cols-3 grid-rows-2 gap-2">
    <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden shadow-xl">
      <Image
        src={`/gallery/${galleryImages[currentImageIndex].url}`}
        alt={galleryImages[currentImageIndex].alt || `Main TIPAC theatre program image ${currentImageIndex + 1}`}
        fill
        className="object-cover object-center transition-opacity duration-300"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
        Featured Performance
      </div>
    </div>
    {[1, 2].map((offset) => {
      const imgIndex = (currentImageIndex + offset) % galleryImages.length;
      return (
        <div key={offset} className="relative rounded-lg overflow-hidden shadow-md">
          <Image
            src={`/gallery/${galleryImages[imgIndex].url}`}
            alt={galleryImages[imgIndex].alt || `TIPAC theatre program thumbnail ${imgIndex + 1}`}
            fill
            className="object-cover object-center transition-opacity duration-300"
            sizes="(max-width: 768px) 33vw, 25vw"
          />
        </div>
      );
    })}
  </div>
);

// Reusable component for carousel layout
const CarouselLayout = ({
  currentImageIndex,
  galleryImages,
  setCurrentImageIndex,
}: {
  currentImageIndex: number;
  galleryImages: GalleryImage[];
  setCurrentImageIndex: (index: number) => void;
}) => (
  <div className="relative w-full min-h-[24rem] overflow-hidden rounded-xl">
    <div className="absolute inset-0 flex justify-center items-center">
      <div className="relative w-4/5 h-4/5 rounded-xl overflow-hidden shadow-2xl z-20">
        <Image
          src={`/gallery/${galleryImages[currentImageIndex].url}`}
          alt={galleryImages[currentImageIndex].alt || `Main TIPAC theatre program image ${currentImageIndex + 1}`}
          fill
          className="object-cover object-center transition-opacity duration-300"
          priority
          sizes="(max-width: 768px) 80vw, 60vw"
        />
      </div>
    </div>
    <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-1/3 h-3/5 rounded-xl overflow-hidden shadow-xl opacity-70 transform -rotate-6 z-10">
      <Image
        src={`/gallery/${galleryImages[(currentImageIndex - 1 + galleryImages.length) % galleryImages.length].url}`}
        alt="Previous TIPAC theatre image"
        fill
        className="object-cover object-center transition-opacity duration-300"
        sizes="25vw"
      />
    </div>
    <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-1/3 h-3/5 rounded-xl overflow-hidden shadow-xl opacity-70 transform rotate-6 z-10">
      <Image
        src={`/gallery/${galleryImages[(currentImageIndex + 1) % galleryImages.length].url}`}
        alt="Next TIPAC theatre image"
        fill
        className="object-cover object-center transition-opacity duration-300"
        sizes="25vw"
      />
    </div>
    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
      {galleryImages.length <= 10 ? (
        galleryImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImageIndex(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setCurrentImageIndex(i);
            }}
            className={`w-3 h-3 rounded-full ${currentImageIndex === i ? 'bg-white' : 'bg-white/50'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label={`Select image ${i + 1} of ${galleryImages.length}`}
            aria-current={currentImageIndex === i}
            tabIndex={0}
          />
        ))
      ) : (
        <>
          {[...Array(5)].map((_, i) => {
            const showIndex =
              i === 0 ? 0 : i === 4 ? galleryImages.length - 1 : Math.floor((i * galleryImages.length) / 4);
            return (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(showIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setCurrentImageIndex(showIndex);
                }}
                className={`w-3 h-3 rounded-full ${currentImageIndex === showIndex ? 'bg-white' : 'bg-white/50'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`Select image ${showIndex + 1} of ${galleryImages.length}`}
                aria-current={currentImageIndex === showIndex}
                tabIndex={0}
              />
            );
          })}
        </>
      )}
    </div>
  </div>
);

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [layoutPosition, setLayoutPosition] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const totalLayouts = 3;

  // Fetch gallery images with caching and error handling
  useEffect(() => {
    let isMounted = true;
    async function fetchGalleryImages() {
      try {
        const response = await fetch('/api/gallery-images', {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });
        if (!response.ok) throw new Error('Failed to fetch gallery images');
        const data = await response.json();
        if (isMounted) {
          if (data.images?.length > 0) {
            setGalleryImages(data.images.map((url: string, index: number) => ({
              id: `image-${index}`,
              url,
              alt: `Performance at TIPAC theatre program, showcasing ${url.split('.')[0]}`,
            })));
          } else {
            setError('No images available');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load images. Please try again later.');
          console.error('Error fetching gallery images:', err);
        }
      }
    }
    fetchGalleryImages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Automatic image rotation with interaction pause
  useEffect(() => {
    if (galleryImages.length === 0 || isUserInteracting) return;
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(imageInterval);
  }, [galleryImages, isUserInteracting]);

  // Layout position changes
  useEffect(() => {
    const layoutInterval = setInterval(() => {
      setLayoutPosition((prev) => (prev + 1) % totalLayouts);
    }, 10000);
    return () => clearInterval(layoutInterval);
  }, []);

  // Memoized layout classes
  const layoutClasses = useMemo(() => layoutConfigs[layoutPosition] || layoutConfigs[0], [layoutPosition]);

  // Handle image navigation with interaction pause
  const handleImageNavigation = (direction: 'prev' | 'next') => {
    setIsUserInteracting(true);
    setCurrentImageIndex((prev) =>
      direction === 'prev'
        ? (prev - 1 + galleryImages.length) % galleryImages.length
        : (prev + 1) % galleryImages.length
    );
    setTimeout(() => setIsUserInteracting(false), 3000); // Resume auto-rotation after 3s
  };

  // Render image gallery based on layout
  const renderImageGallery = () => {
    if (error) {
      return (
        <div className="w-full min-h-[24rem] flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-xl">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }
    if (galleryImages.length === 0) {
      return <div className="animate-pulse w-full min-h-[24rem] bg-gray-200 rounded-xl" />;
    }
    switch (layoutPosition) {
      case 0:
        return (
          <FeaturedImage
            currentImageIndex={currentImageIndex}
            galleryImages={galleryImages}
            handleImageNavigation={handleImageNavigation}
          />
        );
      case 1:
        return <GridLayout currentImageIndex={currentImageIndex} galleryImages={galleryImages} />;
      case 2:
        return (
          <CarouselLayout
            currentImageIndex={currentImageIndex}
            galleryImages={galleryImages}
            setCurrentImageIndex={setCurrentImageIndex}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <link
          rel="preload"
          href={galleryImages.length > 0 ? `/gallery/${galleryImages[0].url}` : '/images/fallback-placeholder.jpg'}
          as="image"
          fetchPriority="high"
        />
      </Head>
      <section
        role="region"
        aria-label="Hero section with image gallery"
        className="w-full min-h-[40rem] py-12 overflow-hidden bg-slate-50 dark:bg-slate-900"
      >
        <div className="container h-full px-4 md:px-6 flex items-center">
          <div className={`${layoutClasses.container} w-full transition-all duration-1000`}>
            <div
              className={`${layoutClasses.content} flex flex-col justify-center min-h-[24rem] transition-all duration-1000`}
            >
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  {layoutPosition === 2 ? (
                    <>
                      Theatrical{' '}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 dark:from-red-400 dark:via-purple-400 dark:to-blue-400 transition-all duration-300">
                        Innovation
                      </span>{' '}
                      for Children
                    </>
                  ) : (
                    <>
                      Empowering Children Through{' '}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 dark:from-red-400 dark:via-purple-400 dark:to-blue-400 transition-all duration-300">
                        Theatre
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-xl text-slate-700 dark:text-slate-300 max-w-md transition-all duration-1000">
                  TIPAC works to inspire, educate, and transform the lives of children in Uganda through the power of
                  theatrical arts.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/programs" passHref>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:opacity-90 text-white font-medium"
                  >
                    Our Programs
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500"></div>
                  <div className="w-8 h-8 rounded-full bg-red-500"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-sm font-medium">#MDD & Poetry Festival 2025 @ National Theatre</p>
              </div>
            </div>
            <div className={`${layoutClasses.gallery} min-h-[24rem] flex items-center transition-all duration-1000`}>
              {renderImageGallery()}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}