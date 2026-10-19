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
/** Fetch notes on mount and expose optimistic API mutations to descendants. */
export function NotesProvider({ children }: { children: ReactNode }) {
	// React state drives rendering; loading covers reads and busy covers writes.
	const [notes, setNotes] = useState<Note[]>([]);
	// Mirror the latest collection synchronously so snapshots do not depend on render timing.
	const notesRef = useRef<Note[]>([]);
	const updateNotes = useCallback(
		(next: Note[] | ((current: Note[]) => Note[])) => {
			const result = typeof next === "function" ? next(notesRef.current) : next;
			notesRef.current = result;
			setNotes(result);
		},
		[],
	);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// A ref changes synchronously, closing the gap before disabled buttons re-render.
	const locked = useRef(false);
	// Only the most recent load may commit data or change loading/error state.
	const loadSequence = useRef(0);
	/** Fetch a fresh list; ignore responses invalidated by cleanup or a newer read. */
	const reload = useCallback(async () => {
		if (locked.current) return;
		const sequence = ++loadSequence.current;
		setLoading(true);
		setError(null);
		try {
			const result = await notesApi.list();
			if (sequence === loadSequence.current) updateNotes(result);
		} catch (e) {
			if (sequence === loadSequence.current)
				setError(e instanceof Error ? e.message : "Could not load notes.");
		} finally {
			if (sequence === loadSequence.current) setLoading(false);
		}
	}, [updateNotes]);
	// Load on mount. Cleanup invalidates the request, including Strict Mode replays.
	useEffect(() => {
		void reload();
		return () => {
			loadSequence.current++;
		};
	}, [reload]);
	/** Serialize optimistic writes; a failed mutation restores its complete pre-write snapshot. */
	async function mutate(action: () => Promise<void>) {
		if (locked.current) return false;
		locked.current = true;
		const snapshot = notesRef.current;
		// Invalidate any older reads before applying a provisional write.
		loadSequence.current++;
		setLoading(false);
		setBusy(true);
		setError(null);
		// Returning false leaves the editor draft or deletion confirmation available.
		try {
			await action();
			return true;
		} catch (e) {
			updateNotes(snapshot);
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
	/** Apply a provisional create/edit immediately, then reconcile the authoritative API record. */
	const save = (input: NoteInput, id?: string) =>
		mutate(async () => {
			const optimisticId = id ?? `pending-${crypto.randomUUID()}`;
			const provisional: Note = { ...input, id: optimisticId };
			updateNotes((current) =>
				id
					? current.map((note) => (note.id === id ? provisional : note))
					: [provisional, ...current],
			);
			const result = id
				? await notesApi.update(id, input)
				: await notesApi.create(input);
			// Replace the temporary ID and normalized fields instead of appending a duplicate.
			updateNotes((current) =>
				current.map((note) => (note.id === optimisticId ? result : note)),
			);
		});
	/** Hide a deleted card immediately; mutate restores the snapshot if DELETE rejects. */
	const remove = (id: string) =>
		mutate(async () => {
			updateNotes((current) => current.filter((note) => note.id !== id));
			await notesApi.remove(id);
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
