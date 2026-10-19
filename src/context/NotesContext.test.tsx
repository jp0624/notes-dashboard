/** Deferred API promises prove behavior before a response, not just eventual outcomes. */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { NotesProvider, useNotes } from "./NotesContext";
import { notesApi } from "../api/notes";
import type { Note } from "../types";
const original: Note = {
	id: "original",
	title: "Before",
	content: "Saved",
	category: "ideas",
	image: null,
};
const input = {
	title: "After",
	content: "Draft",
	category: "design" as const,
	image: null,
};
const wrapper = ({ children }: { children: ReactNode }) => (
	<NotesProvider>{children}</NotesProvider>
);
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}
async function mount() {
	vi.spyOn(notesApi, "list").mockResolvedValue([original]);
	const hook = renderHook(() => useNotes(), { wrapper });
	await waitFor(() => expect(hook.result.current.loading).toBe(false));
	return hook;
}
describe("optimistic CRUD", () => {
	for (const operation of ["create", "update", "remove"] as const) {
		for (const succeeds of [true, false]) {
			it(`${operation} updates immediately and ${succeeds ? "reconciles" : "rolls back"}`, async () => {
				const { result } = await mount();
				const pending = deferred<Note>();
				if (operation === "remove")
					vi.spyOn(notesApi, "remove").mockImplementation(async () => {
						await pending.promise;
					});
				else vi.spyOn(notesApi, operation).mockReturnValue(pending.promise);
				let outcome!: Promise<boolean>;
				act(() => {
					outcome =
						operation === "remove"
							? result.current.remove(original.id)
							: result.current.save(
									input,
									operation === "update" ? original.id : undefined,
								);
				});
				expect(result.current.busy).toBe(true);
				if (operation === "remove") expect(result.current.notes).toEqual([]);
				else expect(result.current.notes[0].title).toBe("After");
				if (operation === "create")
					expect(result.current.notes[0].id).toMatch(/^pending-/);
				await act(async () => {
					if (succeeds)
						pending.resolve({
							...input,
							id: operation === "create" ? "server-id" : original.id,
						});
					else pending.reject(new Error("Service unavailable"));
					expect(await outcome).toBe(succeeds);
				});
				expect(result.current.busy).toBe(false);
				if (!succeeds) {
					expect(result.current.notes).toEqual([original]);
					expect(result.current.error).toBe("Service unavailable");
				} else if (operation === "create") {
					expect(result.current.notes).toHaveLength(2);
					expect(result.current.notes[0].id).toBe("server-id");
				}
			});
		}
	}
	it("blocks a second mutation while a snapshot is pending", async () => {
		const { result } = await mount();
		const pending = deferred<Note>();
		const create = vi
			.spyOn(notesApi, "create")
			.mockReturnValue(pending.promise);
		let first!: Promise<boolean>;
		let second!: Promise<boolean>;
		act(() => {
			first = result.current.save(input);
			second = result.current.save(input);
		});
		expect(await second).toBe(false);
		expect(create).toHaveBeenCalledTimes(1);
		await act(async () => {
			pending.resolve({ ...input, id: "server" });
			await first;
		});
	});
	it("ignores an older GET while reconciling a mutation", async () => {
		const { result } = await mount();
		const read = deferred<Note[]>();
		const write = deferred<Note>();
		vi.mocked(notesApi.list).mockReturnValue(read.promise);
		vi.spyOn(notesApi, "update").mockReturnValue(write.promise);
		let reload!: Promise<void>;
		let save!: Promise<boolean>;
		act(() => {
			reload = result.current.reload();
		});
		act(() => {
			save = result.current.save(input, original.id);
		});
		await act(async () => {
			read.resolve([original]);
			await reload;
		});
		expect(result.current.notes[0].title).toBe("After");
		await act(async () => {
			write.resolve({ ...input, id: original.id });
			await save;
		});
		expect(result.current.notes[0].title).toBe("After");
	});
});
