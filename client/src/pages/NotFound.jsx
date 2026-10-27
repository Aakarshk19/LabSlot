import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="container card" style={{ textAlign: 'center' }}>
        <h1>Page not found</h1>
        <p>That route does not exist in LabSlot.</p>
        <Link className="btn btn-primary" to="/">Return home</Link>
      </div>
    </div>
  );
}
