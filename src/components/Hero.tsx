"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AppImage as Image } from "@/components/AppImage";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

const SLIDE_DURATION_MS = 7000;
const HERO_IMAGE_LIMIT = 8;
const SWIPE_THRESHOLD_PX = 48;

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
  const touchStartX = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGalleryImages() {
      try {
        const { data, error: supabaseError } = await supabase
          .from("gallery_images")
          .select("id, url")
          .order("created_at", { ascending: false })
          .limit(HERO_IMAGE_LIMIT);

        if (supabaseError) throw supabaseError;

        if (isMounted) {
          setGalleryImages(
            (data ?? []).map((img) => ({
              id: img.id,
              url: img.url,
              alt: "TIPAC performance and theatre program",
            })),
          );
          setIsLoadingInitial(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Couldn’t load photos");
          console.error("Error fetching gallery images:", err);
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;
    try {
      const origin = new URL(supabaseUrl).origin;
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    } catch {
      // ignore invalid URL
    }
  }, []);

  const displayImages = galleryImages;

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
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (displayImages.length <= 1 || isUserInteracting) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
      setSlideProgress(0);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(interval);
  }, [displayImages.length, isUserInteracting, currentImageIndex]);

  useEffect(() => {
    if (displayImages.length <= 1 || isUserInteracting) return;

    const start = Date.now();
    const tick = setInterval(() => {
      setSlideProgress(Math.min((Date.now() - start) / SLIDE_DURATION_MS, 1));
    }, 50);

    return () => clearInterval(tick);
  }, [currentImageIndex, displayImages.length, isUserInteracting]);

  const pauseAutoplayBriefly = useCallback(() => {
    setIsUserInteracting(true);
    setSlideProgress(0);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsUserInteracting(false), 8000);
  }, []);

  const goToPrevious = useCallback(() => {
    pauseAutoplayBriefly();
    setCurrentImageIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1,
    );
  }, [displayImages.length, pauseAutoplayBriefly]);

  const goToNext = useCallback(() => {
    pauseAutoplayBriefly();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length, pauseAutoplayBriefly]);

  const goToSlide = (index: number) => {
    pauseAutoplayBriefly();
    setCurrentImageIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || displayImages.length <= 1) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta > 0) goToPrevious();
    else goToNext();
  };

  const scrollToEvents = () => {
    document.getElementById("upcoming-events")?.scrollIntoView({ behavior: "smooth" });
  };

  const currentImage = displayImages[currentImageIndex];

  return (
    <section
      className="relative isolate min-h-[calc(100dvh-4.25rem)] overflow-hidden bg-slate-950 text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="TIPAC hero"
    >
      {/* Full-bleed imagery */}
      <div className="absolute inset-0">
        {isLoadingInitial && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/40" />
        )}

        {!isLoadingInitial && !currentImage && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(127,29,29,0.35),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(88,28,135,0.3),transparent_45%),linear-gradient(160deg,#0b0b12,#1a0a14_55%,#0b0b12)]" />
        )}

        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.div
              key={currentImage.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: SLIDE_DURATION_MS / 1000, ease: "linear" }}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt || "TIPAC Performance"}
                  fill
                  priority={currentImageIndex === 0}
                  fetchPriority={currentImageIndex === 0 ? "high" : "auto"}
                  className="object-cover object-center"
                  sizes="100vw"
                  quality={80}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Readable overlay — stronger on small screens */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/80 sm:from-black/65 sm:via-black/35 sm:to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent sm:from-black/40" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100dvh-4.25rem)] flex-col">
        <div className="container mx-auto flex flex-1 flex-col justify-end px-5 pb-8 pt-16 sm:justify-center sm:px-6 sm:pb-16 sm:pt-20 lg:pb-20">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(3.25rem,14vw,5.5rem)] font-extrabold leading-[0.9] tracking-tight hero-letter-shadow"
            >
              TIPAC
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-[clamp(1.25rem,5vw,2rem)] font-light tracking-wide text-white/95 hero-letter-shadow sm:mt-4"
            >
              Learn. <span className="font-medium text-rose-200">Perform.</span> Shine.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/75 sm:mt-5 sm:text-base sm:text-white/80"
            >
              Theatre education that grows young performers across Uganda.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center"
            >
              <Button
                asChild
                size="lg"
                className="tipac-gradient h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-black/30 sm:w-auto sm:min-w-[9.5rem]"
              >
                <Link href="/tickets">Buy Ticket</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl border-white/25 bg-white/5 text-base font-medium text-white backdrop-blur-sm hover:bg-white/12 hover:text-white sm:w-auto sm:min-w-[9.5rem]"
              >
                <Link href="/gallery">Gallery</Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Bottom chrome: progress + scroll */}
        <div className="container relative z-10 mx-auto flex items-end justify-between gap-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          <div className="min-w-0 flex-1">
            {displayImages.length > 1 && (
              <div className="flex max-w-xs items-center gap-1.5 sm:gap-2">
                {displayImages.map((img, index) => {
                  const active = index === currentImageIndex;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => goToSlide(index)}
                      className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      aria-label={`Slide ${index + 1}`}
                      aria-current={active ? "true" : undefined}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-100 ease-linear ${
                          active ? "" : "w-0 group-hover:w-full group-hover:bg-white/50"
                        }`}
                        style={
                          active
                            ? {
                                width: isUserInteracting
                                  ? "100%"
                                  : `${Math.max(slideProgress * 100, 4)}%`,
                              }
                            : undefined
                        }
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={scrollToEvents}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white/80 sm:text-sm"
            aria-label="Scroll to upcoming events"
          >
            <span className="hidden sm:inline">Events</span>
            <motion.span
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md">
          {error}
        </div>
      )}
    </section>
  );
}
