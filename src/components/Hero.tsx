"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [layoutPosition, setLayoutPosition] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const totalLayouts = 3;

  // Fetch gallery images on component mount
  useEffect(() => {
    async function fetchGalleryImages() {
      try {
        const response = await fetch('/api/gallery-images');
        
        if (!response.ok) {
          throw new Error('Failed to fetch gallery images');
        }
        
        const data = await response.json();
        if (data.images && data.images.length > 0) {
          setGalleryImages(data.images);
        }
      } catch (err) {
        console.error("Error fetching gallery images:", err);
      }
    }

    fetchGalleryImages();
  }, []);

  // Automatic image rotation - only starts when we have images
  useEffect(() => {
    if (galleryImages.length === 0) return;
    
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(imageInterval);
  }, [galleryImages]);

  // Layout position changes
  useEffect(() => {
    const layoutInterval = setInterval(() => {
      setLayoutPosition((prevPosition) => (prevPosition + 1) % totalLayouts);
    }, 10000);
    return () => clearInterval(layoutInterval);
  }, []);

  // Generate layout classes based on current position
  const getLayoutClasses = () => {
    switch(layoutPosition) {
      case 0:
        return {
          container: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          content: "order-2 lg:order-1",
          gallery: "order-1 lg:order-2"
        };
      case 1:
        return {
          container: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          content: "order-2 lg:order-1 text-center lg:text-left",
          gallery: "order-1 lg:order-2"
        };
      case 2:
        return {
          container: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          content: "order-2 lg:order-1",
          gallery: "order-1 lg:order-2"
        };
      default:
        return {
          container: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
          content: "order-2 lg:order-1",
          gallery: "order-1 lg:order-2"
        };
    }
  };

  const layoutClasses = getLayoutClasses();

  // Helper function to get image path
  const getImagePath = (index: number) => {
    if (galleryImages.length === 0) return '/placeholder.jpg';
    return `/gallery/${galleryImages[index]}`;
  };

  // More structured and accessible image gallery with random images
  const renderImageGallery = () => {
    // If no images yet, show loading
    if (galleryImages.length === 0) {
      return (
        <div className="w-full h-96 flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    switch(layoutPosition) {
      case 0:
        // Main featured image with navigation
        return (
          <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-xl">
            {/* Main image */}
            <Image 
              src={getImagePath(currentImageIndex)}
              alt={`TIPAC theatre program image ${currentImageIndex + 1}`}
              fill
              className="object-cover object-center"
              priority
            />
            
            {/* Caption overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-lg font-medium">Image {currentImageIndex + 1} of {galleryImages.length}</p>
              </div>
            </div>
            
            {/* Navigation controls */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full"
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full"
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)}
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        );
        
      case 1:
        // Grid layout with fixed height
        return (
          <div className="w-full h-96 grid grid-cols-3 grid-rows-2 gap-2">
            {/* Main large image */}
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden shadow-xl">
              <Image 
                src={getImagePath(currentImageIndex)}
                alt={`Main TIPAC theatre program image ${currentImageIndex + 1}`}
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                Featured Performance
              </div>
            </div>
            
            {/* Smaller thumbnail images - exactly fill the right side */}
            {[1, 2].map((offset) => {
              const imgIndex = (currentImageIndex + offset) % galleryImages.length;
              return (
                <div key={offset} className="relative rounded-lg overflow-hidden shadow-md">
                  <Image 
                    src={getImagePath(imgIndex)}
                    alt={`TIPAC theatre program thumbnail ${imgIndex + 1}`}
                    fill
                    className="object-cover object-center"
                  />
                </div>
              );
            })}
          </div>
        );
        
      case 2:
        // Carousel style with fixed height
        return (
          <div className="relative w-full h-96 overflow-hidden rounded-xl">
            {/* Main center image */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="relative w-4/5 h-4/5 rounded-xl overflow-hidden shadow-2xl z-20">
                <Image 
                  src={getImagePath(currentImageIndex)}
                  alt={`Main TIPAC theatre program image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
            
            {/* Side preview images */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-1/3 h-3/5 rounded-xl overflow-hidden shadow-xl opacity-70 transform -rotate-6 z-10">
              <Image 
                src={getImagePath((currentImageIndex - 1 + galleryImages.length) % galleryImages.length)}
                alt={`Previous TIPAC theatre image`}
                fill
                className="object-cover object-center"
              />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-1/3 h-3/5 rounded-xl overflow-hidden shadow-xl opacity-70 transform rotate-6 z-10">
              <Image 
                src={getImagePath((currentImageIndex + 1) % galleryImages.length)}
                alt={`Next TIPAC theatre image`}
                fill
                className="object-cover object-center"
              />
            </div>
            
            {/* Image indicator dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {galleryImages.length <= 10 ? (
                // Show all dots if 10 or fewer images
                galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-3 h-3 rounded-full ${currentImageIndex === i ? "bg-white" : "bg-white/50"}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))
              ) : (
                // Show limited dots if more than 10 images
                <>
                  {[...Array(5)].map((_, i) => {
                    const showIndex = i === 0 ? 0 : 
                                     i === 4 ? galleryImages.length - 1 : 
                                     Math.floor((i * galleryImages.length) / 4);
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(showIndex)}
                        className={`w-3 h-3 rounded-full ${currentImageIndex === showIndex ? "bg-white" : "bg-white/50"}`}
                        aria-label={`Go to image ${showIndex + 1}`}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <section className="w-full h-[40rem] py-12 overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="container h-full px-4 md:px-6 flex items-center">
        <div className={`${layoutClasses.container} w-full transition-all duration-1000`}>
          {/* Content side - fixed height */}
          <div className={`${layoutClasses.content} flex flex-col justify-center h-96 transition-all duration-1000`}>
            <div className="mb-8">
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 transition-all duration-1000`}>
                {layoutPosition === 2 ? (
                  <>Theatrical <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">Innovation</span> for Children</>
                ) : (
                  <>Empowering Children Through{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">
                    Theatre
                  </span></>
                )}
              </h1>
              <p className={`text-xl text-slate-700 dark:text-slate-300 max-w-md transition-all duration-1000`}>
                TIPAC works to inspire, educate, and transform the lives of children in Uganda through the power of theatrical arts.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button size="lg" className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:opacity-90 text-white font-medium">
                Our Programs
              </Button>
              <Button size="lg" variant="outline" className="border-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                Learn More
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-500"></div>
                <div className="w-8 h-8 rounded-full bg-red-500"></div>
                <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-sm font-medium">#MDD & Poetry Festival 2025 @ National Theatre</p>
            </div>
          </div>
          
          {/* Image gallery side - consistent height */}
          <div className={`${layoutClasses.gallery} h-96 flex items-center transition-all duration-1000`}>
            {renderImageGallery()}
          </div>
        </div>
      </div>
    </section>
  );
}