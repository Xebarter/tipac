import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Fetch images from Supabase
    const { data, error } = await supabase
      .from('gallery_images')
      .select('filename')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Extract filenames from the data
    const filenames = data?.map(img => img.filename) || [];

    return NextResponse.json({ images: filenames });
  } catch (error) {
    console.error('Error fetching gallery images from Supabase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}