import { transferableAbortController } from 'node:util';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
export const server = setupServer(...handlers);
beforeAll(() => {
  vi.stubGlobal('AbortController', class { constructor() { return transferableAbortController(); } });
  server.listen({ onUnhandledRequest: 'error' });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); server.resetHandlers(); vi.restoreAllMocks(); });
afterAll(() => server.close());
