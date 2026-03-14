export type InferenceResult = {
  filename: string;
  content_type: string;
  text: string;
  confidence: number;
  structured?: {
    vendor_name?: string | null;
    total_amount?: number | null;
    line_items?: Array<{
      description: string;
      qty?: number | null;
      unit_price?: number | null;
      total?: number | null;
    }>;
  };
};

const PROXY_ENDPOINT = '/api/infer';

export async function runInference(file: File): Promise<InferenceResult> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Inference failed (${response.status}): ${body}`);
  }

  return (await response.json()) as InferenceResult;
}
