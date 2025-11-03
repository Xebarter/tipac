# YouTube Integration Setup

To enable the "Watch TIPAC" section to display real videos from your YouTube channel, you need to set up a YouTube Data API key.

## Steps to get a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - In the left sidebar, click on "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
5. Add the API key to your environment variables:
   - Open your `.env.local` file (create it if it doesn't exist)
   - Add the line: `YOUTUBE_API_KEY=your_actual_api_key_here`
   - Replace `your_actual_api_key_here` with your copied API key

## Security Considerations

- Never commit your actual API key to version control
- The `.env` file is included in `.gitignore` to prevent accidental commits
- Use the `.env.example` file to document required environment variables

## How it works

The YouTube integration works as follows:

1. The frontend component [YouTubeVideos.tsx](src/components/YouTubeVideos.tsx) fetches data from our API endpoint
2. The API route [route.ts](src/app/api/youtube/route.ts) connects to the YouTube Data API
3. If a valid API key is present, it fetches the 2 most recent videos from the TIPAC channel
4. If no API key is present, it returns mock data for development purposes

## Troubleshooting

If videos are not loading:

1. Check that you have added the `YOUTUBE_API_KEY` to your environment variables
2. Verify that your API key is valid and the YouTube Data API is enabled
3. Check the browser console and server logs for error messages
4. Ensure your channel has public videos available

The component will gracefully fall back to mock data if the API key is missing or invalid.