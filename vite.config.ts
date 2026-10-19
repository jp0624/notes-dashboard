/** Vite builds the React application; Vitest reuses its JSX transform. */
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// jsdom supplies a DOM; setupFiles installs MSW, cleanup, and custom matchers.
export default defineConfig({
	plugins: [react(), tailwindcss()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test-setup.ts"],
		restoreMocks: true,
	},
});
