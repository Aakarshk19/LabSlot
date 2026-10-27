import { Link } from 'react-router-dom';
import { CalendarClock, ShieldCheck, FlaskConical } from 'lucide-react';

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container grid grid-2" style={{ alignItems: 'center' }}>
          <div>
            <p className="muted">University laboratory operations</p>
            <h1>Reserve lab workstations and equipment without double booking.</h1>
            <p>
              LabSlot helps students discover available resources, reserve time slots, and keep a clear history of
              laboratory use. Administrators manage inventory, maintenance, and reservations from one place.
            </p>
            <div className="row">
              <Link className="btn btn-primary" to="/register">Create a student account</Link>
              <Link className="btn btn-ghost" to="/login">Sign in</Link>
            </div>
          </div>
          <div className="card">
            <h3>What you can do</h3>
            <p><FlaskConical size={16} /> Browse workstations, computers, and instruments by lab.</p>
            <p><CalendarClock size={16} /> Book a slot and receive a reservation reference.</p>
            <p><ShieldCheck size={16} /> Overlaps are blocked on the server, even if two people book at once.</p>
          </div>
        </div>
      </section>
      <section className="page">
        <div className="container grid grid-3">
          <div className="card stat"><strong>Students</strong><p>Find a resource, pick a time, confirm a purpose.</p></div>
          <div className="card stat"><strong>Admins</strong><p>Maintain inventory, approvals, and usage reports.</p></div>
          <div className="card stat"><strong>Labs</strong><p>One record per bookable unit keeps capacity honest.</p></div>
        </div>
      </section>
    </>
  );
}
