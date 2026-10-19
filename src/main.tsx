import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotesProvider } from './context/NotesContext';
import './styles.css';
async function start() {
  // Intentionally enabled in preview builds: this submission uses a mock API.
  const { setupWorker } = await import('msw/browser');
  const { handlers } = await import('./mocks/handlers');
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass' });
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><NotesProvider><App/></NotesProvider></React.StrictMode>);
}
void start().catch(() => {
  const root = document.getElementById('root')!;
  root.textContent = 'The mock API could not start. Open this app on localhost or HTTPS, then reload.';
  root.setAttribute('role', 'alert');
});
