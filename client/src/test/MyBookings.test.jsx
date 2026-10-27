import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MyBookings from '../pages/MyBookings.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

const cancel = vi.fn().mockResolvedValue({ data: { booking: { status: 'CANCELLED' } } });

vi.mock('../api/client.js', () => ({
  bookingApi: {
    mine: vi.fn().mockResolvedValue({
      data: {
        items: [{
          id: 'b1',
          bookingReference: 'LS-TEST-1',
          resource: { name: 'CAD Workstation 01' },
          startTime: new Date().toISOString(),
          status: 'CONFIRMED',
        }],
      },
    }),
    cancel: (...args) => cancel(...args),
  },
}));

test('cancels a booking after confirmation', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ToastProvider>
        <MyBookings />
      </ToastProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('LS-TEST-1')).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /^cancel$/i }));
  await user.click(screen.getByRole('button', { name: /cancel booking/i }));
  await waitFor(() => expect(cancel).toHaveBeenCalled());
});
