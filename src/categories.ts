/** Semantic categories own their colors, so search/reordering never changes a card's identity. */
export const categories = [
	{
		id: "ideas",
		label: "Ideas",
		color: "#14aff1",
		guidance: "Keep the promising ideas together so they are easy to revisit.",
	},
	{
		id: "focus",
		label: "Focus",
		color: "#26c6da",
		guidance: "Protect a little uninterrupted time for the work that matters.",
	},
	{
		id: "learning",
		label: "Learning",
		color: "#60a5fa",
		guidance: "Write down one lesson you can use on the next attempt.",
	},
	{
		id: "experiments",
		label: "Experiments",
		color: "#a78bfa",
		guidance:
			"Test one assumption at a time and record what the result tells you.",
	},
	{
		id: "design",
		label: "Design",
		color: "#c084fc",
		guidance: "Make the next action clear and remove unnecessary friction.",
	},
	{
		id: "engineering",
		label: "Engineering",
		color: "#34d399",
		guidance: "Keep the implementation small, testable, and easy to maintain.",
	},
	{
		id: "delivery",
		label: "Delivery",
		color: "#ffbe11",
		guidance: "Define a useful finish line and ship a small improvement.",
	},
	{
		id: "planning",
		label: "Planning",
		color: "#fb923c",
		guidance: "Choose a realistic next step and decide what can wait.",
	},
	{
		id: "product",
		label: "Product",
		color: "#f472b6",
		guidance: "Connect the work to a real user need and a clear outcome.",
	},
	{
		id: "reflection",
		label: "Reflection",
		color: "#94a3b8",
		guidance:
			"Pause to notice what worked and what you would change next time.",
	},
] as const;
export type CategoryId = (typeof categories)[number]["id"];

/** Validate incoming API payloads against the same IDs shown in the editor. */
export function isCategory(value: unknown): value is CategoryId {
	return categories.some((category) => category.id === value);
}

/** Return display metadata; older notes without a category still have a safe presentation. */
export function getCategory(id: unknown) {
	return categories.find((category) => category.id === id) ?? categories[0];
}

/** Randomize among relevant choices once on creation/migration, then persist the result. */
export function chooseCategory(title: string, content: string): CategoryId {
	const text = `${title} ${content}`.toLowerCase();
	const rules: [RegExp, CategoryId[]][] = [
		[/focus|attention|uninterrupted/, ["focus", "planning"]],
		[
			/learn|iteration|surpris|assumption|measure/,
			["learning", "experiments", "product"],
		],
		[/design|interface|labels|friction/, ["design", "product"]],
		[
			/ship|finish|delivery|working software/,
			["delivery", "engineering", "product"],
		],
		[/idea|thought|question|connection/, ["ideas", "reflection"]],
		[/step|improvement|simple/, ["planning", "engineering", "delivery"]],
	];
	const choices =
		rules.find(([pattern]) => pattern.test(text))?.[1] ??
		categories.map((category) => category.id);
	return choices[Math.floor(Math.random() * choices.length)];
}
