/** Application-wide notes state, API coordination, and reusable consumer hook. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { notesApi } from "../api/notes";
import type { Note, NoteInput } from "../types";
/** Contract shared by dashboard/editor consumers; mutations report success. */
interface NotesState {
  notes: Note[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (input: NoteInput, id?: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}
// Null distinguishes a missing provider from a legitimately empty notes list.
const Context = createContext<NotesState | null>(null);
/** Fetch notes on mount and expose confirmed API results to descendants. */
export function NotesProvider({ children }: { children: ReactNode }) {
  // React state drives rendering; loading covers reads and busy covers writes.
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref changes synchronously, closing the gap before disabled buttons re-render.
  const locked = useRef(false);
  // Only the most recent load may commit data or change loading/error state.
  const loadSequence = useRef(0);
  /** Fetch a fresh list; ignore responses invalidated by cleanup or a newer read. */
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError(null);
    try {
      const result = await notesApi.list();
      if (sequence === loadSequence.current) setNotes(result);
    } catch (e) {
      if (sequence === loadSequence.current)
        setError(e instanceof Error ? e.message : "Could not load notes.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);
  // Load on mount. Cleanup invalidates the request, including Strict Mode replays.
  useEffect(() => {
    void reload();
    return () => {
      loadSequence.current++;
    };
  }, [reload]);
  /** Serialize writes and centralize pending state, failure messages, and cleanup. */
  async function mutate(action: () => Promise<void>) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    // Returning false leaves the editor draft or deletion confirmation available.
    try {
      await action();
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  /** Choose create/update by ID, then immutably merge the confirmed server result. */
  const save = (input: NoteInput, id?: string) =>
    mutate(async () => {
      const result = id
        ? await notesApi.update(id, input)
        : await notesApi.create(input);
      // Functional state updates use the latest collection rather than a stale closure.
      setNotes((current) =>
        id
          ? current.map((n) => (n.id === id ? result : n))
          : [result, ...current],
      );
    });
  /** Keep the card visible until deletion succeeds on the API. */
  const remove = (id: string) =>
    mutate(async () => {
      await notesApi.remove(id);
      setNotes((current) => current.filter((n) => n.id !== id));
    });
  // Descendants receive the same collection and mutation status.
  return (
    <Context.Provider
      value={{ notes, loading, busy, error, reload, save, remove }}
    >
      {children}
    </Context.Provider>
  );
}
/** Read shared notes; fail clearly if a component was mounted without its provider. */
export function useNotes() {
  const context = useContext(Context);
  if (!context) throw new Error("useNotes must be used inside NotesProvider");
  return context;
}
