import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const COLORS = ['#1d6aa5', '#2f8f6b', '#e9a23b', '#b54708', '#8b5cf6'];
export default function AdminAnalytics() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { adminApi.reports().then((r) => setResult(r.data)).catch((e) => setError(e.message)); }, []);
  if (!result && !error) return <Spinner />;
  if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;
  const status = result.byStatus.map((s) => ({ name: s._id, value: s.count }));
  return <div className="page"><div className="container"><h1>Analytics</h1><p>Reservation activity across your lab resources.</p>
    {!result.byDay.length && !result.byResource.length ? <EmptyState title="No booking data yet" message="Charts will populate as students make reservations." /> : <div className="grid grid-2" style={{ marginTop: '1rem' }}>
      <section className="card"><h2>Booking trends</h2><p>Reservations by creation date.</p><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={result.byDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Bookings" fill="#1d6aa5" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="card"><h2>Popular resources</h2><p>Most requested equipment and workstations.</p><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={result.byResource} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={130} /><Tooltip /><Bar dataKey="count" name="Bookings" fill="#2f8f6b" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="card"><h2>Booking status</h2><div style={{ width: '100%', height: 280 }}><ResponsiveContainer><PieChart><Pie data={status} dataKey="value" nameKey="name" outerRadius={100} label>{status.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></section>
    </div>}
  </div></div>;
}
