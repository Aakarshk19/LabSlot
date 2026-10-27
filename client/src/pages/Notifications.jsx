import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { notificationApi } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDateTime } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Notifications() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  async function load() {
    try { setData(await notificationApi.list({ limit: 50 })); } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);
  async function markRead(id) {
    try { await notificationApi.markRead(id); await load(); } catch (err) { toast.error(err.message); }
  }
  async function markAll() {
    try { await notificationApi.markAllRead(); await load(); toast.success('All notifications marked as read'); } catch (err) { toast.error(err.message); }
  }
  if (!data && !error) return <Spinner />;
  if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;
  const items = data.data.items;
  return <div className="page"><div className="container">
    <div className="row space-between"><div><h1>Notifications</h1><p>Booking updates and reservation reminders.</p></div>
      {!!data.data.unread && <button className="btn btn-ghost" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>}
    </div>
    {!items.length ? <EmptyState title="You’re all caught up" message="Booking updates will appear here." /> :
      <div className="grid" style={{ marginTop: '1rem' }}>{items.map((item) => <article className="card row space-between" key={item._id} style={{ borderLeft: item.readAt ? undefined : '4px solid var(--blue)' }}>
        <div><strong>{item.message}</strong><p style={{ margin: '.35rem 0 0' }}>{formatDateTime(item.createdAt)}{item.bookingId?.bookingReference ? ` · ${item.bookingId.bookingReference}` : ''}</p></div>
        <div className="row">{item.bookingId?._id && <Link className="btn btn-ghost" to={`/bookings/${item.bookingId._id}`}>View booking</Link>}{!item.readAt && <button className="btn btn-ghost" onClick={() => markRead(item._id)}>Mark read</button>}</div>
      </article>)}</div>}
  </div></div>;
}
