import { NextRequest, NextResponse } from 'next/server';

export interface FluxGenerationParams {
  prompt: string;
  finetune_id?: string;
  finetune_strength?: number;
  aspect_ratio?: string;
  steps?: number;
  guidance?: number;
  safety_tolerance?: string;
  seed?: number;
  endpoint?: string;
  api_base_url?: string;
}

interface FluxGenerationResponse {
  id: string;
  polling_url?: string;
}

// Default configuration
const DEFAULT_FLUX_PARAMS = {
  finetune_id: "93fc5a03-c47f-4ea5-81e8-1470640be965",
  finetune_strength: 1.4,
  aspect_ratio: "1:1",
  steps: 50,
  guidance: 3.5,
  safety_tolerance: "6",
  endpoint: "flux-pro-1.1-ultra-finetuned",
  api_base_url: "https://api.eu1.bfl.ai/v1/"
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BFL_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, ...params } = body as FluxGenerationParams;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const config = { ...DEFAULT_FLUX_PARAMS, ...params, prompt: prompt.trim() };

    // Prepare the request payload
    interface PayloadType {
      prompt: string;
      finetune_id?: string;
      finetune_strength?: number;
      aspect_ratio?: string;
      steps?: number;
      guidance?: number;
      safety_tolerance?: string;
      seed?: number;
    }
    
    const payload: PayloadType = {
      prompt: config.prompt,
      finetune_id: config.finetune_id,
      finetune_strength: config.finetune_strength,
      aspect_ratio: config.aspect_ratio,
      steps: config.steps,
      guidance: config.guidance,
      safety_tolerance: config.safety_tolerance,
    };

    // Add seed if specified
    if (config.seed !== undefined) {
      payload.seed = config.seed;
    }

    console.log('🎨 Server: Generating image with Flux API...');
    console.log('📝 Prompt:', config.prompt);
    console.log('🔧 Finetune ID:', config.finetune_id);
    console.log('💪 Finetune strength:', config.finetune_strength);

    // Submit the generation request
    const url = `${config.api_base_url}${config.endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Flux API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Generation request failed: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const requestData: FluxGenerationResponse = await response.json();
    console.log('✅ Generation request submitted, ID:', requestData.id);
    
    const pollingUrl = requestData.polling_url || `${config.api_base_url}get_result`;
    console.log('🔄 Polling URL to return:', pollingUrl);

    return NextResponse.json({
      success: true,
      requestId: requestData.id,
      pollingUrl: pollingUrl
    });

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
} 