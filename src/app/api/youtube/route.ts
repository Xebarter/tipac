import { NextResponse } from "next/server";

// YouTube Data API v3 endpoint
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// Channel ID for TIPAC-UG
const CHANNEL_ID = "UC9zkuY5thj7q-6gds2DDNKg";

export async function GET() {
  try {
    // Try to get YouTube API key from environment variables
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      // If no API key, return mock data
      console.warn("No YOUTUBE_API_KEY found, returning mock data");
      const videos = [
        {
          id: "8EVuKfbqMtQ",
          title: "TIPAC Performance",
          thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
          publishedAt: "2023-06-15T10:00:00Z",
        },
        {
          id: "8EVuKfbqMtQ",
          title: "TIPAC Show",
          thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
          publishedAt: "2023-05-20T14:30:00Z",
        },
      ];

      return NextResponse.json({ videos });
    }

    // Fetch videos from the channel
    const searchParams = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      channelId: CHANNEL_ID,
      part: "snippet",
      order: "date",
      maxResults: "2",
      type: "video",
    });

    const response = await fetch(`${YOUTUBE_API_URL}/search?${searchParams}`);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant video information
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
