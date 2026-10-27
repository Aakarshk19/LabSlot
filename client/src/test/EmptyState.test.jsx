import { render, screen } from '@testing-library/react';
import EmptyState from '../components/EmptyState.jsx';

test('renders empty state copy', () => {
  render(<EmptyState title="No upcoming reservations" message="Browse the catalogue." />);
  expect(screen.getByText('No upcoming reservations')).toBeInTheDocument();
});
