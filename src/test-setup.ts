/** Shared test lifecycle: intercept HTTP, emulate missing DOM APIs, isolate each test. */
import { transferableAbortController } from "node:util";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";
// Node interception runs the same API handlers used by the browser worker.
export const server = setupServer(...handlers);
/** Start interception once and provide jsdom with the browser features used here. */
beforeAll(() => {
	// Node fetch needs a Node-compatible AbortSignal rather than jsdom's separate class.
	vi.stubGlobal(
		"AbortController",
		class {
			constructor() {
				return transferableAbortController();
			}
		},
	);
	// Unexpected requests fail tests rather than accidentally contacting the network.
	server.listen({ onUnhandledRequest: "error" });
	// jsdom does not implement native dialogs. Emulate open state for component tests;
	// native focus trapping still requires a real browser check.
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute("open");
	};
});
// Every case starts with the sample dataset, regardless of previous writes.
beforeEach(() => localStorage.clear());
// Unmount components, remove per-test handler overrides, and restore spies.
afterEach(() => {
	cleanup();
	server.resetHandlers();
	vi.restoreAllMocks();
});
// Release interception after the suite ends.
afterAll(() => server.close());
