import Image, { type ImageProps } from "next/image";

function shouldBypassOptimizer(src: ImageProps["src"]): boolean {
  if (typeof src === "string") {
    return src.startsWith("http://") || src.startsWith("https://");
  }
  return false;
}

/**
 * Drop-in replacement for next/image that skips /_next/image for remote URLs.
 * Avoids 402 errors when proxying Supabase or other external images.
 */
export function AppImage({ unoptimized, src, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      unoptimized={unoptimized ?? shouldBypassOptimizer(src)}
      {...props}
    />
  );
}
