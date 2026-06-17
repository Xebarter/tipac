"use client";

import { AppImage as Image } from "@/components/AppImage";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GalleryImage {
  id: string;
  url: string;
}

async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function getDownloadFilename(url: string, index: number) {
  const extension = url.split(".").pop()?.split("?")[0] || "jpg";
  const safeExtension = ["jpg", "jpeg", "png", "webp", "gif"].includes(
    extension.toLowerCase(),
  )
    ? extension.toLowerCase()
    : "jpg";
  return `tipac-gallery-${String(index + 1).padStart(2, "0")}.${safeExtension}`;
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isOpen = lightboxIndex !== null;
  const currentImage = isOpen ? images[lightboxIndex] : null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goToPrevious = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current + 1) % images.length,
    );
  }, [images.length]);

  const handleDownload = async (
    image: GalleryImage,
    index: number,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    setDownloadingId(image.id);
    await downloadImage(image.url, getDownloadFilename(image.url, index));
    setDownloadingId(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, goToPrevious, goToNext]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-purple-100/80 bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.url}
              alt={`TIPAC gallery photo ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-sm font-medium drop-shadow">
                View photo
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(index);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors"
                  aria-label="View full size"
                >
                  <Expand className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(image, index, e)}
                  disabled={downloadingId === image.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors disabled:opacity-60"
                  aria-label="Download photo"
                >
                  {downloadingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && currentImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 md:left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 md:right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl max-h-[80vh] aspect-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[70vh] md:h-[75vh]">
                <Image
                  src={currentImage.url}
                  alt={`TIPAC gallery photo ${lightboxIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-white/70 text-sm">
                  {lightboxIndex + 1} of {images.length}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-900"
                  onClick={() => handleDownload(currentImage, lightboxIndex)}
                  disabled={downloadingId === currentImage.id}
                >
                  {downloadingId === currentImage.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
