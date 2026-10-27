import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Register from '../pages/Register.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { AuthProvider } from './testUtils.jsx';

vi.mock('../context/AuthContext.jsx', async () => {
  const actual = await vi.importActual('./testUtils.jsx');
  return { useAuth: actual.useAuth, AuthProvider: actual.AuthProvider };
});

test('validates registration fields', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider value={{ register: vi.fn(), user: null }}>
          <Register />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: /register/i }));
  expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
  expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
});
