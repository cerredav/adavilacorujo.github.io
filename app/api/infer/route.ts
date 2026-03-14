import { NextRequest, NextResponse } from 'next/server';

const BACKEND_INFER_URL = process.env.INFERENCE_SERVER_URL || 'http://localhost:8000/infer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const upstream = await fetch(BACKEND_INFER_URL, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: error instanceof Error ? error.message : 'Proxy inference request failed',
      },
      { status: 502 },
    );
  }
}
