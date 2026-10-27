import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { bookingApi } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime } from '../utils/format.js';

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingApi.get(id).then((res) => setBooking(res.data.booking)).catch((err) => setError(err.message));
  }, [id]);

  if (!booking && !error) return <Spinner />;
  if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card">
          {location.state?.created && <div className="alert alert-success">Reservation created successfully.</div>}
          <h1>Reservation {booking.bookingReference}</h1>
          <p><StatusBadge status={booking.status} /></p>
          <p><strong>Resource:</strong> {booking.resource?.name}</p>
          <p><strong>When:</strong> {formatDateTime(booking.startTime)} – {formatDateTime(booking.endTime)}</p>
          <p><strong>Purpose:</strong> {booking.purpose}</p>
          <div className="row">
            <Link className="btn btn-primary" to="/bookings">My bookings</Link>
            <Link className="btn btn-ghost" to="/resources">Book another resource</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
