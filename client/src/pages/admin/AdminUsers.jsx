import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import Pagination from '../../components/Pagination.jsx';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.users({ search: search || undefined, page, limit: 12 }).then(setData);
  }, [page]);

  if (!data) return <Spinner />;

  return (
    <div className="page">
      <div className="container">
        <h1>Students</h1>
        <div className="card row" style={{ marginBottom: '1rem' }}>
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" />
          <button className="btn btn-ghost" onClick={() => { setPage(1); adminApi.users({ search, page: 1 }).then(setData); }}>Search</button>
        </div>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Bookings</th></tr>
            </thead>
            <tbody>
              {data.data.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.department || '—'}</td>
                  <td>{u.bookingCount}</td>
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
