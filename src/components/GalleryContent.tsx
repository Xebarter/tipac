"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Client component for gallery with filtering functionality
export function GalleryContent({
  galleryItems,
  categories,
}: {
  galleryItems: Array<{
    id: number;
    imageUrl: string;
    title: string;
    description: string;
    category: string;
  }>;
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter items based on selected category
  const filteredItems =
    selectedCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container">
        <h1 className="text-4xl font-bold mb-6">Our Gallery</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
          Explore photos from our past events, performances, and workshops.
          These moments showcase the joy, creativity, and impact of our theatre
          programs.
        </p>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={selectedCategory === category ? "tipac-gradient" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-lg overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-4 right-4 bg-secondary text-white text-xs font-semibold py-1 px-3 rounded-full">
                  {item.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No items found in this category.
            </p>
          </div>
        )}

        <div className="tipac-gradient mt-16 p-10 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Want to see more?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Follow us on social media for regular updates on our events and
            programs.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => window.open("https://www.facebook.com", "_blank")}
            >
              Facebook
            </Button>
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => window.open("https://www.instagram.com", "_blank")}
            >
              Instagram
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
