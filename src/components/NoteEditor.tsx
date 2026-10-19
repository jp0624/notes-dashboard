import { categories, chooseCategory, type CategoryId } from "../categories";
/** Controlled add/edit form; draft values remain local until the API confirms a save. */
import { prepareImage } from "../utils/images";
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
	const [category, setCategory] = useState<CategoryId>(
		() =>
			note?.category ?? chooseCategory(note?.title ?? "", note?.content ?? ""),
	);
	const [title, setTitle] = useState(note?.title ?? "");
	const [content, setContent] = useState(note?.content ?? "");
	const [image, setImage] = useState<string | null>(note?.image ?? null);
	const [processing, setProcessing] = useState(false);
	const [imageError, setImageError] = useState("");
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
			className="m-auto max-h-[85vh] w-[min(540px,calc(100%-30px))] overflow-y-auto rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-7 text-[color:var(--text)] backdrop:bg-black/60"
			ref={ref}
			aria-labelledby="editor-title"
			onCancel={(e) => {
				e.preventDefault();
				if (!busy && !processing) onClose();
			}}
		>
			<form
				onSubmit={async (e) => {
					// Handle submission in React rather than navigating/reloading the page.
					e.preventDefault();
					if (processing) return;
					// HTML required catches empty fields; trim additionally rejects whitespace-only text.
					if (!title.trim() || !content.trim()) {
						setValidation("Please add both a title and some content.");
						return;
					}
					// Preserve the mounted form and its draft when the API reports a failure.
					if (
						await onSave(
							{ title: title.trim(), content: content.trim(), image, category },
							note?.id,
						)
					)
						onClose();
				}}
			>
				<div className="flex items-center justify-between">
					<h2
						className="m-0 text-xl tracking-[-0.5px] font-semibold"
						id="editor-title"
					>
						{note ? "Edit your note" : "A new thought"}
					</h2>
					<button
						type="button"
						className="cursor-pointer border-0 bg-transparent px-1.5 py-0 text-[25px] text-inherit hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
						aria-label="Close editor"
						onClick={onClose}
						disabled={busy || processing}
					>
						×
					</button>
				</div>
				<p className="text-[13px] text-[color:var(--muted)]">
					A place for whatever is on your mind.
				</p>
				{/* Controlled inputs mirror typed text into state; maxLength enforces shared limits. */}
				<label
					className="mt-[18px] mb-[7px] block text-[13px] font-semibold"
					htmlFor="title"
				>
					Title
				</label>
				<input
					className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] placeholder:opacity-100 focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 w-full"
					id="title"
					autoFocus
					required
					maxLength={TITLE_LIMIT}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					disabled={busy || processing}
					placeholder="Give it a name"
				/>
				{/* New notes start with a random category; users can select a better fit. */}
				<label
					className="mt-[18px] mb-[7px] block text-[13px] font-semibold"
					htmlFor="category"
				>
					Category
				</label>
				<select
					className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] placeholder:opacity-100 focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 w-full"
					id="category"
					value={category}
					disabled={busy || processing}
					onChange={(event) => setCategory(event.target.value as CategoryId)}
				>
					{categories.map((item) => (
						<option key={item.id} value={item.id}>
							{item.label}
						</option>
					))}
				</select>
				<label
					className="mt-[18px] mb-[7px] block text-[13px] font-semibold"
					htmlFor="content"
				>
					Content
				</label>
				<textarea
					className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] placeholder:opacity-100 focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 w-full resize-y"
					id="content"
					required
					maxLength={CONTENT_LIMIT}
					rows={8}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					disabled={busy || processing}
					placeholder="Start writing…"
				/>
				{/* Character count and separate API/validation errors provide immediate feedback. */}
				<p className="text-right text-[11px] text-[color:var(--muted)]">
					{content.length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()}
				</p>
				{/* File selection changes only the draft; the API persists it when Save is pressed. */}
				<label
					className="mt-[18px] mb-[7px] block text-[13px] font-semibold"
					htmlFor="note-image"
				>
					Image (optional)
				</label>
				<input
					className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] placeholder:opacity-100 focus:outline-2 focus:outline-[var(--focus)] focus:outline-offset-2 w-full text-[13px] file:mr-2.5 file:cursor-pointer file:rounded file:border-0 file:bg-[var(--primary)] file:px-2.5 file:py-2 file:text-[color:var(--on-primary)]"
					id="note-image"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					aria-describedby="image-help"
					disabled={busy || processing}
					onChange={async (event) => {
						const file = event.currentTarget.files?.[0];
						event.currentTarget.value = "";
						if (!file) return;
						setProcessing(true);
						setImageError("");
						try {
							setImage(await prepareImage(file));
						} catch (error) {
							setImageError(
								error instanceof Error
									? error.message
									: "Could not load image.",
							);
						} finally {
							setProcessing(false);
						}
					}}
				/>
				<p id="image-help" className="text-[13px] text-[color:var(--muted)]">
					JPEG, PNG, or WebP, up to 10 MB. Images are resized for browser
					storage.
				</p>
				{processing && <p role="status">Preparing image…</p>}
				{imageError && <p role="alert">{imageError}</p>}
				{image && (
					<div className="my-[15px] grid gap-2.5 [&>button]:justify-self-start">
						<img
							className="max-h-[220px] w-full rounded-lg bg-[var(--input)] object-contain"
							src={image}
							alt="Selected note image preview"
						/>
						<button
							type="button"
							className="cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-[11px] font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
							disabled={busy || processing}
							onClick={() => {
								setImage(null);
								setImageError("");
							}}
						>
							Remove image
						</button>
					</div>
				)}
				{error && (
					<p
						role="alert"
						className="relative z-2 mb-4 rounded-lg bg-[var(--error-bg)] px-[18px] py-3 text-[color:var(--danger)]"
					>
						{error}
					</p>
				)}
				{validation && <p role="alert">{validation}</p>}
				{/* Cancel never submits; the default submit button triggers the form handler. */}
				<div className="mt-5 flex justify-end gap-2.5">
					<button
						type="button"
						className="cursor-pointer rounded-lg border border-[var(--border)] bg-transparent px-5 py-[11px] font-semibold text-[color:var(--text)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
						onClick={onClose}
						disabled={busy || processing}
					>
						Cancel
					</button>
					<button
						className="cursor-pointer rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-5 py-[11px] font-semibold text-[color:var(--on-primary)] hover:brightness-90 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-4"
						disabled={busy || processing}
					>
						{busy ? "Saving…" : "Save note"}
					</button>
				</div>
			</form>
		</dialog>
	);
}
