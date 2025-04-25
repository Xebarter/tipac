"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";

// Define types for gallery items
interface GalleryItem {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  category: string;
}

// Props type for ModifiedGalleryContent
interface ModifiedGalleryContentProps {
  galleryItems: GalleryItem[];
  categories: string[];
  onImageClick: (imageUrl: string, index: number) => void;
}

// This component fetches the image list from the API
export default function GalleryPage() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch images from our API route
  useEffect(() => {
    async function fetchGalleryImages() {
      try {
        setLoading(true);
        const response = await fetch('/api/gallery-images');
        
        if (!response.ok) {
          throw new Error('Failed to fetch gallery images');
        }
        
        const data = await response.json();
        const imageFiles = data.images;
        
        // Create gallery items from the image filenames
        const items: GalleryItem[] = imageFiles.map((filename: string, index: number) => {
          // Generate a random category for each image
          const categories = ["Performances", "Workshops", "Outreach"];
          const randomCategory = categories[Math.floor(Math.random() * categories.length)];
          
          return {
            id: index + 1,
            imageUrl: `/gallery/${filename}`,
            title: `Gallery Image ${index + 1}`,
            description: `Beautiful image from our gallery collection.`,
            category: randomCategory,
          };
        });
        
        // Shuffle the array to randomize the order
        const shuffledItems = [...items].sort(() => Math.random() - 0.5);
        setGalleryItems(shuffledItems);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching gallery images:", err);
        setError("Failed to load gallery images. Please try again later.");
        setLoading(false);
      }
    }

    fetchGalleryImages();
  }, []);

  // Extract unique categories for filtering
  const categories: string[] = ["All", ...Array.from(new Set(galleryItems.map(item => item.category)))];

  // Function to open preview modal
  const openPreview = (imageUrl: string, index: number): void => {
    setPreviewImage(imageUrl);
    setPreviewIndex(index);
    document.body.style.overflow = "hidden"; // Prevent scrolling of main page when modal is open
  };

  // Function to close preview modal
  const closePreview = (): void => {
    setPreviewImage(null);
    document.body.style.overflow = "auto"; // Restore scrolling
  };

  // Functions to navigate between images in preview mode
  const prevImage = (): void => {
    const newIndex = (previewIndex - 1 + galleryItems.length) % galleryItems.length;
    setPreviewIndex(newIndex);
    setPreviewImage(galleryItems[newIndex].imageUrl);
  };

  const nextImage = (): void => {
    const newIndex = (previewIndex + 1) % galleryItems.length;
    setPreviewIndex(newIndex);
    setPreviewImage(galleryItems[newIndex].imageUrl);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (previewImage) {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closePreview();
    }
  };

  return (
    <main className="min-h-screen flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      <Navbar />
      
      {loading ? (
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      ) : (
        <ModifiedGalleryContent 
          galleryItems={galleryItems} 
          categories={categories} 
          onImageClick={openPreview} 
        />
      )}
      
      <Footer />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col justify-center items-center">
          <div className="absolute top-4 right-4 z-10 flex space-x-4">
            <button 
              onClick={closePreview}
              className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full"
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <button 
              onClick={prevImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-4 rounded-full"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button 
              onClick={nextImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-4 rounded-full"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="w-full h-full max-w-6xl max-h-[80vh] relative overflow-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <img 
                src={previewImage} 
                alt={galleryItems[previewIndex].title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0">
            <div className="bg-black bg-opacity-75 text-white p-4 max-w-2xl mx-auto rounded-lg">
              <h3 className="text-xl font-bold">{galleryItems[previewIndex].title}</h3>
              <p className="text-gray-300">{galleryItems[previewIndex].description}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Modified version of GalleryContent that includes click handler for images
function ModifiedGalleryContent({ galleryItems, categories, onImageClick }: ModifiedGalleryContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const filteredItems = activeCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section className="flex-grow py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">
          Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">Gallery</span>
        </h1>
        
        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-gradient-to-r from-red-500 to-purple-500 text-white"
                  : "bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <div 
                className="relative h-64 cursor-pointer" 
                onClick={() => onImageClick(item.imageUrl, galleryItems.findIndex(gi => gi.id === item.id))}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-4 text-white">
                    <span className="bg-red-500 text-xs font-medium px-2 py-1 rounded-full">
                      Click to expand
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}