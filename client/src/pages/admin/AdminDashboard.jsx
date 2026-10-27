import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminApi } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <Spinner />;
  if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;
  const d = data.data;

  return (
    <div className="page">
      <div className="container">
        <h1>Administration overview</h1>
        <div className="grid grid-4" style={{ margin: '1rem 0' }}>
          <div className="card stat"><strong>{d.totals.activeResources}</strong>Active resources</div>
          <div className="card stat"><strong>{d.totals.totalUsers}</strong>Students</div>
          <div className="card stat"><strong>{d.totals.totalReservations}</strong>Reservations</div>
          <div className="card stat"><strong>{d.totals.pendingApprovals}</strong>Pending approvals</div>
        </div>
        <p className="muted">{d.totals.maintenance} resource(s) currently under maintenance.</p>
        <div className="grid grid-2">
          <div className="card">
            <h3>Bookings created (14 days)</h3>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.trend}>
                  <XAxis dataKey="date" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1d6aa5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3>Most booked resources</h3>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.utilization}>
                  <XAxis dataKey="resourceCode" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#2f8f6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Recent reservations</h3>
          {d.recent.map((b) => (
            <p key={b.id}>
              <StatusBadge status={b.status} /> {b.bookingReference} · {b.resource?.name} · {b.user?.name} · {formatDateTime(b.startTime)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
