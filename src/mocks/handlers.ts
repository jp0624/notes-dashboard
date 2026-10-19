/** Mock HTTP API. Only this persistence adapter touches localStorage. */
import { validImage } from "../utils/images";
import { http, HttpResponse, delay } from "msw";
import {
	TITLE_LIMIT,
	CONTENT_LIMIT,
	type Note,
	type NoteInput,
} from "../types";
// Version the storage key so a future schema can migrate independently.
const KEY = "fieldnotes.notes.v1";
// Seed examples are returned only when no persisted collection exists.
const initial: Note[] = [
	{
		id: "welcome",
		image: "/images/note-workspace.webp",
		title: "A little room to think",
		content:
			"Capture the idea before it slips away. Add a note, give it a title, and make it yours.",
	},
	{
		id: "next",
		image: "/images/note-small-steps.webp",
		title: "Small steps, good work",
		content:
			"Start with the useful thing. Keep it simple. Leave it a little better than you found it.",
	},
];
/** Load stored notes and reject malformed JSON/schema instead of silently erasing it. */
function read(): Note[] {
	const raw = localStorage.getItem(KEY);
	if (raw === null) return structuredClone(initial);
	const data: unknown = JSON.parse(raw);
	if (
		!Array.isArray(data) ||
		!data.every(
			(n) =>
				n &&
				typeof n.id === "string" &&
				typeof n.title === "string" &&
				typeof n.content === "string" &&
				validImage(n.image),
		)
	)
		throw new Error("Invalid stored notes");
	// Older starter notes gain a cover once; explicit null keeps a removed image removed.
	return data.map((n) =>
		// Upgrade only the former bundled cover; preserve uploads and explicit removal.
		(n.id === "next" && n.image === "/images/technical-hero.webp")
			? { ...n, image: "/images/note-small-steps.webp" }
			: n.image === undefined
			? { ...n, image: initial.find((sample) => sample.id === n.id)?.image }
			: n,
	);
}
/** Persist the entire collection; storage quota/security errors reach guarded(). */
function write(notes: Note[]) {
	localStorage.setItem(KEY, JSON.stringify(notes));
}
/** Narrow unknown request JSON after checking types, trimmed values, and limits. */
function valid(input: unknown): input is NoteInput {
	if (!input || typeof input !== "object") return false;
	const n = input as NoteInput;
	return (
		typeof n.title === "string" &&
		typeof n.content === "string" &&
		n.title.trim().length > 0 &&
		n.title.trim().length <= TITLE_LIMIT &&
		n.content.trim().length > 0 &&
		n.content.trim().length <= CONTENT_LIMIT &&
		validImage(n.image)
	);
}
/** Convert synchronous storage failures into an HTTP 500 with a readable message. */
function guarded(work: () => Response) {
	try {
		return work();
	} catch {
		return HttpResponse.json(
			{
				message:
					"Notes could not be saved or read in this browser. Check browser storage and try again.",
			},
			{ status: 500 },
		);
	}
}
// Browser service worker and Node test server share these endpoint implementations.
export const handlers = [
	/** GET: simulate latency and return the saved collection. */
	http.get("/api/notes", async () => {
		await delay(250);
		return guarded(() => HttpResponse.json(read()));
	}),
	/** POST: validate input, create a UUID, and prepend the saved record. */
	http.post("/api/notes", async ({ request }) => {
		await delay(250);
		const input: unknown = await request.json().catch(() => null);
		if (!valid(input))
			return HttpResponse.json(
				{
					message:
						"Enter a title (1-100 characters) and content (1-5000 characters), plus a supported image.",
				},
				{ status: 400 },
			);
		return guarded(() => {
			const note = {
				id: crypto.randomUUID(),
				title: input.title.trim(),
				content: input.content.trim(),
				image: input.image ?? null,
			};
			write([note, ...read()]);
			return HttpResponse.json(note, { status: 201 });
		});
	}),
	/** PUT: replace an existing note while preserving its API-owned ID. */
	http.put("/api/notes/:id", async ({ params, request }) => {
		await delay(250);
		const input: unknown = await request.json().catch(() => null);
		if (!valid(input))
			return HttpResponse.json(
				{
					message: "A valid title, content, and supported image are required.",
				},
				{ status: 400 },
			);
		return guarded(() => {
			const notes = read();
			const index = notes.findIndex((n) => n.id === params.id);
			if (index === -1)
				return HttpResponse.json(
					{ message: "This note no longer exists. Reload the dashboard." },
					{ status: 404 },
				);
			const note = {
				id: notes[index].id,
				title: input.title.trim(),
				content: input.content.trim(),
				image: input.image ?? null,
			};
			notes[index] = note;
			write(notes);
			return HttpResponse.json(note);
		});
	}),
	/** DELETE: report missing IDs and persist removal before returning 204. */
	http.delete("/api/notes/:id", async ({ params }) => {
		await delay(250);
		return guarded(() => {
			const notes = read();
			if (!notes.some((n) => n.id === params.id))
				return HttpResponse.json(
					{ message: "This note no longer exists. Reload the dashboard." },
					{ status: 404 },
				);
			write(notes.filter((n) => n.id !== params.id));
			return new HttpResponse(null, { status: 204 });
		});
	}),
];
