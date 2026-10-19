import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { notesApi } from '../api/notes';
import type { Note, NoteInput } from '../types';
interface NotesState {
  notes: Note[]; loading: boolean; busy: boolean; error: string | null;
  reload: () => Promise<void>;
  save: (input: NoteInput, id?: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}
const Context = createContext<NotesState | null>(null);
export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const loadSequence = useRef(0);
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true); setError(null);
    try { const result = await notesApi.list(); if (sequence === loadSequence.current) setNotes(result); }
    catch (e) { if (sequence === loadSequence.current) setError(e instanceof Error ? e.message : 'Could not load notes.'); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, []);
  useEffect(() => { void reload(); return () => { loadSequence.current++; }; }, [reload]);
  async function mutate(action: () => Promise<void>) {
    if (locked.current) return false;
    locked.current = true; setBusy(true); setError(null);
    try { await action(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); return false; }
    finally { locked.current = false; setBusy(false); }
  }
  const save = (input: NoteInput, id?: string) => mutate(async () => {
    const result = id ? await notesApi.update(id, input) : await notesApi.create(input);
    setNotes(current => id ? current.map(n => n.id === id ? result : n) : [result, ...current]);
  });
  const remove = (id: string) => mutate(async () => {
    await notesApi.remove(id); setNotes(current => current.filter(n => n.id !== id));
  });
  return <Context.Provider value={{ notes, loading, busy, error, reload, save, remove }}>{children}</Context.Provider>;
}
export function useNotes() {
  const context = useContext(Context);
  if (!context) throw new Error('useNotes must be used inside NotesProvider');
  return context;
}
