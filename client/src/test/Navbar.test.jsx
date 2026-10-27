import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from '../components/Navbar.jsx';
import { AuthProvider } from './testUtils.jsx';

vi.mock('../context/AuthContext.jsx', async () => {
  const actual = await vi.importActual('./testUtils.jsx');
  return { useAuth: actual.useAuth, AuthProvider: actual.AuthProvider };
});

vi.mock('../api/client.js', () => ({
  notificationApi: { list: vi.fn().mockResolvedValue({ data: { unread: 0 } }) },
}));

test('students see student navigation', () => {
  render(
    <MemoryRouter>
      <AuthProvider value={{ user: { name: 'Asha', role: 'STUDENT' }, logout: vi.fn() }}>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText('My bookings')).toBeInTheDocument();
  expect(screen.queryByText('Reservations')).not.toBeInTheDocument();
});

test('admins see administration navigation', () => {
  render(
    <MemoryRouter>
      <AuthProvider value={{ user: { name: 'Admin', role: 'ADMIN' }, logout: vi.fn() }}>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText('Reservations')).toBeInTheDocument();
  expect(screen.queryByText('My bookings')).not.toBeInTheDocument();
});
