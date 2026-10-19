import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./NoteEditor";
import { prepareImage } from "../utils/images";

vi.mock("../utils/images", () => ({ prepareImage: vi.fn() }));

describe("editor image controls", () => {
	it("previews a selected upload and includes it when creating a note", async () => {
		const image = "data:image/webp;base64,AAAA";
		vi.mocked(prepareImage).mockResolvedValue(image);
		const save = vi.fn().mockResolvedValue(true);
		const close = vi.fn();
		const user = userEvent.setup();
		render(
			<NoteEditor error={null} busy={false} onSave={save} onClose={close} />,
		);
		await user.type(screen.getByLabelText("Title"), "My image note");
		await user.type(screen.getByLabelText("Content"), "A visual thought");
		await user.upload(
			screen.getByLabelText("Image (optional)"),
			new File(["image"], "photo.png", { type: "image/png" }),
		);
		expect(
			await screen.findByAltText("Selected note image preview"),
		).toHaveAttribute("src", image);
		await user.click(screen.getByRole("button", { name: "Save note" }));
		await waitFor(() =>
			expect(save).toHaveBeenCalledWith(
				{ title: "My image note", content: "A visual thought", image },
				undefined,
			),
		);
		expect(close).toHaveBeenCalled();
	});
	it("removes an existing image when editing a note", async () => {
		const save = vi.fn().mockResolvedValue(true);
		const user = userEvent.setup();
		render(
			<NoteEditor
				note={{
					id: "test",
					title: "Existing",
					content: "Thoughts",
					image: "/images/note-workspace.webp",
				}}
				error={null}
				busy={false}
				onSave={save}
				onClose={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Remove image" }));
		expect(
			screen.queryByAltText("Selected note image preview"),
		).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Save note" }));
		await waitFor(() =>
			expect(save).toHaveBeenCalledWith(
				{ title: "Existing", content: "Thoughts", image: null },
				"test",
			),
		);
	});
});
