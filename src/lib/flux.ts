// Flux API image generation utilities
// Client-side functions that call our server-side API routes

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

export async function generateFluxImage(
  prompt: string, 
  params: Partial<FluxGenerationParams> = {}
): Promise<string> {
  console.log('🎨 Client: Starting image generation...');
  console.log('📝 Prompt:', prompt);

  // Step 1: Submit generation request to our API
  const generateResponse = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, ...params }),
  });

  if (!generateResponse.ok) {
    const errorData = await generateResponse.json();
    throw new Error(errorData.error || `Generation request failed: ${generateResponse.status}`);
  }

  const { requestId, pollingUrl } = await generateResponse.json();
  console.log('🆔 Client: Request ID:', requestId);

  // Step 2: Poll for result and get the image URL
  const imageUrl = await pollForResult(requestId, pollingUrl);
  console.log('🖼️ Client: Got image URL from Flux:', imageUrl);

  // Step 3: Download and store the image via our API
  console.log('☁️ Client: Sending to download/store API...');
  const storeResponse = await fetch('/api/download-and-store', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl, prompt }),
  });

  if (!storeResponse.ok) {
    const errorData = await storeResponse.json();
    throw new Error(errorData.error || `Failed to store image: ${storeResponse.status}`);
  }

  const { supabaseUrl } = await storeResponse.json();
  console.log('✅ Client: Image stored in Supabase:', supabaseUrl);
  
  return supabaseUrl;
}

async function pollForResult(
  requestId: string, 
  pollingUrl: string,
  maxPollTime: number = 300, // 5 minutes
  pollInterval: number = 500 // 500ms
): Promise<string> {
  console.log('⏳ Client: Polling for result...');
  const startTime = Date.now();

  while (true) {
    // Wait before polling (including first poll)
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    // Check if we've exceeded maximum polling time
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > maxPollTime) {
      throw new Error(`Generation timed out after ${maxPollTime} seconds`);
    }

    // Poll our API endpoint
    const pollParams = new URLSearchParams({
      requestId,
      pollingUrl
    });
    console.log('🔄 Client: Sending poll request:', { requestId, pollingUrl });
    
    const pollResponse = await fetch(`/api/poll-image?${pollParams}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!pollResponse.ok) {
      let errorMessage;
      try {
        const errorData = await pollResponse.json();
        errorMessage = errorData.error || `Polling request failed: ${pollResponse.status}`;
      } catch {
        const errorText = await pollResponse.text();
        errorMessage = `Polling request failed: ${pollResponse.status} - ${errorText}`;
      }
      console.error('❌ Client: Polling error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await pollResponse.json();
    const status = result.status;
    
    console.log('📊 Client: Status:', status);

    if (status === 'Ready') {
      console.log('✅ Client: Image generation completed!');
      const imageUrl = result.imageUrl;
      if (!imageUrl) {
        throw new Error('No image URL in result');
      }
      console.log('🖼️ Client: Image URL:', imageUrl);
      return imageUrl;
    } else if (status === 'Error') {
      throw new Error(`Generation failed: ${result.error}`);
    } else if (status === 'Pending' || status === 'Processing') {
      // Continue polling
      continue;
    } else {
      console.log('❓ Client: Unknown status:', status);
      continue;
    }
  }
}

 