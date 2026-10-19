import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './test-setup';
import App from './App';
import { NotesProvider } from './context/NotesContext';
const mount = () => render(<NotesProvider><App/></NotesProvider>);
describe('Notes dashboard through the API', () => {
  it('loads, creates, edits, searches and deletes a persisted note', async () => {
    const user = userEvent.setup(); mount();
    await screen.findByRole('heading', { name: 'A little room to think' });
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByLabelText('Title'), 'Release checklist');
    await user.type(screen.getByLabelText('Content'), 'Run the regression tests.');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await screen.findByRole('heading', { name: 'Release checklist' });
    expect(JSON.parse(localStorage.getItem('fieldnotes.notes.v1')!)).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Release checklist' })]));
    await user.click(screen.getByRole('button', { name: 'Edit Release checklist' }));
    await user.clear(screen.getByLabelText('Title')); await user.type(screen.getByLabelText('Title'), 'Ready to ship');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await screen.findByRole('heading', { name: 'Ready to ship' });
    await user.type(screen.getByRole('searchbox'), 'REGRESSION');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Delete Ready to ship' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await screen.findByText('No notes match your search.');
    expect(JSON.parse(localStorage.getItem('fieldnotes.notes.v1')!)).not.toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Ready to ship' })]));
  });
  it('retains the draft after a failed create and supports retry', async () => {
    const user = userEvent.setup(); mount();
    await screen.findByRole('heading', { name: 'A little room to think' });
    server.use(http.post('/api/notes', () => HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })));
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByLabelText('Title'), 'Keep my draft');
    await user.type(screen.getByLabelText('Content'), 'Do not lose this.');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    expect(screen.getByLabelText('Title')).toHaveValue('Keep my draft');
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await screen.findByRole('heading', { name: 'Keep my draft' });
  });
  it('allows retry after a failed initial load', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json({ message: 'Offline' }, { status: 503 })));
    const user = userEvent.setup(); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
    server.resetHandlers(); await user.click(screen.getByRole('button', { name: 'Retry loading' }));
    await screen.findByRole('heading', { name: 'A little room to think' });
  });
  it('keeps a note visible when deletion fails', async () => {
    const user = userEvent.setup(); mount();
    await screen.findByRole('heading', { name: 'A little room to think' });
    server.use(http.delete('/api/notes/:id', () => HttpResponse.json({ message: 'Delete failed' }, { status: 500 })));
    await user.click(screen.getByRole('button', { name: 'Delete A little room to think' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed');
    expect(screen.getByRole('heading', { name: 'A little room to think' })).toBeInTheDocument();
  });
  it('rejects whitespace-only drafts', async () => {
    const user = userEvent.setup(); mount();
    await screen.findByRole('heading', { name: 'A little room to think' });
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByLabelText('Title'), '   '); await user.type(screen.getByLabelText('Content'), '   ');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('Please add both');
  });
});
