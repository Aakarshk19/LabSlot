import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ResourceDetail from '../pages/ResourceDetail.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

const create = vi.fn().mockRejectedValue(Object.assign(new Error('This time slot conflicts with an existing reservation'), { status: 409 }));

vi.mock('../api/client.js', () => ({
  resourceApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        resource: {
          id: 'r1',
          name: 'Workbench A1',
          resourceCode: 'EL-WB-A1',
          description: 'Electronics bench',
          category: 'WORKSTATION',
          location: 'Electronics Lab',
          specifications: 'Scope included',
          status: 'AVAILABLE',
          bookingConfig: {
            minDurationMinutes: 30,
            maxDurationMinutes: 120,
            operatingStart: '08:00',
            operatingEnd: '18:00',
            cancellationCutoffHours: 1,
          },
        },
      },
    }),
    availability: vi.fn().mockResolvedValue({
      data: {
        slots: [{ startTime: '2030-01-10T10:00:00.000Z', endTime: '2030-01-10T10:30:00.000Z', available: true }],
      },
    }),
  },
  bookingApi: {
    create: (...args) => create(...args),
  },
}));

test('shows booking conflict errors from the API', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/resources/r1']}>
      <ToastProvider>
        <Routes>
          <Route path="/resources/:id" element={<ResourceDetail />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('Workbench A1')).toBeInTheDocument());
  const slotButtons = await screen.findAllByRole('button');
  const timeBtn = slotButtons.find((b) => /\d/.test(b.textContent) && b.textContent.includes(':'));
  if (timeBtn) await user.click(timeBtn);
  await user.type(screen.getByLabelText(/purpose/i), 'Project demonstration');
  await user.click(screen.getByRole('button', { name: /confirm reservation/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/conflicts/i));
});
