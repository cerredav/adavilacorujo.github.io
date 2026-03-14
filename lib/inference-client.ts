export type InferenceResult = {
  filename: string;
  content_type: string;
  text: string;
  confidence: number;
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
