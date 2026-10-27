import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Resources from '../pages/Resources.jsx';

vi.mock('../api/client.js', () => ({
  resourceApi: {
    locations: vi.fn().mockResolvedValue({ data: { items: ['Electronics Lab'] } }),
    list: vi.fn().mockResolvedValue({
      data: {
        items: [{
          id: '1',
          name: 'Oscilloscope',
          resourceCode: 'EL-DSO-04',
          description: 'Measurement instrument',
          category: 'ELECTRONIC_EQUIPMENT',
          location: 'Electronics Lab',
          status: 'AVAILABLE',
        }],
        pagination: { page: 1, pages: 1, total: 1, limit: 9 },
      },
    }),
  },
}));

test('renders resource cards after loading', async () => {
  render(
    <MemoryRouter>
      <Resources />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText(/loading resources/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Oscilloscope')).toBeInTheDocument());
  expect(screen.getByText(/view & book/i)).toBeInTheDocument();
});
