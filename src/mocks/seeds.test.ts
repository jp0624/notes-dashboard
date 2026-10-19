import { describe, it, expect } from "vitest";
import { notesApi } from "../api/notes";

describe("expanded starter collection", () => {
	it("starts with seven notes with distinct covers", async () => {
		const notes = await notesApi.list();
		expect(notes).toHaveLength(7);
		expect(new Set(notes.map((n) => n.image)).size).toBe(7);
	});
	it("adds new examples once, preserves edits, and respects later deletions", async () => {
		localStorage.setItem(
			"fieldnotes.notes.v1",
			JSON.stringify([
				{
					id: "focus",
					title: "My edited title",
					content: "Keep my work",
					image: null,
				},
			]),
		);
		const notes = await notesApi.list();
		expect(notes).toHaveLength(5);
		expect(notes[0].title).toBe("My edited title");
		expect(notes[0].image).toBeNull();
		await notesApi.remove("learn");
		const reloaded = await notesApi.list();
		expect(reloaded).toHaveLength(4);
		expect(reloaded.some((n) => n.id === "learn")).toBe(false);
	});
});
