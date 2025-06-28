import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to generate a filename for the new image
function generateImageFilename(prompt: string): string {
  // Clean up the prompt to make a safe filename
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `glenn_${cleanPrompt}_${timestamp}.jpg`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt are required' },
        { status: 400 }
      );
    }

    console.log('⬇️ Server: Downloading image from Flux...');
    console.log('🔗 Image URL:', imageUrl);

    // Step 1: Download the image from Flux
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'GlennSvanberg-App/1.0',
      },
    });

    if (!imageResponse.ok) {
      console.error('❌ Failed to download image:', imageResponse.status);
      return NextResponse.json(
        { error: `Failed to download image: ${imageResponse.status}` },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    
    console.log('📦 Downloaded image, size:', imageBlob.size, 'bytes');

    // Step 2: Generate filename
    const filename = generateImageFilename(prompt);
    console.log('📝 Generated filename:', filename);

    // Step 3: Upload to Supabase storage
    console.log('📤 Uploading to Supabase storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('glennsvanberg')
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload to Supabase: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Upload successful:', uploadData);

    // Step 4: Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('glennsvanberg')
      .getPublicUrl(filename);

    console.log('🔗 Supabase public URL:', publicUrlData.publicUrl);

    return NextResponse.json({
      success: true,
      filename,
      supabaseUrl: publicUrlData.publicUrl,
      originalUrl: imageUrl
    });

  } catch (error) {
    console.error('💥 Server download/store error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
} 