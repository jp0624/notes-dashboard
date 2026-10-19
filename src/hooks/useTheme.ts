import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const THEME_KEY = "fieldnotes.theme";

/** Read the explicit preference, defaulting to dark if storage is unavailable or invalid. */
function readTheme(): Theme {
	try {
		return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
	} catch {
		return "dark";
	}
}

/** Keep the document palette and browser controls in sync with a persistent preference. */
export function useTheme() {
	const [theme, setTheme] = useState<Theme>(readTheme);
	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute("content", theme === "dark" ? "#0b0d10" : "#f7f7fa");
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			// Theme switching still works for this session when browser storage is blocked.
		}
	}, [theme]);

	/** Functional updates make repeated clicks alternate from the latest selected theme. */
	function toggleTheme() {
		setTheme((current) => (current === "dark" ? "light" : "dark"));
	}
	return { theme, toggleTheme };
}
