export interface Note { id: string; title: string; content: string }
export type NoteInput = Omit<Note, 'id'>;
export const TITLE_LIMIT = 100;
export const CONTENT_LIMIT = 5000;
