/** Integration coverage: interact as a user and let fetch reach the mock HTTP API. */
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./test-setup";
import App from "./App";
import { NotesProvider } from "./context/NotesContext";
/** Mount the dashboard with the same global state boundary used in the app. */
const mount = () =>
	render(
		<NotesProvider>
			<App />
		</NotesProvider>,
	);
// Group related workflows; the shared setup resets storage and handlers per test.
describe("Notes dashboard through the API", () => {
	// Happy path: verify CRUD, content-based case-insensitive search, and stored results.
	it("loads, creates, edits, searches and deletes a persisted note", async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByRole("heading", { name: "A little room to think" });
		await user.click(screen.getByRole("button", { name: "+ Add note" }));
		await user.type(screen.getByLabelText("Title"), "Release checklist");
		await user.type(
			screen.getByLabelText("Content"),
			"Run the regression tests.",
		);
		await user.click(screen.getByRole("button", { name: "Save note" }));
		await screen.findByRole("heading", { name: "Release checklist" });
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(JSON.parse(localStorage.getItem("fieldnotes.notes.v1")!)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ title: "Release checklist" }),
			]),
		);
		await user.click(
			screen.getByRole("button", { name: "Edit Release checklist" }),
		);
		await user.clear(screen.getByLabelText("Title"));
		await user.type(screen.getByLabelText("Title"), "Ready to ship");
		await user.click(screen.getByRole("button", { name: "Save note" }));
		await screen.findByRole("heading", { name: "Ready to ship" });
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await user.type(screen.getByRole("searchbox"), "REGRESSION");
		expect(screen.getAllByRole("article")).toHaveLength(1);
		await user.click(
			screen.getByRole("button", { name: "Delete Ready to ship" }),
		);
		await user.click(screen.getByRole("button", { name: "Confirm delete" }));
		await screen.findByText("No notes match your search.");
		await waitFor(() =>
			expect(screen.queryByText("Saving changes…")).not.toBeInTheDocument(),
		);
		expect(
			JSON.parse(localStorage.getItem("fieldnotes.notes.v1")!),
		).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ title: "Ready to ship" }),
			]),
		);
	});
	// Override POST to fail, prove the draft survives, then restore the API and retry.
	it("retains the draft after a failed create and supports retry", async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByRole("heading", { name: "A little room to think" });
		server.use(
			http.post("/api/notes", () =>
				HttpResponse.json({ message: "Service unavailable" }, { status: 503 }),
			),
		);
		await user.click(screen.getByRole("button", { name: "+ Add note" }));
		await user.type(screen.getByLabelText("Title"), "Keep my draft");
		await user.type(screen.getByLabelText("Content"), "Do not lose this.");
		await user.click(screen.getByRole("button", { name: "Save note" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Service unavailable",
		);
		expect(screen.getByLabelText("Title")).toHaveValue("Keep my draft");
		server.resetHandlers();
		await user.click(screen.getByRole("button", { name: "Save note" }));
		await screen.findByRole("heading", { name: "Keep my draft" });
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
	});
	// Simulate a failed initial GET and verify the visible retry control recovers.
	it("allows retry after a failed initial load", async () => {
		server.use(
			http.get("/api/notes", () =>
				HttpResponse.json({ message: "Offline" }, { status: 503 }),
			),
		);
		const user = userEvent.setup();
		mount();
		expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
		server.resetHandlers();
		await user.click(screen.getByRole("button", { name: "Retry loading" }));
		await screen.findByRole("heading", { name: "A little room to think" });
	});
	// A failed DELETE restores the provisionally removed card from its snapshot.
	it("keeps a note visible when deletion fails", async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByRole("heading", { name: "A little room to think" });
		server.use(
			http.delete("/api/notes/:id", () =>
				HttpResponse.json({ message: "Delete failed" }, { status: 500 }),
			),
		);
		await user.click(
			screen.getByRole("button", { name: "Delete A little room to think" }),
		);
		await user.click(screen.getByRole("button", { name: "Confirm delete" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Delete failed");
		expect(
			screen.getByRole("heading", { name: "A little room to think" }),
		).toBeInTheDocument();
	});
	// Whitespace passes HTML required, so exercise the explicit trimmed-value validation.
	it("rejects whitespace-only drafts", async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByRole("heading", { name: "A little room to think" });
		await user.click(screen.getByRole("button", { name: "+ Add note" }));
		await user.type(screen.getByLabelText("Title"), "   ");
		await user.type(screen.getByLabelText("Content"), "   ");
		await user.click(screen.getByRole("button", { name: "Save note" }));
		expect(
			within(screen.getByRole("dialog")).getByRole("alert"),
		).toHaveTextContent("Please add both");
	});
});

// Exercise the visible control as well as the preference hook's persistence tests.
it("exposes an accessible theme toggle", async () => {
	const user = userEvent.setup();
	mount();
	const toggle = screen.getByRole("button", { name: "Dark theme" });
	expect(toggle).toHaveAttribute("aria-pressed", "true");
	await user.click(toggle);
	expect(toggle).toHaveAttribute("aria-pressed", "false");
	expect(toggle).toHaveTextContent("Dark mode");
	expect(document.documentElement).toHaveAttribute("data-theme", "light");
	await user.click(toggle);
	expect(toggle).toHaveAttribute("aria-pressed", "true");
});
