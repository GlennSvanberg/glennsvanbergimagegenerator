// Client-side helper for generating a new Glenn image.
// The server rewrites the prompt + injects a random Glenn reference image.

export async function generateGlennImage(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error('Prompt is required');

  const resp = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: trimmed }),
  });

  if (!resp.ok) {
    let message = `Generation request failed: ${resp.status}`;
    try {
      const data = (await resp.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await resp.json()) as { supabaseUrl?: string; error?: string };
  if (!data?.supabaseUrl) {
    throw new Error(data?.error || 'No supabaseUrl returned from server');
  }
  return data.supabaseUrl;
}

