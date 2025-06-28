import { NextRequest, NextResponse } from 'next/server';

interface FluxResultResponse {
  status: string;
  result?: {
    sample?: string;
    error?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BFL_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    // Get parameters from URL query string
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const pollingUrl = searchParams.get('pollingUrl');
    
    console.log('🔄 Server: Received polling request:', { requestId, pollingUrl });

    if (!requestId || !pollingUrl) {
      console.error('❌ Server: Missing required fields:', { requestId, pollingUrl });
      return NextResponse.json(
        { error: 'requestId and pollingUrl are required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      console.error('❌ Server: Invalid UUID format:', requestId);
      return NextResponse.json(
        { error: `Invalid UUID format: ${requestId}` },
        { status: 400 }
      );
    }

    console.log('✅ Server: UUID validation passed:', requestId);

    console.log('🔄 Server: Polling for result, ID:', requestId);
    console.log('🔄 Server: Polling URL:', pollingUrl);

    // Poll for result
    let finalUrl: string;
    
    if (pollingUrl.includes('?id=') || pollingUrl.includes('&id=')) {
      // URL already contains ID parameter (modern API response)
      finalUrl = pollingUrl;
      console.log('🔄 Server: Using complete polling URL:', finalUrl);
    } else if (pollingUrl.includes('get_result')) {
      // Legacy polling - add ID parameter
      finalUrl = `${pollingUrl}?id=${requestId}`;
      console.log('🔄 Server: Using legacy polling URL:', finalUrl);
    } else {
      // Direct polling URL (shouldn't happen)
      finalUrl = pollingUrl;
      console.log('🔄 Server: Using direct polling URL:', finalUrl);
    }
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Polling error:', response.status, errorText);
      console.error('❌ Polling URL used:', pollingUrl);
      console.error('❌ Request ID:', requestId);
      return NextResponse.json(
        { error: `Polling request failed: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result: FluxResultResponse = await response.json();
    const status = result.status;
    
    console.log('📊 Server: Status:', status);

    if (status === 'Ready') {
      const imageUrl = result.result?.sample;
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'No image URL in result' },
          { status: 500 }
        );
      }
      console.log('✅ Server: Image generation completed!');
      return NextResponse.json({
        status: 'Ready',
        imageUrl
      });
    } else if (status === 'Error' || status === 'Failed') {
      const errorMsg = result.result?.error || 'Unknown error';
      console.error('❌ Server: Generation failed:', errorMsg);
      return NextResponse.json(
        { status: 'Error', error: errorMsg },
        { status: 500 }
      );
    } else if (status === 'Pending' || status === 'Processing') {
      return NextResponse.json({
        status: status
      });
    } else {
      console.log('❓ Server: Unknown status:', status);
      return NextResponse.json({
        status: status
      });
    }

  } catch (error) {
    console.error('💥 Server polling error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
} 