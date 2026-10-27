import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime } from '../utils/format.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingApi.dashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <Spinner />;

  return (
    <div className="page">
      <div className="container">
        <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
        <p>Your laboratory reservations and recent activity.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {data && (
          <>
            <div className="grid grid-4" style={{ margin: '1rem 0' }}>
              <div className="card stat"><strong>{data.data.stats.total}</strong>Total bookings</div>
              <div className="card stat"><strong>{data.data.stats.confirmed}</strong>Confirmed</div>
              <div className="card stat"><strong>{data.data.stats.completed}</strong>Completed</div>
              <div className="card stat"><strong>{data.data.stats.pending}</strong>Pending</div>
            </div>
            <div className="row" style={{ marginBottom: '1rem' }}>
              <Link className="btn btn-primary" to="/resources">Browse resources</Link>
            </div>
            <section className="card" style={{ marginBottom: '1rem' }}>
              <h2>Upcoming</h2>
              {data.data.upcoming.length === 0 ? (
                <EmptyState title="No upcoming reservations" message="Browse the catalogue to reserve a workstation or instrument." />
              ) : (
                data.data.upcoming.map((b) => (
                  <p key={b.id}><StatusBadge status={b.status} /> {b.resource?.name} · {formatDateTime(b.startTime)}</p>
                ))
              )}
            </section>
            <section className="card" style={{ marginBottom: '1rem' }}>
              <h2>Pending</h2>
              {data.data.pending.length === 0 ? <p className="muted">No pending approvals.</p> : data.data.pending.map((b) => (
                <p key={b.id}>{b.bookingReference} · {b.resource?.name}</p>
              ))}
            </section>
            <section className="card">
              <h2>Recent history</h2>
              {data.data.recent.length === 0 ? <p className="muted">No bookings yet.</p> : data.data.recent.map((b) => (
                <p key={b.id}><StatusBadge status={b.status} /> {b.bookingReference} · {b.resource?.name}</p>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
