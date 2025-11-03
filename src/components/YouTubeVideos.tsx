"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export function YouTubeVideos() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Validate API endpoint
        const apiUrl = "/api/youtube";
        if (!apiUrl) {
          throw new Error("YouTube API endpoint not configured");
        }

        setLoading(true);
        setError(null);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Add timeout for better UX
          signal: AbortSignal.timeout(10000)
        });

        // Handle different HTTP error statuses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          switch (response.status) {
            case 404:
              throw new Error("YouTube API endpoint not found");
            case 429:
              throw new Error("Too many requests. Please try again later");
            case 500:
              throw new Error("Server error. Please try again later");
            default:
              throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch videos`);
          }
        }

        const data = await response.json();

        // Validate response structure
        if (!data || !Array.isArray(data.videos)) {
          throw new Error("Invalid response format from YouTube API");
        }

        // Validate video data
        const validatedVideos = data.videos
          .filter((video: any) => {
            if (!video.id || !video.title || !video.thumbnail || !video.publishedAt) {
              console.warn("Skipping invalid video data:", video);
              return false;
            }
            return true;
          })
          .slice(0, 8); // Limit to 8 videos maximum

        setVideos(validatedVideos);

        // Handle empty results
        if (validatedVideos.length === 0) {
          setError("No videos found. Check back later for new content!");
        }
      } catch (err: unknown) {
        // Handle different types of errors
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError("Request timed out. Please check your internet connection and try again.");
          } else {
            setError(err.message);
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
        
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handlePlayVideo = (videoId: string) => {
    setPlayingVideo(videoId === playingVideo ? null : videoId);
  };

  // Error state with retry option
  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Watch TIPAC</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check out our latest performances and behind-the-scenes content.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Watch TIPAC</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Check out our latest performances and behind-the-scenes content.
          </p>
        </div>

        {loading ? (
          // Improved loading state with skeleton UI
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[...Array(4)].map((_, index) => (
              <div 
                key={`skeleton-${index}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 animate-pulse"
              >
                <div className="relative h-48 bg-gray-300"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos available</h3>
            <p className="text-gray-500 mb-6">Check back later for new performances and behind-the-scenes content.</p>
            <Link 
              href="https://www.youtube.com/@TIPAC-UG" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
                Visit YouTube Channel
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {videos.map((video) => (
              <div 
                key={video.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  {playingVideo === video.id ? (
                    <div className="w-full h-full">
                      <ReactPlayer
                        url={`https://www.youtube.com/watch?v=${video.id}`}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true}
                        onPause={() => setPlayingVideo(null)}
                        onEnded={() => setPlayingVideo(null)}
                        light={false}
                        config={{
                          youtube: {
                            playerVars: {
                              modestbranding: 1,
                              rel: 0,
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback image if thumbnail fails to load
                          e.currentTarget.src = "https://via.placeholder.com/320x180?text=Video+Thumbnail";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => handlePlayVideo(video.id)}
                          className="bg-red-600 rounded-full p-4 transform transition-transform duration-300 group-hover:scale-110"
                          aria-label={`Watch ${video.title}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    {new Date(video.publishedAt).toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link 
            href="https://www.youtube.com/@TIPAC-UG" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
              Watch More Videos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
