import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const EXTRACTION_PROMPT = `You are extracting structured data from a financial document (an insurance policy, fixed deposit receipt, recurring deposit passbook, or mutual fund statement).

Read the document and return ONLY a JSON object (no markdown, no preamble, no code fences) with this exact shape:

{
  "type": "Policy" | "FD" | "RD" | "Mutual Fund" | null,
  "name": string | null,
  "institution": string | null,
  "principal_amount": number | null,
  "maturity_value": number | null,
  "maturity_date": "YYYY-MM-DD" | null,
  "next_payment_date": "YYYY-MM-DD" | null,
  "payment_amount": number | null,
  "frequency": "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "One-time" | null,
  "notes": string | null
}

Rules:
- Only include values you can actually find in the document. Use null for anything not present or unclear — never guess or invent numbers.
- "notes" can include policy/account numbers or other identifiers found in the document.
- Dates must be in YYYY-MM-DD format.
- Return raw JSON only.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('claude_api_key')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  const apiKey = settings?.claude_api_key;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No Claude API key saved. Add one in Settings to use auto-extraction.' },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = file.type || 'application/octet-stream';

  const isPdf = mediaType === 'application/pdf';
  const isImage = mediaType.startsWith('image/');

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: 'Only PDF or image files (JPG, PNG) can be auto-extracted.' },
      { status: 400 }
    );
  }

  const content = [
    {
      type: isPdf ? 'document' : 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    },
    { type: 'text', text: EXTRACTION_PROMPT },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
    const raw = textBlock?.text ?? '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Could not parse extraction result. Please enter details manually.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 500 });
  }
}
