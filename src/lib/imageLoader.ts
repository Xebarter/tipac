/**
 * Custom Next.js image loader.
 *
 * Remote images are served directly instead of via /_next/image, which can
 * return 402 when hosting image-optimization quotas are exceeded.
 */
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src }: ImageLoaderParams): string {
  // Supabase and other remote URLs — load directly from origin
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Local public assets
  return src;
}
