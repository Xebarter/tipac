'use client';

import { useState, useEffect } from "react";
import useSWR from "swr"; // Fixed: Correct import for SWR
import Link from "next/link";
import Image from "next/image"; // New: For optimized thumbnails
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string; // New: Video duration (e.g., "PT4M30S")
  viewCount?: number; // New: View count
}

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
  original_name?: string;
}

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout

  const response = await fetch(url, {
    signal: controller.signal,
    headers: { "Content-Type": "application/json" },
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    error.name = response.status.toString();
    throw error;
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.videos)) throw new Error("Invalid response");

  return data.videos
    .filter((video: any) => video.id && video.title && video.thumbnail && video.publishedAt)
    .map((video: any) => ({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt,
      duration: video.duration, // Assumes API provides this
      viewCount: video.viewCount,
    }))
    .slice(0, 8); // Still limit, but can paginate later
};

export function YouTubeVideos() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  // Test mode - set to true to force using gallery images as fallback
  const testMode = false;

  // Fetch gallery images for fallback thumbnails
  useEffect(() => {
    async function fetchGalleryImages() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('gallery_images')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) throw supabaseError;

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
          console.log('Gallery images loaded:', formattedImages.length);
        } else {
          console.log('No gallery images found');
        }
      } catch (err) {
        console.error('Error fetching gallery images for fallback thumbnails:', err);
      }
    }

    fetchGalleryImages();
  }, []);

  // New: SWR for caching (refetch every 5min), error retry, and loading states
  const { data: videos = [], error, isLoading, mutate } = useSWR<YouTubeVideo[]>("/api/youtube", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1min dedupe
    errorRetryCount: 3, // Auto-retry up to 3 times with backoff
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Exponential backoff
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      setTimeout(revalidate, delay);
    },
  });

  // New: Manual retry function
  const handleRetry = () => mutate();

  // Error state (enhanced with auto-retry info)
  if (error) {
    return (
      <section className="py-24 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
        {/* Cinematic subtle glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Watch TIPAC</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Check out our latest performances and behind-the-scenes content.</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-red-900/30 rounded-2xl p-8 max-w-2xl mx-auto flex flex-col items-center">
            <p className="text-red-400 mb-6 text-center" role="alert" aria-live="polite">
              {error.message.includes("timeout") ? "Request timed out. Retrying..." : error.message}
            </p>
            <Button onClick={handleRetry} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6">
              Retry Loading Videos
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // New: SEO structured data (add to <Head> in parent or use next-seo)
  // Example: <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: videos.map((v, i) => ({ "@type": "VideoObject", position: i+1, name: v.title, thumbnailUrl: v.thumbnail, uploadDate: v.publishedAt })) })}</script>

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
      {/* Cinematic styling elements */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] opacity-10 bg-primary/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              <path d="M11.973 3.99A8.995 8.995 0 0120.01 12.027c.007.49-.074.962-.224 1.41l-2.062-.516a7 7 0 00-5.741-5.741l-.515-2.063c.448-.15.92-.231 1.41-.224h.095z" />
            </svg>
            Video Archive
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Watch TIPAC</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Check out our latest performances and behind-the-scenes content directly from our YouTube channel.
          </p>
        </div>

        {isLoading ? (
          // Enhanced skeleton with better animation for dark mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[...Array(4)].map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 animate-pulse">
                <div className="relative h-56 bg-slate-800/50"></div>
                <div className="p-8 space-y-4">
                  <div className="h-6 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/4 mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          // Empty state 
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur rounded-3xl border border-slate-800 max-w-3xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No videos available</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Check back later for new performances, interviews, and behind-the-scenes content.</p>
            <Link href="https://www.youtube.com/@TIPAC-UG" target="_blank" rel="noopener noreferrer">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 font-medium rounded-xl shadow-lg transition-colors h-auto">
                Visit YouTube Channel
              </Button>
            </Link>
          </div>
        ) : (
          <div className={`grid gap-8 max-w-5xl mx-auto ${videos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
            }`}>
            {videos.map((video) => {
              // Parse duration (assumes ISO 8601, e.g., PT4M30S -> "4:30")
              const duration = video.duration ? new Date(video.duration.slice(2)).toISOString().slice(11, 19).replace(/^0(?:0:)?0?/, '') : null;

              // Use video thumbnail or fallback to a random gallery image
              let thumbnailSrc = "https://via.placeholder.com/640x360/0f172a/334155?text=TIPAC+Play";

              // In test mode, always use gallery images
              if (testMode) {
                if (galleryImages.length > 0) {
                  const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
                  thumbnailSrc = randomImage.url;
                }
              }
              // Normal mode - check if we have a valid video thumbnail
              else if (video.thumbnail && video.thumbnail.trim() !== '' && !video.thumbnail.includes('default.jpg')) {
                thumbnailSrc = video.thumbnail.replace('default.jpg', 'maxresdefault.jpg');
              }
              // If no valid video thumbnail, try to use a random gallery image
              else if (galleryImages.length > 0) {
                const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
                thumbnailSrc = randomImage.url;
              }

              return (
                <Link
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group border border-slate-800 hover:border-slate-700 block focus:outline-none focus:ring-2 focus:ring-primary/50 flex flex-col h-full transform hover:-translate-y-1 ${videos.length === 1 ? 'lg:max-w-4xl lg:mx-auto' : ''
                    }`}
                  // Accessibility - role and tabIndex for keyboard nav
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                  aria-label={`Watch ${video.title} on YouTube`}
                >
                  <div className={`relative overflow-hidden shrink-0 ${videos.length === 1 ? 'lg:h-96' : 'h-60'
                    }`}>
                    {/* Next.js Image for lazy loading/optimization */}
                    <Image
                      src={thumbnailSrc}
                      alt={`${video.title} thumbnail`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8Alt4YsmAJqJ5zVQR5qY2n1k4R1Qe0J2/9k="
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/640x360/0f172a/334155?text=TIPAC+Play";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`bg-white/10 backdrop-blur-md rounded-full p-4 transform transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 border border-white/20 shadow-2xl flex items-center justify-center ${videos.length === 1 ? 'lg:p-6 w-20 h-20' : 'w-16 h-16'
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`text-white translate-x-0.5 ${videos.length === 1 ? 'h-8 w-8 lg:h-10 lg:w-10' : 'h-8 w-8'
                          }`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {/* Duration badge */}
                    {duration && (
                      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur text-white px-2 py-1 rounded-md text-xs font-medium tracking-wide border border-white/10">
                        {duration}
                      </div>
                    )}
                  </div>

                  <div className={`p-8 flex flex-col flex-grow ${videos.length === 1 ? 'lg:p-10' : ''
                    }`}>
                    <h3 className={`font-bold text-white group-hover:text-primary transition-colors leading-tight mb-3 line-clamp-2 ${videos.length === 1 ? 'text-2xl lg:text-3xl' : 'text-xl'
                      }`}>
                      {video.title}
                    </h3>
                    <div className="flex items-center text-slate-400 text-sm mt-auto font-medium">
                      <span>{new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      {video.viewCount && (
                        <>
                          <span className="mx-2 w-1 h-1 bg-slate-600 rounded-full"></span>
                          <span>{video.viewCount.toLocaleString()} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16">
          <Link href="https://www.youtube.com/@TIPAC-UG" target="_blank" rel="noopener noreferrer">
            <Button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg transition-all h-auto group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-3 text-red-500 group-hover:scale-110 transition-transform">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                <path d="M11.973 3.99A8.995 8.995 0 0120.01 12.027c.007.49-.074.962-.224 1.41l-2.062-.516a7 7 0 00-5.741-5.741l-.515-2.063c.448-.15.92-.231 1.41-.224h.095z" />
              </svg>
              View More on YouTube
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}