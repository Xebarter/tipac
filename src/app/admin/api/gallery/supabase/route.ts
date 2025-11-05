import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  // Check authentication
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("filename")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Extract filenames from the data
    const filenames = data?.map((img) => img.filename) || [];

    return NextResponse.json({ images: filenames });
  } catch (error) {
    console.error("Error fetching gallery images from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery images" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const adminSession = request.cookies.get("admin_session");
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum file size is 5MB." },
        { status: 400 },
      );
    }

    // Upload to Supabase storage
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("gallery").getPublicUrl(filePath);

    // Insert record into gallery_images table
    const { data: imageData, error: insertError } = await supabase
      .from("gallery_images")
      .insert({
        url: publicUrl,
        filename: fileName,
        original_name: file.name,
      })
      .select()
      .single();

    if (insertError) {
      // If database insert fails, clean up the uploaded file
      await supabase.storage.from("gallery").remove([filePath]);
      throw insertError;
    }

    return NextResponse.json(
      {
        message: "Image uploaded successfully",
        image: imageData,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check authentication
  const adminSession = request.cookies.get("admin_session");
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 },
      );
    }

    // First get the image record to get the filename
    const { data: image, error: fetchError } = await supabase
      .from("gallery_images")
      .select("filename")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from("gallery")
      .remove([`gallery/${image.filename}`]);

    if (deleteStorageError) {
      throw deleteStorageError;
    }

    // Delete from gallery_images table
    const { error: deleteRecordError } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", id);

    if (deleteRecordError) {
      throw deleteRecordError;
    }

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting image from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
