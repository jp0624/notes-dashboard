# Fieldnotes - Notes Dashboard

A small React application for capturing, editing, searching, and deleting notes. I kept the structure deliberately lean: a typed API client, one shared notes provider, and a modal editor. The aim is to make the main flow easy to follow without adding infrastructure the exercise does not need.

## Run it

Install Node.js 22.12 or newer (Node 24 also works), then extract the ZIP and open a terminal in `notes-dashboard`:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. No Python installation, API key, environment file, or separate backend process is required. Use localhost or HTTPS because the mock API uses a service worker. Do not open `index.html` directly from disk.

```sh
npm test          # React Testing Library integration tests
npm run build    # Strict TypeScript check and production bundle
npm run preview  # Serve the production build locally
```

The committed lockfile pins the resolved dependencies. The generated MSW worker is included in `public/`.

## What is included

- Notes have a unique string ID, title, and content.
- Dark theme by default, with an accessible light/dark toggle and a saved browser preference.
- Responsive cards, add/edit dialog, and explicit delete confirmation.
- GET, POST, PUT, and DELETE requests through `fetch` and Mock Service Worker.
- Shared state through React Context and hooks; no class components.
- Initial loading, pending mutation controls, request timeout, errors, and retry.
- Case-insensitive search across titles and content, with a no-results state.
- Browser persistence, so notes survive a refresh.
- Labeled fields, native modal focus containment, Escape support, visible keyboard focus, and status announcements.
- Required fields and length limits checked in both the editor and mock API.

## Main decisions

**React + TypeScript + Vite.** This is a small app, so a straightforward client-side setup fits. TypeScript makes the note and API contracts explicit.

**Context for shared notes.** `NotesProvider` owns loading, errors, mutations, and the canonical list returned by the API. Search and editor drafts stay local to the UI. A mutation lock prevents duplicate submissions, and a request sequence prevents stale reads from replacing newer loads during Strict Mode's effect checks.

**Mock Service Worker for the API.** The assessment allows a mock API. MSW intercepts real HTTP requests, so the components never read or write browser storage directly. The mock handlers use localStorage as their persistence adapter. They simulate latency, validate payloads, generate UUIDs, and return appropriate status codes. The same handlers run in tests through MSW's Node adapter.

**Confirmed writes.** I update the list after the API succeeds. Optimistic updates are optional, and for this exercise predictable failure behavior is more useful than adding rollback logic. Failed saves retain the draft; failed deletes keep the card visible.

**Plain CSS.** The visual design adapts Karbon Digital’s cyan (#14AFF1), yellow (#FFBE11), black, white, and pale gray (#F7F7FA) palette into light and dark themes, with readable tinted cards and layouts that collapse from three columns to one. No UI framework or external fonts are needed.

## Structure

```text
src/
  api/notes.ts                 Fetch client and request timeout
  context/NotesContext.tsx     Shared notes state and mutation coordination
  components/NoteEditor.tsx    Controlled add/edit dialog
  mocks/handlers.ts           Mock HTTP API and storage adapter
  App.tsx                     Dashboard, search, cards, delete confirmation
  App.test.tsx                User-flow and failure-path tests
  test-setup.ts               MSW server and DOM test setup
  types.ts                    Shared contract and validation limits
  styles.css                  Responsive styling
```

## API contract

| Method | Route            | Success             |
| ------ | ---------------- | ------------------- |
| GET    | `/api/notes`     | 200, `Note[]`       |
| POST   | `/api/notes`     | 201, created `Note` |
| PUT    | `/api/notes/:id` | 200, updated `Note` |
| DELETE | `/api/notes/:id` | 204, no body        |

POST/PUT accept `{ "title": "...", "content": "..." }`. The API owns IDs. Titles must contain 1-100 trimmed characters; content must contain 1-5000. Errors return `{ "message": "..." }`: invalid input is 400, missing notes are 404, and storage failures are 500.

## Testing

The original five integration tests exercise the real API client against MSW:

1. Load, create, edit, search, and delete, including persistence assertions.
2. Failed create preserves the draft and succeeds on retry.
3. Initial load failure can be retried.
4. Failed deletion leaves the original note visible.
5. Whitespace-only drafts are rejected.

`npm test` and `npm run build` passed during preparation. The dialog methods are shimmed for jsdom; the browser itself supplies native dialog behavior. A full browser visual/accessibility review remains a manual check. Four additional theme tests cover the visible toggle, persistence across remounts, invalid saved preferences, and unavailable storage.

Quick manual check: create a note, refresh, edit it, search for a word in its content, then delete it. Resize to a phone width and navigate the editor with the keyboard.

## Scope and tradeoffs

This is a single-user assessment app. Data is stored per browser and origin, not in a shared database. Two sample notes appear before the first successful write; deleting everything persists an empty list. Clearing site storage resets the demo. Browser storage must be available. Multi-tab synchronization, authentication, pagination, conflict resolution, and a real backend are outside this submission.

The mock worker intentionally starts in both development and preview builds so a reviewer can run the complete demo. Before connecting a real backend, remove worker startup from `main.tsx` and implement the same HTTP contract on the server. A deployed product should use server-side persistence and authorization.

## Adapting to React Native

I would keep the note types and API client, replace the card grid with a `FlatList`, use `TextInput` for the editor, and present it through a native modal or navigation screen. Context can stay initially. The browser service worker would be replaced with a real API or a native-compatible mock, and AsyncStorage could support an offline cache. I would also account for the keyboard, safe areas, touch targets, screen-reader labels, and offline retry before adding more features.

## Reading the source

The source includes function documentation and inline comments explaining request handling, shared state, mock persistence, form events, rendering branches, responsive styling, and test setup. `package.json` defines the run/build/test commands; `tsconfig.json` enables strict types and the browser/JSX compilation settings. These JSON files remain valid JSON, which does not support comments. `package-lock.json` and `public/mockServiceWorker.js` are generated dependency files and should not be hand-edited.

## Hero background

The full-width intro uses `public/images/technical-hero.webp`, an original image created with the built-in image generation tool and compressed to WebP. It is bundled locally, so the app does not depend on an external image host. A dark gradient keeps the live headline readable in both themes; the background is decorative and contains no text.

Generation prompt: "Use case: stylized-concept. Asset type: full-width website hero background for a polished technical notes dashboard. Create a classy restrained cinematic abstract 3D architectural composition of graphite glass planes and precise microetched circuit traces, subtle fiber-optic cyan light (#14AFF1), a few tiny warm gold highlights (#FFBE11), deep charcoal black. Landscape panoramic 3:1 composition. Keep the LEFT HALF very dark, quiet and nearly empty for overlaid white headline. Concentrate elegant geometric technical detail and depth on the right half. Sophisticated studio lighting, fine material detail, premium enterprise technology aesthetic, minimal tasteful, no text no logos no watermark no characters, avoid busy neon cyberpunk. Save the generated asset locally for inclusion in the website repository."
