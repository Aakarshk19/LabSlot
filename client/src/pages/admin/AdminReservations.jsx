import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatDateTime } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminReservations() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  function load() {
    adminApi.bookings({ status: status || undefined, search: search || undefined, page, limit: 12 }).then(setData);
  }

  useEffect(() => { load(); }, [status, page]);

  async function act(fn, ok) {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!data) return <Spinner />;

  return (
    <div className="page">
      <div className="container">
        <h1>Reservations</h1>
        <div className="card row" style={{ marginBottom: '1rem' }}>
          <input className="input" placeholder="Search reference or purpose" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost" onClick={() => { setPage(1); load(); }}>Search</button>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            {['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Student</th>
                <th>Resource</th>
                <th>When</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.items.map((b) => (
                <tr key={b.id}>
                  <td>{b.bookingReference}</td>
                  <td>{b.user?.name}</td>
                  <td>{b.resource?.name}</td>
                  <td>{formatDateTime(b.startTime)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="row">
                    {b.status === 'PENDING' && (
                      <>
                        <button className="btn btn-green" onClick={() => act(() => adminApi.approve(b.id), 'Approved')}>Approve</button>
                        <button className="btn btn-ghost" onClick={() => act(() => adminApi.reject(b.id, 'Rejected by admin'), 'Rejected')}>Reject</button>
                      </>
                    )}
                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                      <button className="btn btn-danger" onClick={() => act(() => adminApi.cancel(b.id, 'Cancelled by administrator'), 'Cancelled')}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={data.data.pagination} onPage={setPage} />
      </div>
    </div>
  );
}
