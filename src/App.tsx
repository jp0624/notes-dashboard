import { getCategory } from "./categories";
import type { CSSProperties } from "react";
/** Dashboard composition: shared notes plus local search, editor, and delete-confirmation state. */
import { useMemo, useState } from "react";
import { useNotes } from "./context/NotesContext";
import { NoteEditor } from "./components/NoteEditor";
import { useTheme } from "./hooks/useTheme";
import type { Note } from "./types";
/** Render the collection and route user actions to the shared API-backed provider. */
export default function App() {
	// Collection state belongs to the provider; transient UI choices belong here.
	const { notes, loading, busy, error, reload, save, remove } = useNotes();
	const { theme, toggleTheme } = useTheme();
	const [query, setQuery] = useState("");
	// null closes the editor; new opens a blank form; a Note opens an existing record.
	const [editor, setEditor] = useState<Note | "new" | null>(null);
	// Store only the ID of the card awaiting explicit deletion confirmation.
	const [deleting, setDeleting] = useState<string | null>(null);
	// A live region announces successful mutations for screen-reader users.
	const [message, setMessage] = useState("");
	// Recompute search only when the query or collection changes; search both fields.
	const filtered = useMemo(() => {
		// Trimming makes surrounding spaces harmless; locale casing supports mixed-case input.
		const search = query.trim().toLocaleLowerCase();
		// Keep the original collection unchanged; derive only the cards currently in view.
		return notes.filter((n) =>
			`${n.title}\n${n.content}\n${getCategory(n.category).label}`
				.toLocaleLowerCase()
				.includes(search),
		);
	}, [notes, query]);
	return (
		<>
			{/* Brand/navigation and a short description of the workspace. */}
			<header className="flex items-center justify-between border-b border-[var(--border)] px-[6%] py-[26px] max-[540px]:py-5">
				<a
					className="flex items-center gap-2.5 text-[25px] font-bold tracking-[-1px] text-inherit no-underline focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
					href="/"
					aria-label="Fieldnotes home"
				>
					<span className="rounded-[5px] bg-[var(--primary)] px-2 font-[Georgia,serif] text-[color:var(--on-primary)]">
						f.
					</span>
					fieldnotes
					<span className="self-start text-[10px]">®</span>
				</a>
				<div className="flex items-center gap-5">
					<span className="text-xs text-[color:var(--muted)] max-[540px]:hidden">
						A little space for your ideas.
					</span>
					{/* The pressed state announces whether dark mode is active. */}
					<button
						type="button"
						className="cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-[11px] font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4 inline-flex min-h-11 items-center gap-2 whitespace-nowrap max-[540px]:px-3 max-[540px]:py-[9px] max-[540px]:text-xs"
						aria-label="Dark theme"
						aria-pressed={theme === "dark"}
						onClick={toggleTheme}
					>
						<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
						{theme === "dark" ? "Light mode" : "Dark mode"}
					</button>
				</div>
			</header>
			<main className="w-full">
				{/* Full-width decorative background; real text stays selectable and accessible. */}
				<section className="hero-background border-b border-[var(--border)] bg-[#0b0d10] bg-cover bg-center text-[#f7f7fa] max-[540px]:bg-position-[60%_center]">
					<div className="mx-auto flex min-h-[420px] max-w-[1280px] items-center px-[6%] py-[84px] max-[540px]:min-h-[350px] max-[540px]:py-12">
						<div>
							<p className="text-[10px] font-bold tracking-[2px] text-[#14aff1]">
								YOUR EVERYDAY SCRATCHPAD
							</p>
							<h1 className="my-5 font-[Georgia,serif] text-[clamp(38px,5.5vw,65px)] leading-[1.07] font-normal tracking-[-2.5px] [&>span]:text-[#14aff1]">
								Good ideas start
								<br />
								with a little note<span>.</span>
							</h1>
							<p className="max-w-[420px] text-sm text-[#d2dce5]">
								Collect your thoughts. Make room for what comes next.
							</p>
						</div>
					</div>
				</section>
				<div className="mx-auto max-w-[1280px] px-[6%] pt-7">
					<section aria-labelledby="notes-heading">
						{/* Search is local; Add opens a fresh editor and clears the prior success message. */}
						<div className="flex items-center justify-between gap-5 border-t border-[var(--border)] py-[25px] max-[850px]:flex-col max-[850px]:items-start">
							<h2
								className="m-0 text-xl tracking-[-0.5px] font-semibold"
								id="notes-heading"
							>
								Your notes{" "}
								<span className="ml-2 rounded-full bg-[var(--badge)] px-2 py-1 text-xs font-normal tracking-normal">
									{notes.length}
								</span>
							</h2>
							<div className="flex gap-2.5 max-[850px]:w-full [&>button]:max-[540px]:whitespace-nowrap [&>button]:max-[540px]:px-[14px] [&>button]:max-[540px]:py-2.5">
								<label className="sr-only" htmlFor="search">
									Search notes
								</label>
								<input
									className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] placeholder:opacity-100 focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 w-[235px] bg-transparent text-[13px] max-[850px]:flex-1 max-[540px]:w-[100px]"
									id="search"
									type="search"
									placeholder="Search your notes…"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
								<button
									className="cursor-pointer rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-5 py-[11px] font-semibold text-[color:var(--on-primary)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
									onClick={() => {
										setMessage("");
										setEditor("new");
									}}
									disabled={loading || busy}
								>
									+ Add note
								</button>
							</div>
						</div>
						{/* Render load/delete errors here; save errors appear inside the modal instead. */}
						{error && !editor && (
							<div
								className="relative z-2 mb-4 rounded-lg bg-[var(--error-bg)] px-[18px] py-3 text-[color:var(--danger)]"
								role="alert"
							>
								{error}{" "}
								{!editor && (
									<button
										className="cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-[11px] font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
										disabled={busy || loading}
										onClick={() => void reload()}
									>
										Retry loading
									</button>
								)}
							</div>
						)}
						<p className="sr-only" role="status">
							{message}
						</p>
						{busy && (
							<p
								role="status"
								className="mb-4 text-[13px] text-[color:var(--muted)]"
							>
								Saving changes…
							</p>
						)}
						{/* Loading, populated, and empty/search-empty views are mutually exclusive.
            Each keyed card uses its stable API ID. Delete first asks for confirmation;
            Edit passes the complete note into the form. Pending writes disable actions. */}
						{loading ? (
							<p
								className="rounded-[10px] border border-dashed border-[var(--border)] px-5 py-[45px] text-center text-[color:var(--muted)]"
								role="status"
							>
								Gathering your thoughts…
							</p>
						) : filtered.length ? (
							<div className="grid grid-cols-1 gap-[18px] min-[541px]:grid-cols-2 min-[851px]:grid-cols-3">
								{filtered.map((note) => (
									<article
										className="flex min-h-[270px] flex-col rounded-[10px] border border-[var(--card-border)] border-t-[3px] border-t-[color:var(--card-accent)] bg-[var(--surface)] p-[25px] shadow-[var(--card-shadow)] focus-within:outline-2 focus-within:outline-[var(--focus)] focus-within:outline-offset-3 max-[540px]:min-h-[245px]"
										key={note.id}
										style={
											{
												"--card-accent": getCategory(note.category).color,
											} as CSSProperties
										}
									>
										{/* Cover is decorative; the adjacent heading names the note. */}
										{note.image && (
											<img
												className="-mx-[25px] -mt-[25px] mb-[22px] h-[180px] w-[calc(100%+50px)] max-w-none rounded-t-[7px] object-cover"
												src={note.image}
												alt=""
												loading="lazy"
												width="600"
												height="360"
											/>
										)}
										<span className="inline-flex items-center text-[9px] tracking-[2px] text-[color:var(--muted)] uppercase before:mr-2 before:inline-block before:size-1.5 before:rounded-full before:bg-[var(--card-accent)] before:content-['']">
											{getCategory(note.category).label}
										</span>
										<h3 className="mt-6 mb-3 font-[Georgia,serif] text-2xl leading-[1.25] font-normal [overflow-wrap:anywhere]">
											{note.title}
										</h3>
										<p className="mb-7 text-sm whitespace-pre-wrap text-[color:var(--muted)] [overflow-wrap:anywhere]">
											{note.content}
										</p>
										<div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--card-border)] pt-[13px] text-xs">
											{deleting === note.id ? (
												<>
													<span>Delete this note?</span>
													<button
														className="cursor-pointer border-0 bg-transparent px-0 py-1 text-xs font-semibold text-[color:var(--danger)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
														disabled={busy}
														onClick={async () => {
															if (await remove(note.id)) {
																setDeleting(null);
																setMessage("Note deleted.");
															}
														}}
													>
														{busy ? "Deleting…" : "Confirm delete"}
													</button>
													<button
														className="cursor-pointer border-0 bg-transparent px-0 py-1 text-xs font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
														disabled={busy}
														onClick={() => setDeleting(null)}
													>
														Keep
													</button>
												</>
											) : (
												<>
													<button
														className="cursor-pointer border-0 bg-transparent px-0 py-1 text-xs font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
														disabled={busy}
														aria-label={`Edit ${note.title}`}
														onClick={() => {
															setMessage("");
															setEditor(note);
														}}
													>
														Edit ↗
													</button>
													<button
														className="cursor-pointer border-0 bg-transparent px-0 py-1 text-xs font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
														disabled={busy}
														aria-label={`Delete ${note.title}`}
														onClick={() => setDeleting(note.id)}
													>
														Delete
													</button>
												</>
											)}
										</div>
									</article>
								))}
							</div>
						) : (
							<div className="rounded-[10px] border border-dashed border-[var(--border)] px-5 py-[45px] text-center text-[color:var(--muted)]">
								<h3 className="mt-6 mb-3 font-[Georgia,serif] text-2xl leading-[1.25] font-normal [overflow-wrap:anywhere]">
									{query.trim()
										? "No notes match your search."
										: "A fresh page, just for you."}
								</h3>
								<p>
									{query.trim()
										? "Try a different word or clear your search."
										: "Add your first note to get started."}
								</p>
								{query && (
									<button
										className="cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-[11px] font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
										onClick={() => setQuery("")}
									>
										Clear search
									</button>
								)}
							</div>
						)}
					</section>
					{/* Show the filtered count independently of the total in the toolbar. */}
					<footer className="mt-[35px] flex justify-between border-t border-[var(--border)] py-7 text-[11px] text-[color:var(--muted)] max-[540px]:gap-[25px]">
						<span>A place for the things worth remembering.</span>
						<span>
							{filtered.length} {filtered.length === 1 ? "note" : "notes"} in
							view
						</span>
					</footer>
				</div>
			</main>
			{/* Mount only during editing. Close after a confirmed save and announce its result. */}
			{editor && (
				<NoteEditor
					error={error}
					note={editor === "new" ? undefined : editor}
					busy={busy}
					onClose={() => setEditor(null)}
					onSave={async (input, id) => {
						const ok = await save(input, id);
						if (ok) setMessage(id ? "Note updated." : "Note added.");
						return ok;
					}}
				/>
			)}
		</>
	);
}
