export type InferenceResult = {
  filename: string;
  content_type: string;
  text: string;
  confidence: number;
};

const DEFAULT_URL = 'http://localhost:8000/infer';

export async function runInference(file: File): Promise<InferenceResult> {
  const endpoint = process.env.NEXT_PUBLIC_INFERENCE_URL || DEFAULT_URL;
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Inference failed (${response.status}): ${body}`);
  }

  return (await response.json()) as InferenceResult;
}
