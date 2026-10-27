import { useEffect, useState } from 'react';
import { bookingApi } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { formatDateTime } from '../utils/format.js';

export default function History() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    bookingApi.history({ status: status || undefined, from: from || undefined, to: to || undefined, page, limit: 12 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [status, from, to, page]);

  return (
    <div className="page">
      <div className="container">
        <h1>Reservation history</h1>
        <div className="card row" style={{ marginBottom: '1rem' }}>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className="input" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} aria-label="From date" />
          <input className="input" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} aria-label="To date" />
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap card">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Resource</th>
                  <th>When</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data.items || []).map((b) => (
                  <tr key={b.id}>
                    <td>{b.bookingReference}</td>
                    <td>{b.resource?.name}</td>
                    <td>{formatDateTime(b.startTime)}</td>
                    <td>{b.purpose}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{formatDateTime(b.createdAt)}</td>
                    <td>{b.cancellationReason || b.reviewNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={data?.data.pagination} onPage={setPage} />
      </div>
    </div>
  );
}
