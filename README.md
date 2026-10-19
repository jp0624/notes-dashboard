# Fieldnotes Notes Dashboard

A React and TypeScript notes dashboard built for the KD AI Engineering Lead Assessment. It supports API-backed CRUD, optimistic updates with rollback, search, categories, cover images, and light/dark themes.

## Run locally

Use Node.js 22.12 or newer. From the repository root:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. No backend process, API key, or environment file is needed. Use localhost or HTTPS because Mock Service Worker needs a secure context. Do not open index.html directly from disk.

```sh
npm test          # 31 tests across seven suites
npm run build    # Strict TypeScript check and Vite production bundle
npm run preview  # Serve the production build; use the printed URL
```

## Features

- Create, read, edit, and delete notes through fetch and Mock Service Worker (MSW).
- Immediate optimistic changes for create/edit/delete, temporary create IDs, server reconciliation, and rollback if a request fails.
- Loading and saving states, request timeout, retained drafts on save failure, and retry.
- Case-insensitive search across title, content, and category label.
- Seven starter notes with distinct bundled cover images and a full-width technical hero.
- Ten categories with stable accent colors and editable category selection.
- Optional JPEG/PNG/WebP uploads with preview, replacement, removal, and automatic resizing.
- Dark mode by default, a light/dark toggle, and a persistent preference.
- Responsive Tailwind layouts, native dialogs, labeled inputs, focus styles, and live status messages.

## Decisions and structure

**React + TypeScript + Vite** keep the client small and the contracts explicit. Functional components and hooks handle UI state; `NotesProvider` owns the shared collection, requests, and errors. Drafts, search, and editor selection remain local.

**Tailwind CSS** is compiled through `@tailwindcss/vite`. `src/styles.css` imports Tailwind and uses `@apply` to compose component layouts and controls. Custom CSS remains for shared theme variables, the hero gradient, native pseudo-elements, and category accents. `notes-grid` uses Tailwind responsive utilities; keeping its semantic name avoids colliding with Tailwind's `grid` utility.

**MSW** is the assessment's allowed mock API option. Components do not read or write notes directly to storage. The browser worker intercepts fetch; the same handlers run through MSW's Node adapter in tests. The worker intentionally also starts in production preview so the demo remains self-contained.

**Optimistic writes** snapshot the current list, apply a provisional change before awaiting the API, and restore the snapshot on rejection. Creates replace the temporary ID with the returned server ID. A synchronous ref lock serializes writes, and a load sequence invalidates stale GET responses. The form remains open while saving and keeps its draft on failure; confirmation closes it. A visible saving indicator distinguishes provisional state from confirmation. This is a client-side interaction guard, not server idempotency or cross-tab conflict resolution.

| File | Responsibility |
| --- | --- |
| `src/context/NotesContext.tsx` | Shared notes, optimistic mutations, reconciliation and rollback |
| `src/api/notes.ts` | Typed fetch client, HTTP errors and ten-second timeout |
| `src/mocks/handlers.ts` | HTTP handlers, validation, browser persistence and seed migrations |
| `src/App.tsx` | Dashboard, search, card actions and theme toggle |
| `src/components/NoteEditor.tsx` | Controlled draft, category and image controls |
| `src/categories.ts` | Category IDs, colors and relevant random selection |
| `src/hooks/useTheme.ts` | Saved theme and document palette |
| `src/utils/images.ts` | Image resizing and accepted image validation |
| `src/styles.css` | Tailwind compositions and custom design tokens |

## API and persistence

| Method | Route | Success |
| --- | --- | --- |
| GET | `/api/notes` | 200 and Note[] |
| POST | `/api/notes` | 201 and created Note |
| PUT | `/api/notes/:id` | 200 and updated Note |
| DELETE | `/api/notes/:id` | 204 without a body |

POST/PUT accept `{ title, content, category?, image? }`; the API owns IDs. Titles must have 1-100 trimmed characters; content 1-5000. Category IDs are validated. Invalid requests return 400, missing IDs 404, and storage failures 500, with `{ message }` errors. The client types responses but does not validate response schemas at runtime.

Data is saved per browser/origin in localStorage. First reads initialize seven examples; versioned backfills preserve edited notes and later deletions. Categories are selected once from relevant keyword-based choices, then saved. Untouched starter copy gains matching guidance; user copy is not rewritten. Clearing site storage resets the demo. Multiple localStorage writes are not transactional.

Uploads are limited to 10 MB, resized to a maximum 1000-pixel edge, and encoded as WebP. Results over 400000 encoded characters are rejected. Image bytes travel in the note's API payload. This suits a small demo; browser storage is finite. Generated image provenance and prompts are in [ASSETS.md](ASSETS.md).

## Testing and limits

The 31 tests cover dashboard CRUD/search and failures, editor uploads/categories, themes, image processing, seed migration, category rules, and eight deferred-response optimistic tests. Those explicitly check pre-response changes, create-ID reconciliation, rollback for all three writes, the mutation lock, and stale-read invalidation.

Native dialog methods and image processing are partly shimmed/mocked in jsdom. A full browser visual/accessibility review remains a manual check. No full end-to-end suite or CI workflow is included. Optimistic rollback assumes serialized writes; timeouts can leave server outcomes uncertain, so production needs idempotency, refetch/reconciliation, and conflict handling.

This is a single-user mock, without authentication or a shared database. A production version should remove the worker, implement the same API contract with authorization and durable storage, move image bytes to object storage, and add transactional migrations and browser tests.

## React Native adaptation

Reuse the types, API contract, and category metadata. Replace CSS Grid with FlatList, inputs with TextInput, and dialog with a native modal/navigation screen. Replace browser MSW/canvas with a real API or native-compatible mocks and an image picker/resizer. Consider AsyncStorage or a local database for offline data, plus safe areas, keyboard avoidance, touch targets, and screen-reader behavior.
