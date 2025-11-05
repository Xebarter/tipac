"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  created_at: string;
}

interface UploadStatus {
  message: string;
  isError?: boolean;
}

export default function AdminGalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const loadImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setImages(data || []);
      setUploadStatus(null); // Clear any previous status on reload
    } catch (error) {
      console.error("Error loading images:", error);
      setUploadStatus({
        message: "Error loading images. Please refresh.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>,
  ) => {
    let file: File | null = null;

    if ("target" in e && e.target instanceof HTMLInputElement) {
      file = e.target.files?.[0] || null;
    } else if ("dataTransfer" in e) {
      file = e.dataTransfer?.files[0] || null;
    }

    if (!file) return;

    // Reset preview and status
    setPreviewUrl(null);
    setUploadStatus(null);

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({
        message:
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        isError: true,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        message: "File too large. Maximum file size is 5MB.",
        isError: true,
      });
      return;
    }

    // Generate preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Upload file (direct to Supabase for better integration, assuming RLS allows)
    try {
      setIsUploading(true);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(`images/${Date.now()}-${file.name}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert metadata into DB
      const { data: insertData, error: insertError } = await supabase
        .from("gallery_images")
        .insert({
          filename: uploadData.path,
          original_name: file.name,
          url: supabase.storage.from("gallery").getPublicUrl(uploadData.path)
            .data.publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadStatus({
        message: `Image "${file.name}" uploaded successfully!`,
      });
      setPreviewUrl(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload images
      await loadImages();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        message:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
        isError: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.add("bg-blue-50", "border-blue-300");
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current) {
      dragRef.current.classList.remove("bg-blue-50", "border-blue-300");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragRef.current) {
        dragRef.current.classList.remove("bg-blue-50", "border-blue-300");
      }
      handleFileChange(e);
    },
    [handleFileChange],
  );

  const handleDeleteImage = async (id: string, filename: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      // Delete from storage first
      const { data: imageData } = await supabase
        .from("gallery_images")
        .select("filename")
        .eq("id", id)
        .single();

      if (imageData?.filename) {
        const { error: deleteStorageError } = await supabase.storage
          .from("gallery")
          .remove([imageData.filename]);

        if (deleteStorageError) throw deleteStorageError;
      }

      // Delete from DB
      const { error: deleteDbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      if (deleteDbError) throw deleteDbError;

      setUploadStatus({ message: `"${filename}" deleted successfully.` });
      await loadImages();
    } catch (error) {
      console.error("Delete error:", error);
      setUploadStatus({
        message:
          error instanceof Error
            ? error.message
            : "Delete failed. Please try again.",
        isError: true,
      });
    }
  };

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-lg">Loading gallery...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gallery Management
          </h1>
          <p className="text-gray-600">Upload and manage your gallery images</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Images
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {images.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Storage Used
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {(images.length * 0.5).toFixed(1)} MB
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Last Upload
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {images.length > 0
                ? new Date(images[0].created_at).toLocaleDateString()
                : "N/A"}
            </dd>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {uploadStatus && (
        <div
          className={`mb-6 p-4 rounded-md ${uploadStatus.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
        >
          <div className="flex items-center">
            {uploadStatus.isError ? (
              <svg
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className="text-sm font-medium">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">All Images</h2>
          <div className="relative">
            <select className="block appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
              <option>Sort by Newest</option>
              <option>Sort by Oldest</option>
              <option>Sort by Name (A-Z)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-3 text-gray-600">Loading your images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No images yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first image.
            </p>
            <div className="mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Upload Image
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.original_name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.original_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(image.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-500 p-1"
                        title="View full size"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={() =>
                          handleDeleteImage(image.id, image.original_name)
                        }
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete image"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
