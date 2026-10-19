import { http, HttpResponse, delay } from 'msw';
import { TITLE_LIMIT, CONTENT_LIMIT, type Note, type NoteInput } from '../types';
const KEY = 'fieldnotes.notes.v1';
const initial: Note[] = [
  { id: 'welcome', title: 'A little room to think', content: 'Capture the idea before it slips away. Add a note, give it a title, and make it yours.' },
  { id: 'next', title: 'Small steps, good work', content: 'Start with the useful thing. Keep it simple. Leave it a little better than you found it.' },
];
function read(): Note[] {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return structuredClone(initial);
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(n => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.content === 'string')) throw new Error('Invalid stored notes');
  return data;
}
function write(notes: Note[]) { localStorage.setItem(KEY, JSON.stringify(notes)); }
function valid(input: unknown): input is NoteInput {
  if (!input || typeof input !== 'object') return false;
  const n = input as NoteInput;
  return typeof n.title === 'string' && typeof n.content === 'string' && n.title.trim().length > 0 && n.title.trim().length <= TITLE_LIMIT && n.content.trim().length > 0 && n.content.trim().length <= CONTENT_LIMIT;
}
function guarded(work: () => Response) {
  try { return work(); } catch { return HttpResponse.json({ message: 'Notes could not be saved or read in this browser. Check browser storage and try again.' }, { status: 500 }); }
}
export const handlers = [
  http.get('/api/notes', async () => { await delay(250); return guarded(() => HttpResponse.json(read())); }),
  http.post('/api/notes', async ({ request }) => {
    await delay(250);
    const input: unknown = await request.json().catch(() => null);
    if (!valid(input)) return HttpResponse.json({ message: 'Enter a title (1-100 characters) and content (1-5000 characters).' }, { status: 400 });
    return guarded(() => {
      const note = { id: crypto.randomUUID(), title: input.title.trim(), content: input.content.trim() };
      write([note, ...read()]); return HttpResponse.json(note, { status: 201 });
    });
  }),
  http.put('/api/notes/:id', async ({ params, request }) => {
    await delay(250);
    const input: unknown = await request.json().catch(() => null);
    if (!valid(input)) return HttpResponse.json({ message: 'A valid title and content are required.' }, { status: 400 });
    return guarded(() => {
      const notes = read(); const index = notes.findIndex(n => n.id === params.id);
      if (index === -1) return HttpResponse.json({ message: 'This note no longer exists. Reload the dashboard.' }, { status: 404 });
      const note = { id: notes[index].id, title: input.title.trim(), content: input.content.trim() };
      notes[index] = note; write(notes); return HttpResponse.json(note);
    });
  }),
  http.delete('/api/notes/:id', async ({ params }) => {
    await delay(250);
    return guarded(() => {
      const notes = read();
      if (!notes.some(n => n.id === params.id)) return HttpResponse.json({ message: 'This note no longer exists. Reload the dashboard.' }, { status: 404 });
      write(notes.filter(n => n.id !== params.id)); return new HttpResponse(null, { status: 204 });
    });
  }),
];
