/** Shared domain types and input limits used by the UI and mock API. */
/** A saved note: the API generates the unique ID. */
export interface Note {
	id: string;
	title: string;
	content: string;
	/** Optional cover: bundled path or compressed raster data URL; null explicitly removes it. */
	image?: string | null;
}
/** A create/update payload omits the server-owned ID. */
export type NoteInput = Omit<Note, "id">;
// Keep browser validation and API validation consistent.
export const TITLE_LIMIT = 100;
export const CONTENT_LIMIT = 5000;
