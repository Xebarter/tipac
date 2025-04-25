import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Get the absolute path to the gallery directory
    const galleryDir = path.join(process.cwd(), "public/gallery");
    
    // Read the directory contents
    const files = fs.readdirSync(galleryDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension);
    });
    
    // Shuffle the array to randomize the order
    const shuffledImages = [...imageFiles].sort(() => Math.random() - 0.5);
    
    // Return the list of image files
    return NextResponse.json({ images: shuffledImages });
  } catch (error) {
    console.error("Error reading gallery directory:", error);
    return NextResponse.json(
      { error: "Failed to read gallery directory" },
      { status: 500 }
    );
  }
}