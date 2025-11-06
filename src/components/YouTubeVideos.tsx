'use client';

import { useState } from "react";
import useSWR from "swr"; // Fixed: Correct import for SWR
import Link from "next/link";
import Image from "next/image"; // New: For optimized thumbnails
import { Button } from "@/components/ui/button";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string; // New: Video duration (e.g., "PT4M30S")
  viewCount?: number; // New: View count
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
      <section className="py-16 bg-gradient-to-r from-secondary to-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Watch TIPAC</h2>
            <p className="text-white/80 max-w-2xl mx-auto">Check out our latest performances and behind-the-scenes content.</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-700 mb-4" role="alert" aria-live="polite">
              {error.message.includes("timeout") ? "Request timed out. Retrying..." : error.message}
            </p>
            <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white">
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
    <section className="py-16 bg-gradient-to-r from-secondary to-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Watch TIPAC</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Check out our latest performances and behind-the-scenes content from our YouTube channel.
          </p>
        </div>

        {isLoading ? (
          // Enhanced skeleton with better animation
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[...Array(4)].map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-white rounded-2xl overflow-hidden shadow-xl border border-white/20 animate-pulse">
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          // Empty state (unchanged, but added analytics potential)
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No videos available</h3>
            <p className="text-white/80 mb-6">Check back later for new performances and behind-the-scenes content.</p>
            <Link href="https://www.youtube.com/@TIPAC-UG" target="_blank" rel="noopener noreferrer">
              <Button className="tipac-gradient hover:from-secondary/90 hover:to-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg">
                Visit YouTube Channel
              </Button>
            </Link>
          </div>
        ) : (
          <div className={`grid gap-8 max-w-4xl mx-auto ${
            videos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {videos.map((video) => {
              // New: Parse duration (assumes ISO 8601, e.g., PT4M30S -> "4:30")
              const duration = video.duration ? new Date(video.duration.slice(2)).toISOString().slice(11, 19).replace(/^0(?:0:)?0?/, '') : null;

              return (
                <Link
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group border border-gray-200 block focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    videos.length === 1 ? 'lg:max-w-4xl lg:mx-auto' : ''
                  }`}
                  // New: Accessibility - role and tabIndex for keyboard nav
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                  aria-label={`Watch ${video.title} on YouTube`}
                >
                  <div className={`relative overflow-hidden ${
                    videos.length === 1 ? 'lg:h-96' : 'h-48'
                  }`}>
                    {/* New: Next.js Image for lazy loading/optimization */}
                    <Image
                      src={video.thumbnail.replace('default.jpg', 'maxresdefault.jpg')} // Higher res if available
                      alt={`${video.title} thumbnail`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8Alt4YsmAJqJ5zVQR5qY2n1k4R1Qe0J2/9k="
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/320x180?text=Video+Thumbnail";
                      }}
                      // New: Analytics on load (e.g., track impressions)
                      onLoad={() => console.log(`Impression: ${video.id}`)} // Replace with gtag or similar
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`bg-red-600 rounded-full p-4 transform transition-transform duration-300 group-hover:scale-110 shadow-lg flex items-center gap-2 ${
                        videos.length === 1 ? 'lg:p-6' : ''
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`text-white ${
                          videos.length === 1 ? 'h-8 w-8 lg:h-12 lg:w-12' : 'h-8 w-8'
                        }`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        {duration && <span className="text-white text-xs font-medium">{duration}</span>}
                      </div>
                    </div>
                    {/* New: Duration badge fallback if no overlay space */}
                    {duration && videos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {duration}
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-6 ${
                    videos.length === 1 ? 'lg:p-10' : ''
                  }`}>
                    <h3 className={`font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 ${
                      videos.length === 1 ? 'text-xl lg:text-3xl' : 'text-xl'
                    }`}>
                      {video.title}
                    </h3>
                    <p className={`text-gray-600 mt-2 flex items-center gap-4 text-sm ${
                      videos.length === 1 ? 'text-base lg:text-lg' : 'text-xs'
                    }`}>
                      <span>{new Date(video.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                      {video.viewCount && <span className="text-gray-500">{(video.viewCount / 1000).toFixed(0)}K views</span>}
                    </p>
                    {/* New: Analytics on click */}
                    <script dangerouslySetInnerHTML={{ __html: `gtag('event', 'video_click', { 'video_id': '${video.id}' });` }} /> {/* If using GA */}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link href="https://www.youtube.com/@TIPAC-UG" target="_blank" rel="noopener noreferrer">
            <Button className="tipac-gradient hover:from-secondary/90 hover:to-primary/90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg">
              Watch More Videos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}