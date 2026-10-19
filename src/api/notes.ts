/** HTTP boundary: components use these methods rather than accessing persistence. */
import type { Note, NoteInput } from "../types";
/** Send JSON, reject HTTP failures, and always release the timeout timer.
 * T describes the response expected by the caller; it is not runtime validation.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
	// Abort a stalled request so the UI does not stay pending indefinitely.
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);
	try {
		const response = await fetch(`/api/notes${path}`, {
			...options,
			signal: controller.signal,
			headers: { "Content-Type": "application/json" },
		});
		// Fetch resolves even for 4xx/5xx responses; convert them into thrown errors.
		if (!response.ok) {
			const body = await response.json().catch(() => null);
			throw new Error(
				body?.message ||
					`Request failed (${response.status}). Please try again.`,
			);
		}
		// DELETE returns no JSON body, so avoid parsing a 204 response.
		return response.status === 204
			? (undefined as T)
			: ((await response.json()) as T);
	} catch (error) {
		// Translate cancellation into a message the user can act on.
		if (error instanceof DOMException && error.name === "AbortError")
			throw new Error("The request timed out. Please try again.");
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
/** Typed CRUD methods; JSON.stringify serializes only the submitted fields. */
export const notesApi = {
	// Read the full collection.
	list: () => request<Note[]>(""),
	// Ask the API to assign an ID and persist a new note.
	create: (input: NoteInput) =>
		request<Note>("", { method: "POST", body: JSON.stringify(input) }),
	// Encode the ID before inserting it into a URL path.
	update: (id: string, input: NoteInput) =>
		request<Note>(`/${encodeURIComponent(id)}`, {
			method: "PUT",
			body: JSON.stringify(input),
		}),
	// Delete by ID; a successful request resolves without a return value.
	remove: (id: string) =>
		request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
