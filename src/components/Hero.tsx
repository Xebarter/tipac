'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppImage as Image } from '@/components/AppImage';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

const SLIDE_DURATION_MS = 6000;
const HERO_IMAGE_LIMIT = 8;

const PILLARS = [
  { label: 'Theatre Education', value: '5+ Programs' },
  { label: 'Youth Development', value: 'Ages 6–18' },
  { label: 'Cultural Heritage', value: 'Uganda' },
];

function preloadImage(url: string) {
  const img = new window.Image();
  img.src = url;
}

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
          .select('id, url')
          .order('created_at', { ascending: false })
          .limit(HERO_IMAGE_LIMIT);

        if (supabaseError) throw supabaseError;

        if (isMounted) {
          if (data && data.length > 0) {
            setGalleryImages(
              data.map((img) => ({
                id: img.id,
                url: img.url,
                alt: 'TIPAC performance and theatre program',
              })),
            );
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

  // Preconnect to Supabase storage for faster first image fetch
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;
    try {
      const origin = new URL(supabaseUrl).origin;
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch {
      // ignore invalid URL
    }
  }, []);

  const displayImages = galleryImages;

  // Preload first slides immediately, then adjacent slides as user navigates
  useEffect(() => {
    if (displayImages.length === 0) return;
    displayImages.slice(0, 3).forEach((img) => preloadImage(img.url));
  }, [displayImages]);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const next = (currentImageIndex + 1) % displayImages.length;
    const prev = (currentImageIndex - 1 + displayImages.length) % displayImages.length;
    preloadImage(displayImages[next].url);
    preloadImage(displayImages[prev].url);
  }, [currentImageIndex, displayImages]);

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
      prev === 0 ? displayImages.length - 1 : prev - 1,
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
    <section className="relative overflow-hidden bg-slate-950">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-slate-950 to-rose-950/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(168,85,247,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_75%,rgba(244,63,94,0.1)_0%,transparent_45%)] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-rose-600/8 rounded-full blur-3xl translate-x-1/4 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center min-h-[calc(100dvh-4.5rem)] py-10 sm:py-14 lg:py-16">
          {/* Copy column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-1 flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs sm:text-sm font-medium text-white/90 tracking-[0.15em] uppercase mb-5 sm:mb-6">
              <Sparkles className="h-3.5 w-3.5 text-rose-300" />
              Theatre for Children
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[0.9] mb-3 sm:mb-4 hero-letter-shadow">
              TIPAC
            </h1>

            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white mb-4 sm:mb-5 tracking-wide hero-letter-shadow">
              Learn.{' '}
              <span className="text-rose-200 font-normal">Perform.</span>{' '}
              Shine.
            </p>

            <div className="h-px w-full max-w-md bg-gradient-to-r from-white/30 via-white/10 to-transparent mb-4 sm:mb-5" />

            <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed mb-6 sm:mb-8 font-light hero-letter-shadow">
              Empowering young performers across Uganda through theatre education,
              cultural storytelling, and the transformative power of the arts.
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-xl mb-7 sm:mb-8">
              {PILLARS.map((pillar) => (
                <div
                  key={pillar.label}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4"
                >
                  <p className="text-sm sm:text-base font-semibold text-white tracking-tight hero-letter-shadow">
                    {pillar.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 uppercase tracking-wide">
                    {pillar.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button asChild size="lg" className="tipac-gradient shadow-lg shadow-purple-900/40">
                <Link href="/apply">Apply Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
              >
                <Link href="/gallery">View Gallery</Link>
              </Button>
            </div>

            <button
              type="button"
              onClick={scrollToEvents}
              className="mt-8 sm:mt-10 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors w-fit"
              aria-label="Scroll to upcoming events"
            >
              <span>Explore upcoming events</span>
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>
          </motion.div>

          {/* Image column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-2 w-full"
          >
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              {/* Decorative glow */}
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] bg-gradient-to-br from-purple-500/20 via-transparent to-rose-500/15 blur-xl pointer-events-none" />

              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl shadow-black/50">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent z-10" />

                <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]">
                  {isLoadingInitial && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-900 to-rose-950 animate-pulse" />
                  )}

                  {!isLoadingInitial && !currentImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-950 via-slate-900 to-rose-950">
                      <p className="text-sm text-white/40 px-6 text-center">
                        Gallery photos will appear here
                      </p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {currentImage && (
                      <motion.div
                        key={currentImage.id}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.03 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Image
                          src={currentImage.url}
                          alt={currentImage.alt || 'TIPAC Performance'}
                          fill
                          priority={currentImageIndex === 0}
                          fetchPriority={currentImageIndex === 0 ? 'high' : 'auto'}
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 540px"
                          quality={75}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {displayImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevious}
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Carousel footer */}
                {displayImages.length > 1 && (
                  <div className="px-4 sm:px-5 py-3 sm:py-4 bg-slate-950/80 backdrop-blur-md border-t border-white/5">
                    <div className="flex items-center justify-center gap-2">
                      {displayImages.map((img, index) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => goToSlide(index)}
                          className="group"
                          aria-label={`Go to slide ${index + 1}`}
                        >
                          <span
                            className={`block h-1 rounded-full transition-all duration-500 ${
                              index === currentImageIndex
                                ? 'w-8 sm:w-10 bg-white'
                                : 'w-3 sm:w-4 bg-white/30 group-hover:bg-white/50'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {!isUserInteracting && (
                      <div className="mt-3 h-px w-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-400/80 to-purple-400/80 transition-none"
                          style={{ width: `${slideProgress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 text-sm">
          {error}
        </div>
      )}
    </section>
  );
}
