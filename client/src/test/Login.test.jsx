import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login.jsx';
import { AuthContext } from './testUtils.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

vi.mock('../context/AuthContext.jsx', async () => {
  const actual = await vi.importActual('./testUtils.jsx');
  return { useAuth: actual.useAuth, AuthProvider: actual.AuthProvider };
});

import { AuthProvider } from './testUtils.jsx';

function renderLogin(login = vi.fn()) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider value={{ login, user: null, loading: false }}>
          <Login />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

test('shows validation errors for empty login', async () => {
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});

test('submits credentials to login', async () => {
  const login = vi.fn().mockResolvedValue({ role: 'STUDENT' });
  const user = userEvent.setup();
  renderLogin(login);
  await user.type(screen.getByLabelText(/email/i), 'student@college.edu');
  await user.type(screen.getByLabelText(/password/i), 'StudentPass123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(login).toHaveBeenCalledWith({ email: 'student@college.edu', password: 'StudentPass123' });
});
