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
				<div className="editor-heading">
					<h2 id="editor-title">{note ? "Edit your note" : "A new thought"}</h2>
					<button
						type="button"
						className="icon"
						aria-label="Close editor"
						onClick={onClose}
						disabled={busy || processing}
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
					disabled={busy || processing}
					placeholder="Give it a name"
				/>
				{/* New notes start with a random category; users can select a better fit. */}
				<label htmlFor="category">Category</label>
				<select
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
				<label htmlFor="content">Content</label>
				<textarea
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
				<p className="counter">
					{content.length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()}
				</p>
				{/* File selection changes only the draft; the API persists it when Save is pressed. */}
				<label htmlFor="note-image">Image (optional)</label>
				<input
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
				<p id="image-help" className="muted">
					JPEG, PNG, or WebP, up to 10 MB. Images are resized for browser
					storage.
				</p>
				{processing && <p role="status">Preparing image…</p>}
				{imageError && <p role="alert">{imageError}</p>}
				{image && (
					<div className="image-preview">
						<img src={image} alt="Selected note image preview" />
						<button
							type="button"
							className="secondary"
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
						disabled={busy || processing}
					>
						Cancel
					</button>
					<button disabled={busy || processing}>
						{busy ? "Saving…" : "Save note"}
					</button>
				</div>
			</form>
		</dialog>
	);
}
