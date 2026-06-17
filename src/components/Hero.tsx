'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  original_name?: string;
}

const SLIDE_DURATION_MS = 6000;

const PILLARS = [
  { label: 'Theatre Education', value: '5+ Programs' },
  { label: 'Youth Development', value: 'Ages 6–18' },
  { label: 'Cultural Heritage', value: 'Uganda' },
];

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);

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
            const formattedImages = data.map((img) => ({
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
            setGalleryImages([]);
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

  const displayImages = galleryImages;

  useEffect(() => {
    setCurrentImageIndex(0);
    setSlideProgress(0);
  }, [galleryImages.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (displayImages.length > 1 && !isUserInteracting) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
        setSlideProgress(0);
      }, SLIDE_DURATION_MS);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [displayImages.length, isUserInteracting, currentImageIndex]);

  useEffect(() => {
    if (displayImages.length <= 1 || isUserInteracting) return;

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setSlideProgress(Math.min(elapsed / SLIDE_DURATION_MS, 1));
    }, 50);

    return () => clearInterval(tick);
  }, [currentImageIndex, displayImages.length, isUserInteracting]);

  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    setSlideProgress(0);
    setTimeout(() => setIsUserInteracting(false), 10000);
  }, []);

  const goToPrevious = () => {
    handleUserInteraction();
    setCurrentImageIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    handleUserInteraction();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const goToSlide = (index: number) => {
    handleUserInteraction();
    setCurrentImageIndex(index);
  };

  const scrollToEvents = () => {
    document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentImage = displayImages[currentImageIndex];

  return (
    <section className="relative h-[calc(100dvh-4.5rem)] flex flex-col justify-end overflow-hidden bg-slate-950">
      {/* Background images */}
      <div className="absolute inset-0 z-0">
        {isLoadingInitial && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-900 to-rose-950 animate-pulse" />
        )}

        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.div
              key={currentImage.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ scale: [1, 1.08] }}
                transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt || 'TIPAC Performance'}
                  fill
                  priority={currentImageIndex === 0}
                  className="object-cover"
                  sizes="100vw"
                  quality={85}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle edge vignette — keeps images visible behind text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full pb-20 pt-6 sm:pt-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="h-px w-10 sm:w-14 bg-gradient-to-r from-rose-400 to-purple-400" />
              <span className="text-white/90 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase hero-letter-shadow">
                Theatre for Children
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight leading-[0.9] hero-letter-shadow">
              TIPAC
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl font-light text-white mb-3 sm:mb-4 tracking-wide hero-letter-shadow">
              Learn.{' '}
              <span className="text-rose-200 font-normal">
                Perform.
              </span>{' '}
              Shine.
            </p>

            <div className="h-px w-full max-w-md bg-gradient-to-r from-white/30 via-white/10 to-transparent mb-3 sm:mb-4" />

            <p className="text-sm sm:text-base text-white/90 max-w-xl leading-snug sm:leading-relaxed font-light hero-letter-shadow">
              Empowering young performers across Uganda through theatre education,
              cultural storytelling, and the transformative power of the arts.
            </p>
          </motion.div>

          {/* Executive pillars */}
          <motion.div
            className="mt-5 sm:mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {PILLARS.map((pillar) => (
              <div key={pillar.label} className="border-l border-white/20 pl-3 sm:pl-4">
                <p className="text-white text-sm sm:text-base font-semibold tracking-tight hero-letter-shadow">
                  {pillar.value}
                </p>
                <p className="text-white/70 text-[10px] sm:text-xs mt-0.5 tracking-wide uppercase hero-letter-shadow">
                  {pillar.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Carousel controls */}
      {displayImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Bottom bar: progress, dots */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-5">
          {displayImages.length > 1 && (
            <div className="flex items-center justify-end gap-2 sm:gap-3 mb-3">
              {displayImages.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className="group relative"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <span
                    className={`block h-1 rounded-full transition-all duration-500 ${index === currentImageIndex
                        ? 'w-8 sm:w-10 bg-white'
                        : 'w-4 sm:w-5 bg-white/30 group-hover:bg-white/50'
                      }`}
                  />
                </button>
              ))}
            </div>
          )}

          {displayImages.length > 1 && !isUserInteracting && (
            <div className="h-px w-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-400/80 to-purple-400/80 transition-none"
                style={{ width: `${slideProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToEvents}
        className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors duration-300"
        aria-label="Scroll to upcoming events"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Error state */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 text-sm">
          {error}
        </div>
      )}
    </section>
  );
}
