import type { Note, NoteInput } from '../types';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`/api/notes${path}`, {
      ...options, signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || `Request failed (${response.status}). Please try again.`);
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    throw error;
  } finally { clearTimeout(timeout); }
}
export const notesApi = {
  list: () => request<Note[]>(''),
  create: (input: NoteInput) => request<Note>('', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: NoteInput) => request<Note>(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
