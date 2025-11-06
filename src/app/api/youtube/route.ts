import { NextResponse } from "next/server";

// YouTube Data API v3 endpoint
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// Channel ID for TIPAC-UG
const CHANNEL_ID = "UC9zkuY5thj7q-6gds2DDNKg";

// Function to shuffle array elements
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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
          title: "TIPAC Performance Highlights",
          thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
          publishedAt: "2023-06-15T10:00:00Z"
        },
        {
          id: "dQw4w9WgXcQ",
          title: "Behind the Scenes at TIPAC",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          publishedAt: "2023-05-20T14:30:00Z"
        },
        {
          id: "DLzxrzFCyOs",
          title: "TIPAC Cultural Workshop",
          thumbnail: "https://img.youtube.com/vi/DLzxrzFCyOs/maxresdefault.jpg",
          publishedAt: "2023-04-10T09:15:00Z"
        },
        {
          id: "jNQXAC9IVRw",
          title: "TIPAC Theatre Rehearsal",
          thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
          publishedAt: "2023-03-22T16:45:00Z"
        }
      ];

      // Shuffle mock videos and return only 2
      const shuffledVideos = shuffleArray(videos).slice(0, 2);
      return NextResponse.json({ videos: shuffledVideos });
    }

    // Fetch videos from the channel
    const searchParams = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      channelId: CHANNEL_ID,
      part: "snippet",
      order: "date",
      maxResults: "12", // Fetch more videos to account for filtering
      type: "video"
    });

    const response = await fetch(
      `${YOUTUBE_API_URL}/search?${searchParams}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      // Return mock data on API error
      const videos = [
        {
          id: "8EVuKfbqMtQ",
          title: "TIPAC Performance Highlights",
          thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
          publishedAt: "2023-06-15T10:00:00Z"
        },
        {
          id: "dQw4w9WgXcQ",
          title: "Behind the Scenes at TIPAC",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          publishedAt: "2023-05-20T14:30:00Z"
        },
        {
          id: "DLzxrzFCyOs",
          title: "TIPAC Cultural Workshop",
          thumbnail: "https://img.youtube.com/vi/DLzxrzFCyOs/maxresdefault.jpg",
          publishedAt: "2023-04-10T09:15:00Z"
        },
        {
          id: "jNQXAC9IVRw",
          title: "TIPAC Theatre Rehearsal",
          thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
          publishedAt: "2023-03-22T16:45:00Z"
        }
      ];

      // Shuffle mock videos and return only 2
      const shuffledVideos = shuffleArray(videos).slice(0, 2);
      return NextResponse.json({ videos: shuffledVideos });
    }

    const data = await response.json();

    // Extract and filter relevant video information
    // Ensure videos are from the correct channel
    const videos = data.items
      .filter((item: any) => {
        const isCorrectChannel = item.snippet.channelId === CHANNEL_ID;
        if (!isCorrectChannel) {
          console.warn(`Video ${item.id.videoId} is from channel ${item.snippet.channelId}, not from the expected channel ${CHANNEL_ID}`);
        }
        return isCorrectChannel;
      })
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "https://via.placeholder.com/320x180?text=Video+Thumbnail",
        publishedAt: item.snippet.publishedAt
      }));

    console.log(`Found ${videos.length} videos from channel ${CHANNEL_ID}`);

    // If we don't have enough videos, return mock data
    if (videos.length < 2) {
      console.warn(`Not enough videos from the specified channel (${videos.length} found), returning mock data`);
      const mockVideos = [
        {
          id: "8EVuKfbqMtQ",
          title: "TIPAC Performance Highlights",
          thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
          publishedAt: "2023-06-15T10:00:00Z"
        },
        {
          id: "dQw4w9WgXcQ",
          title: "Behind the Scenes at TIPAC",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          publishedAt: "2023-05-20T14:30:00Z"
        },
        {
          id: "DLzxrzFCyOs",
          title: "TIPAC Cultural Workshop",
          thumbnail: "https://img.youtube.com/vi/DLzxrzFCyOs/maxresdefault.jpg",
          publishedAt: "2023-04-10T09:15:00Z"
        },
        {
          id: "jNQXAC9IVRw",
          title: "TIPAC Theatre Rehearsal",
          thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
          publishedAt: "2023-03-22T16:45:00Z"
        }
      ];

      // Shuffle mock videos and return only 2
      const shuffledVideos = shuffleArray(mockVideos).slice(0, 2);
      return NextResponse.json({ videos: shuffledVideos });
    }

    // Shuffle real videos and return only 2
    const shuffledVideos = shuffleArray(videos).slice(0, 2);
    return NextResponse.json({ videos: shuffledVideos });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    
    // Return mock data on error
    const videos = [
      {
        id: "8EVuKfbqMtQ",
        title: "TIPAC Performance Highlights",
        thumbnail: "https://img.youtube.com/vi/8EVuKfbqMtQ/maxresdefault.jpg",
        publishedAt: "2023-06-15T10:00:00Z"
      },
      {
        id: "dQw4w9WgXcQ",
        title: "Behind the Scenes at TIPAC",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        publishedAt: "2023-05-20T14:30:00Z"
      },
      {
        id: "DLzxrzFCyOs",
        title: "TIPAC Cultural Workshop",
        thumbnail: "https://img.youtube.com/vi/DLzxrzFCyOs/maxresdefault.jpg",
        publishedAt: "2023-04-10T09:15:00Z"
      },
      {
        id: "jNQXAC9IVRw",
        title: "TIPAC Theatre Rehearsal",
        thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
        publishedAt: "2023-03-22T16:45:00Z"
      }
    ];

    // Shuffle mock videos and return only 2
    const shuffledVideos = shuffleArray(videos).slice(0, 2);
    return NextResponse.json({ videos: shuffledVideos });
  }
}