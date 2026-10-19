import { useEffect, useRef, useState } from 'react';
import { CONTENT_LIMIT, TITLE_LIMIT, type Note, type NoteInput } from '../types';
interface Props { note?: Note; error: string | null; busy: boolean; onSave: (input: NoteInput, id?: string) => Promise<boolean>; onClose: () => void }
export function NoteEditor({ note, error, busy, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [validation, setValidation] = useState('');
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} aria-labelledby="editor-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={async e => {
      e.preventDefault();
      if (!title.trim() || !content.trim()) { setValidation('Please add both a title and some content.'); return; }
      if (await onSave({ title: title.trim(), content: content.trim() }, note?.id)) onClose();
    }}>
      <div className="editor-heading"><h2 id="editor-title">{note ? 'Edit your note' : 'A new thought'}</h2><button type="button" className="icon" aria-label="Close editor" onClick={onClose} disabled={busy}>×</button></div>
      <p className="muted">A place for whatever is on your mind.</p>
      <label htmlFor="title">Title</label><input id="title" autoFocus required maxLength={TITLE_LIMIT} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} placeholder="Give it a name"/>
      <label htmlFor="content">Content</label><textarea id="content" required maxLength={CONTENT_LIMIT} rows={8} value={content} onChange={e => setContent(e.target.value)} disabled={busy} placeholder="Start writing…"/>
      <p className="counter">{content.length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {validation && <p role="alert">{validation}</p>}
      <div className="editor-actions"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancel</button><button disabled={busy}>{busy ? 'Saving…' : 'Save note'}</button></div>
    </form>
  </dialog>;
}
