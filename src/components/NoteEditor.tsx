/** Controlled add/edit form; draft values remain local until the API confirms a save. */
import { useEffect, useRef, useState } from "react";
import {
  CONTENT_LIMIT,
  TITLE_LIMIT,
  type Note,
  type NoteInput,
} from "../types";
/** An absent note creates a blank form; onSave reports whether it is safe to close. */
interface Props {
  note?: Note;
  error: string | null;
  busy: boolean;
  onSave: (input: NoteInput, id?: string) => Promise<boolean>;
  onClose: () => void;
}
/** Present a native modal, validate a draft, and delegate persistence to the provider. */
export function NoteEditor({ note, error, busy, onSave, onClose }: Props) {
  // The DOM ref gives the effect access to native showModal()/close() methods.
  const ref = useRef<HTMLDialogElement>(null);
  // This component remounts for each editor session, initializing from the chosen note.
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [validation, setValidation] = useState("");
  // Native modal mode traps focus and makes the background inert. Close during cleanup.
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  // Intercept Escape so an in-flight save cannot be hidden by dismissing the dialog.
  return (
    <dialog
      ref={ref}
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          // Handle submission in React rather than navigating/reloading the page.
          e.preventDefault();
          // HTML required catches empty fields; trim additionally rejects whitespace-only text.
          if (!title.trim() || !content.trim()) {
            setValidation("Please add both a title and some content.");
            return;
          }
          // Preserve the mounted form and its draft when the API reports a failure.
          if (
            await onSave(
              { title: title.trim(), content: content.trim() },
              note?.id,
            )
          )
            onClose();
        }}
      >
        <div className="editor-heading">
          <h2 id="editor-title">{note ? "Edit your note" : "A new thought"}</h2>
          <button
            type="button"
            className="icon"
            aria-label="Close editor"
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
        </div>
        <p className="muted">A place for whatever is on your mind.</p>
        {/* Controlled inputs mirror typed text into state; maxLength enforces shared limits. */}
        <label htmlFor="title">Title</label>
        <input
          id="title"
          autoFocus
          required
          maxLength={TITLE_LIMIT}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          placeholder="Give it a name"
        />
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          required
          maxLength={CONTENT_LIMIT}
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={busy}
          placeholder="Start writing…"
        />
        {/* Character count and separate API/validation errors provide immediate feedback. */}
        <p className="counter">
          {content.length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {validation && <p role="alert">{validation}</p>}
        {/* Cancel never submits; the default submit button triggers the form handler. */}
        <div className="editor-actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button disabled={busy}>{busy ? "Saving…" : "Save note"}</button>
        </div>
      </form>
    </dialog>
  );
}
