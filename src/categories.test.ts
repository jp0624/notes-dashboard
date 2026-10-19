import { describe, expect, it, vi } from "vitest";
import { categories, chooseCategory, getCategory } from "./categories";
import { notesApi } from "./api/notes";

describe("note categories", () => {
	it("defines ten distinct category IDs and colors", () => {
		expect(categories).toHaveLength(10);
		expect(new Set(categories.map((c) => c.id)).size).toBe(10);
		expect(new Set(categories.map((c) => c.color)).size).toBe(10);
	});
	it("randomizes only among choices relevant to the text", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		expect(chooseCategory("Focus", "Protect attention")).toBe("focus");
		vi.mocked(Math.random).mockReturnValue(0.99);
		expect(chooseCategory("Focus", "Protect attention")).toBe("planning");
	});
	it("persists assigned categories and matching starter copy across loads", async () => {
		const first = await notesApi.list();
		const second = await notesApi.list();
		expect(first.map((n) => n.category)).toEqual(second.map((n) => n.category));
		for (const note of first)
			expect(note.content).toContain(getCategory(note.category).guidance);
	});
	it("preserves custom content while migrating and accepts category changes", async () => {
		localStorage.setItem(
			"fieldnotes.notes.v1",
			JSON.stringify([
				{
					id: "custom",
					title: "My note",
					content: "Keep exactly this.",
					image: null,
				},
			]),
		);
		const note = (await notesApi.list()).find((n) => n.id === "custom")!;
		expect(note.content).toBe("Keep exactly this.");
		await notesApi.update(note.id, { ...note, category: "engineering" });
		expect(
			(await notesApi.list()).find((n) => n.id === note.id)?.category,
		).toBe("engineering");
	});
	it("rejects unknown category IDs", async () => {
		const response = await fetch("/api/notes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Test",
				content: "Test",
				category: "unknown",
			}),
		});
		expect(response.status).toBe(400);
	});
});
