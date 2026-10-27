import { useEffect, useState } from 'react';
import { bookingApi } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDateTime } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';

export default function MyBookings() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    bookingApi.mine({ limit: 50 }).then(setData).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function confirmCancel() {
    setBusy(true);
    try {
      await bookingApi.cancel(target.id, 'Cancelled by student');
      toast.success('Reservation cancelled');
      setTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  const items = data?.data.items || [];

  return (
    <div className="page">
      <div className="container">
        <h1>My bookings</h1>
        {items.length === 0 ? (
          <EmptyState title="No reservations yet" message="When you book a resource, it will appear here." />
        ) : (
          <div className="table-wrap card">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Resource</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>{b.bookingReference}</td>
                    <td>{b.resource?.name}</td>
                    <td>{formatDateTime(b.startTime)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <button className="btn btn-ghost" onClick={() => setTarget(b)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ConfirmDialog
          open={Boolean(target)}
          title="Cancel reservation"
          message="This will free the time slot if the cancellation cutoff has not passed."
          confirmLabel="Cancel booking"
          busy={busy}
          onClose={() => setTarget(null)}
          onConfirm={confirmCancel}
        />
      </div>
    </div>
  );
}
