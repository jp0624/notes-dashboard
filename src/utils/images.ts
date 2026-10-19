/** Resize an uploaded raster image before it crosses the mock API/storage boundary. */
export async function prepareImage(file: File): Promise<string> {
	if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
		throw new Error("Choose a JPEG, PNG, or WebP image.");
	if (file.size > 10 * 1024 * 1024)
		throw new Error("Choose an image smaller than 10 MB.");
	const url = URL.createObjectURL(file);
	try {
		const image = new Image();
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () =>
				reject(new Error("This image could not be read. Try another file."));
			image.src = url;
		});
		const scale = Math.min(
			1,
			1000 / Math.max(image.naturalWidth, image.naturalHeight),
		);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
		const context = canvas.getContext("2d");
		if (!context)
			throw new Error("Image processing is unavailable in this browser.");
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		const result = canvas.toDataURL("image/webp", 0.78);
		if (result.length > 400000)
			throw new Error(
				"This image is too detailed to store. Try a smaller image.",
			);
		return result;
	} finally {
		// Release the temporary file URL even after a decoding or compression error.
		URL.revokeObjectURL(url);
	}
}

/** Accept only bundled sample assets or bounded raster data URLs, never remote URLs/SVG. */
export function validImage(image: unknown): boolean {
	return (
		image == null ||
		(typeof image === "string" &&
			([
				"/images/note-workspace.webp",
				"/images/technical-hero.webp",
				"/images/note-small-steps.webp",
				"/images/note-focus.webp",
				"/images/note-learn.webp",
				"/images/note-ideas.webp",
				"/images/note-clarity.webp",
				"/images/note-ship.webp",
			].includes(image) ||
				(image.length <= 400000 &&
					/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(
						image,
					))))
	);
}
