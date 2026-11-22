export async function safeParseJson<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    return await safeParseJson<T>(res);
  } catch {
    return null;
  }
}
