/** Browser entry point: start the mock network before rendering API consumers. */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NotesProvider } from "./context/NotesContext";
import "./styles.css";
/** Dynamically load MSW, await interception, then mount the React application. */
async function start() {
  // Intentionally enabled in preview builds: this submission uses a mock API.
  const { setupWorker } = await import("msw/browser");
  const { handlers } = await import("./mocks/handlers");
  // Unrelated requests (Vite assets, for example) should reach the normal network.
  await setupWorker(...handlers).start({ onUnhandledRequest: "bypass" });
  // Strict Mode exercises effect cleanup; the provider supplies global notes state.
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <NotesProvider>
        <App />
      </NotesProvider>
    </React.StrictMode>,
  );
}
// If service-worker startup fails, show a readable fallback rather than a blank page.
void start().catch(() => {
  const root = document.getElementById("root")!;
  root.textContent =
    "The mock API could not start. Open this app on localhost or HTTPS, then reload.";
  root.setAttribute("role", "alert");
});
