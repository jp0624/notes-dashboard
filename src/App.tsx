import { useMemo, useState } from 'react';
import { useNotes } from './context/NotesContext';
import { NoteEditor } from './components/NoteEditor';
import type { Note } from './types';
export default function App() {
  const { notes, loading, busy, error, reload, save, remove } = useNotes();
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Note | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return notes.filter(n => `${n.title}\n${n.content}`.toLocaleLowerCase().includes(search));
  }, [notes, query]);
  return <>
    <header><a className="brand" href="/" aria-label="Fieldnotes home"><span className="brand-icon">f.</span>fieldnotes<span className="brand-dot">®</span></a><span className="header-caption">A little space for your ideas.</span></header>
    <main>
      <section className="intro"><div><p className="eyebrow">YOUR EVERYDAY SCRATCHPAD</p><h1>Good ideas start<br/>with a little note<span>.</span></h1><p className="subtitle">Collect your thoughts. Make room for what comes next.</p></div><div className="stamp" aria-hidden="true">✳<span>THINK. WRITE. REPEAT.</span></div></section>
      <section aria-labelledby="notes-heading">
        <div className="toolbar"><h2 id="notes-heading">Your notes <span className="count">{notes.length}</span></h2><div className="tools"><label className="sr-only" htmlFor="search">Search notes</label><input id="search" type="search" placeholder="Search your notes…" value={query} onChange={e => setQuery(e.target.value)}/><button onClick={() => { setMessage(''); setEditor('new'); }} disabled={loading || busy}>+ Add note</button></div></div>
        {error && !editor && <div className="error" role="alert">{error} {!editor && <button className="secondary" disabled={busy || loading} onClick={() => void reload()}>Retry loading</button>}</div>}
        <p className="sr-only" role="status">{message}</p>
        {loading ? <p className="empty" role="status">Gathering your thoughts…</p> : filtered.length ? <div className="grid">{filtered.map((note, i) => <article className={`note color-${i % 4}`} key={note.id}>
          <span className="note-label">FIELDNOTE</span><h3>{note.title}</h3><p className="note-content">{note.content}</p>
          <div className="note-actions">{deleting === note.id ? <><span>Delete this note?</span><button className="text-button danger" disabled={busy} onClick={async () => { if (await remove(note.id)) { setDeleting(null); setMessage('Note deleted.'); } }}>{busy ? 'Deleting…' : 'Confirm delete'}</button><button className="text-button" disabled={busy} onClick={() => setDeleting(null)}>Keep</button></> : <><button className="text-button" disabled={busy} aria-label={`Edit ${note.title}`} onClick={() => { setMessage(''); setEditor(note); }}>Edit ↗</button><button className="text-button" disabled={busy} aria-label={`Delete ${note.title}`} onClick={() => setDeleting(note.id)}>Delete</button></>}</div>
        </article>)}</div> : <div className="empty"><h3>{query.trim() ? 'No notes match your search.' : 'A fresh page, just for you.'}</h3><p>{query.trim() ? 'Try a different word or clear your search.' : 'Add your first note to get started.'}</p>{query && <button className="secondary" onClick={() => setQuery('')}>Clear search</button>}</div>}
      </section>
      <footer><span>A place for the things worth remembering.</span><span>{filtered.length} {filtered.length === 1 ? 'note' : 'notes'} in view</span></footer>
    </main>
    {editor && <NoteEditor error={error} note={editor === 'new' ? undefined : editor} busy={busy} onClose={() => setEditor(null)} onSave={async (input, id) => { const ok = await save(input, id); if (ok) setMessage(id ? 'Note updated.' : 'Note added.'); return ok; }}/ >}
  </>;
}
