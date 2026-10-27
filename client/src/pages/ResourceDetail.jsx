import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingApi, resourceApi } from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { categoryLabel, formatTime, todayInputValue } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ResourceDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [date, setDate] = useState(todayInputValue());
  const [availability, setAvailability] = useState(null);
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState(60);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    resourceApi.get(id).then((res) => setResource(res.data.resource)).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    resourceApi.availability(id, date).then((res) => {
      setAvailability(res.data);
      setStart('');
    }).catch((err) => setError(err.message));
  }, [id, date]);

  const selectedSlot = useMemo(
    () => availability?.slots.find((s) => s.startTime === start),
    [availability, start],
  );

  const endTime = useMemo(() => {
    if (!start) return '';
    const end = new Date(new Date(start).getTime() + duration * 60000);
    return end.toISOString();
  }, [start, duration]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!start) {
      setError('Select a start time');
      return;
    }
    if (purpose.trim().length < 5) {
      setError('Describe the purpose in at least 5 characters');
      return;
    }
    setBusy(true);
    try {
      const res = await bookingApi.create({
        resourceId: id,
        startTime: start,
        endTime,
        purpose,
      });
      toast.success('Reservation created');
      navigate(`/bookings/${res.data.booking.id}`, { state: { created: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!resource && !error) return <Spinner />;
  if (!resource) return <div className="page container"><div className="alert alert-error">{error}</div></div>;

  const max = resource.bookingConfig.maxDurationMinutes;
  const min = resource.bookingConfig.minDurationMinutes;

  return (
    <div className="page">
      <div className="container grid grid-2">
        <section className="card">
          <div className="row space-between">
            <h1>{resource.name}</h1>
            <StatusBadge status={resource.status} />
          </div>
          <p>{resource.resourceCode} · {categoryLabel(resource.category)}</p>
          <p>{resource.description}</p>
          <p><strong>Location:</strong> {resource.location}</p>
          <p><strong>Specifications:</strong> {resource.specifications || '—'}</p>
          <p>
            Operating hours {resource.bookingConfig.operatingStart}–{resource.bookingConfig.operatingEnd}.
            Duration {min}–{max} minutes. Cancel at least {resource.bookingConfig.cancellationCutoffHours} hour(s) before start.
          </p>
          {resource.status === 'MAINTENANCE' && (
            <div className="alert alert-error">This resource is under maintenance and cannot be booked.</div>
          )}
        </section>
        <section className="card">
          <h2>Reserve a slot</h2>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" className="input" type="date" min={todayInputValue()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Available start times</label>
              <div className="slots">
                {(availability?.slots || []).map((slot) => (
                  <button
                    type="button"
                    key={slot.startTime}
                    className={`slot ${slot.available ? 'available' : ''} ${start === slot.startTime ? 'selected' : ''}`}
                    disabled={!slot.available}
                    onClick={() => setStart(slot.startTime)}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="duration">Duration (minutes)</label>
              <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {Array.from({ length: Math.floor(max / min) }, (_, i) => min * (i + 1)).map((mins) => (
                  <option key={mins} value={mins}>{mins}</option>
                ))}
              </select>
            </div>
            {selectedSlot && <p className="muted">Ends at {formatTime(endTime)}</p>}
            <div className="field">
              <label htmlFor="purpose">Purpose</label>
              <textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Course, experiment, or project" />
            </div>
            <button className="btn btn-green" disabled={busy || resource.status !== 'AVAILABLE'}>
              {busy ? 'Submitting…' : 'Confirm reservation'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
