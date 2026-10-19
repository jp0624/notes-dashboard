import { describe, it, expect, vi } from "vitest";
import { prepareImage, validImage } from "./images";
import { notesApi } from "../api/notes";

describe("note images", () => {
	it("creates, reloads and removes an image through the API", async () => {
		const image = "data:image/webp;base64,UklGRg==";
		const note = await notesApi.create({
			title: "Visual note",
			content: "Image attached",
			image,
		});
		expect((await notesApi.list()).find((n) => n.id === note.id)?.image).toBe(
			image,
		);
		await notesApi.update(note.id, {
			title: note.title,
			content: note.content,
			image: null,
		});
		expect(
			(await notesApi.list()).find((n) => n.id === note.id)?.image,
		).toBeNull();
	});
	it("rejects unsupported image URLs at the API boundary", async () => {
		await expect(
			notesApi.create({
				title: "Bad image",
				content: "Test",
				image: "https://example.com/image.svg",
			}),
		).rejects.toThrow();
		expect(validImage("data:image/svg+xml;base64,AAAA")).toBe(false);
	});
	it("rejects unsupported and oversized uploads before decoding", async () => {
		await expect(
			prepareImage(new File(["svg"], "test.svg", { type: "image/svg+xml" })),
		).rejects.toThrow("JPEG, PNG, or WebP");
		await expect(
			prepareImage(
				new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
					type: "image/png",
				}),
			),
		).rejects.toThrow("smaller than 10 MB");
	});
	it("resizes, encodes and releases the temporary URL", async () => {
		const originalImage = globalThis.Image;
		vi.stubGlobal(
			"Image",
			class {
				naturalWidth = 2000;
				naturalHeight = 1000;
				onload?: () => void;
				set src(_value: string) {
					queueMicrotask(() => this.onload?.());
				}
			},
		);
		const revoke = vi.fn();
		const oldCreate = URL.createObjectURL;
		const oldRevoke = URL.revokeObjectURL;
		URL.createObjectURL = vi.fn(() => "blob:test");
		URL.revokeObjectURL = revoke;
		const draw = vi.fn();
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
			drawImage: draw,
		} as unknown as CanvasRenderingContext2D);
		vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
			"data:image/webp;base64,AAAA",
		);
		try {
			expect(
				await prepareImage(
					new File(["test"], "test.png", { type: "image/png" }),
				),
			).toBe("data:image/webp;base64,AAAA");
			expect(draw).toHaveBeenCalledWith(expect.anything(), 0, 0, 1000, 500);
			expect(revoke).toHaveBeenCalledWith("blob:test");
		} finally {
			URL.createObjectURL = oldCreate;
			URL.revokeObjectURL = oldRevoke;
			vi.stubGlobal("Image", originalImage);
		}
	});
});

// Existing demo data receives the new bundled cover without losing user choices.
it("upgrades the old small-steps cover and preserves removed or uploaded images", async () => {
	for (const image of ["/images/technical-hero.webp", null, "data:image/webp;base64,AAAA"]) {
		localStorage.setItem("fieldnotes.notes.v1", JSON.stringify([{ id: "next", title: "Small steps, good work", content: "Steady progress", image }]));
		const notes = await notesApi.list();
		expect(notes[0].image).toBe(image === "/images/technical-hero.webp" ? "/images/note-small-steps.webp" : image);
	}
});
