import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

interface GenerateRequestBody {
  prompt: string;
}

type GeminiInlineDataPart =
  | { inlineData: { mimeType?: string; data: string } }
  | { inline_data: { mime_type?: string; data: string } };

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<
        | { text?: string }
        | GeminiInlineDataPart
        | Record<string, unknown>
      >;
    };
  }>;
  error?: { message?: string };
}

function getSupabaseServerClient() {
  // Prefer server-only env vars if present, but keep backward compatibility.
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('SUPABASE_URL is required.');
  if (!supabaseKey) throw new Error('SUPABASE_ANON_KEY is required.');

  return createClient(supabaseUrl, supabaseKey);
}

function generateImageFilename(prompt: string): string {
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `glenn_${cleanPrompt}_${timestamp}.png`;
}

async function pickRandomGlennReferenceImage(): Promise<{
  path: string;
  bytes: Uint8Array;
  mimeType: string;
}> {
  const supabase = getSupabaseServerClient();
  const bucket = process.env.GLENN_REFERENCE_BUCKET ?? 'glennsvanberg';
  const folder = (process.env.GLENN_REFERENCE_FOLDER ?? 'glenn-reference').replace(
    /^\/+|\/+$/g,
    ''
  );

  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 200 });

  if (listError) {
    throw new Error(
      `Failed to list Glenn reference images in Supabase: ${listError.message}`
    );
  }

  const imageFiles =
    files?.filter((f) => f.name.match(/\.(jpg|jpeg|png|webp)$/i)) ?? [];

  if (imageFiles.length === 0) {
    throw new Error(
      `No Glenn reference images found. Add images to Supabase bucket "${bucket}" in folder "${folder}/".`
    );
  }

  const chosen = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  const path = `${folder}/${chosen.name}`;

  const { data: blob, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(path);

  if (downloadError || !blob) {
    throw new Error(
      `Failed to download Glenn reference image "${path}": ${
        downloadError?.message ?? 'Unknown error'
      }`
    );
  }

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const lower = chosen.name.toLowerCase();
  const mimeType =
    lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

  return { path, bytes, mimeType };
}

function buildHiddenPrompt(userPrompt: string): string {
  const glennDescription =
    'The subject is Glenn Svanberg (adult Swedish/Scandinavian man). Keep natural skin texture and realistic proportions.';

  // User should never see this rewritten prompt; we only use it server-side.
  // The model receives a real Glenn reference photo + these instructions.
  //
  // Goal: maximize likeness/identity preservation first, then satisfy the user's creative request.
  return [
    'TASK: Photorealistic image edit with strict identity preservation.',
    '',
    'IDENTITY LOCK (highest priority):',
    '- Use the provided reference image as the identity anchor for Glenn Svanberg.',
    '- The output must be clearly the EXACT same person as the reference (high resemblance).',
    '- Preserve Glenn’s facial identity: facial structure/proportions, eye shape/spacing, eyebrows, nose shape, lips/mouth, jawline/chin, cheekbones, ears, hairline, and any distinctive traits visible in the reference.',
    '- Preserve apparent age and ethnicity. Do not “beautify”, stylize, or change face shape.',
    '- Do NOT replace him with a different person, a lookalike, or a generic face. No face swapping.',
    '',
    'ALLOWED CHANGES (only as needed to satisfy the user request):',
    '- Clothing, accessories, hairstyle changes ONLY if requested; otherwise keep hair/facial hair consistent with the reference.',
    '- Pose, camera angle, and situation may change, but the face must still match the reference identity.',
    '',
    'QUALITY REQUIREMENTS:',
    '- Sharp, clear facial details (no blur, smearing, melting, or distortion).',
    '- Keep photorealism, natural lighting, and coherent anatomy.',
    '',
    'BACKGROUND:',
    '- Avoid changing the background unless the user request requires it.',
    '',
    'CONFLICT RULE:',
    '- If any part of the user request conflicts with identity preservation, preserve identity and reinterpret the request in the closest possible way.',
    '',
    glennDescription,
    '',
    `USER REQUEST (apply while following IDENTITY LOCK): ${userPrompt.trim()}`,
  ].join('\n');
}

function extractFirstImageBase64(
  response: GeminiGenerateContentResponse
): { base64: string; mimeType?: string } | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (typeof part !== 'object' || part === null) continue;

    const inlineData =
      'inlineData' in part
        ? (part as { inlineData?: { data?: string; mimeType?: string } })
            .inlineData
        : undefined;
    if (inlineData?.data) return { base64: inlineData.data, mimeType: inlineData.mimeType };

    const inline_data =
      'inline_data' in part
        ? (part as { inline_data?: { data?: string; mime_type?: string } })
            .inline_data
        : undefined;
    if (inline_data?.data)
      return { base64: inline_data.data, mimeType: inline_data.mime_type };
  }
  return null;
}

async function generateWithGemini({
  prompt,
  referenceImageBytes,
  referenceImageMimeType,
}: {
  prompt: string;
  referenceImageBytes: Uint8Array;
  referenceImageMimeType: string;
}): Promise<{ imageBytes: Uint8Array; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  const preferredModel =
    process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3-pro-image-preview';
  const fallbackModels = [
    preferredModel,
    // Practical fallbacks for Gemini image generation/editing APIs.
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const referenceBase64 = Buffer.from(referenceImageBytes).toString('base64');
  const hiddenPrompt = buildHiddenPrompt(prompt);

  let lastError: string | undefined;

  for (const model of fallbackModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: hiddenPrompt },
            {
              inlineData: {
                mimeType: referenceImageMimeType,
                data: referenceBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        // Many Gemini image-capable models accept this; ignored if unsupported.
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.4,
      },
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      lastError = `Gemini request failed for model "${model}": ${resp.status} ${text}`;
      continue;
    }

    let parsed: GeminiGenerateContentResponse;
    try {
      parsed = JSON.parse(text) as GeminiGenerateContentResponse;
    } catch {
      lastError = `Gemini returned non-JSON for model "${model}".`;
      continue;
    }

    const imagePart = extractFirstImageBase64(parsed);
    if (!imagePart) {
      lastError =
        parsed.error?.message ??
        `Gemini response did not include an inline image for model "${model}".`;
      continue;
    }

    const outBytes = Uint8Array.from(Buffer.from(imagePart.base64, 'base64'));
    const outMime = imagePart.mimeType ?? 'image/png';
    return { imageBytes: outBytes, mimeType: outMime };
  }

  throw new Error(lastError ?? 'Gemini image generation failed.');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestBody;
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log('🎨 Server: Generating Glenn image with Gemini...');

    // 1) Pick a random Glenn reference image from Supabase (folder)
    const reference = await pickRandomGlennReferenceImage();
    console.log('🧑‍🦰 Using Glenn reference:', reference.path);

    // 2) Generate edited image with Gemini (prompt rewritten under the hood)
    const generated = await generateWithGemini({
      prompt: prompt.trim(),
      referenceImageBytes: reference.bytes,
      referenceImageMimeType: reference.mimeType,
    });

    // 3) Upload to Supabase
    const supabase = getSupabaseServerClient();
    const outBucket = process.env.GENERATED_IMAGES_BUCKET ?? 'glennsvanberg';
    const filename = generateImageFilename(prompt.trim());
    const imageBlob = new Blob([generated.imageBytes], { type: generated.mimeType });

    const { error: uploadError } = await supabase.storage
      .from(outBucket)
      .upload(filename, imageBlob, {
        contentType: generated.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload generated image to Supabase: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(outBucket)
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      supabaseUrl: publicUrlData.publicUrl,
      filename,
    });

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
} 