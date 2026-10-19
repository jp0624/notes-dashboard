import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTheme } from "./useTheme";

describe("theme preference", () => {
	it("starts dark and persists toggles across remounts", () => {
		const first = renderHook(() => useTheme());
		expect(document.documentElement).toHaveAttribute("data-theme", "dark");
		act(() => first.result.current.toggleTheme());
		expect(document.documentElement).toHaveAttribute("data-theme", "light");
		expect(localStorage.getItem("fieldnotes.theme")).toBe("light");
		first.unmount();
		const second = renderHook(() => useTheme());
		expect(second.result.current.theme).toBe("light");
		act(() => second.result.current.toggleTheme());
		expect(document.documentElement).toHaveAttribute("data-theme", "dark");
	});

	it("defaults dark for invalid preferences", () => {
		localStorage.setItem("fieldnotes.theme", "invalid");
		const { result } = renderHook(() => useTheme());
		expect(result.current.theme).toBe("dark");
	});

	it("keeps switching when storage is blocked", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("Blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Blocked");
		});
		const { result } = renderHook(() => useTheme());
		expect(result.current.theme).toBe("dark");
		act(() => result.current.toggleTheme());
		expect(document.documentElement).toHaveAttribute("data-theme", "light");
	});
});
