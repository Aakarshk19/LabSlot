import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  function validate() {
    const next = {};
    if (!form.email.includes('@')) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setFormError('');
    try {
      const user = await login(form);
      toast.success('Signed in successfully');
      const dest = location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 460 }}>
        <div className="card">
          <h1>Sign in</h1>
          <p>Use your LabSlot account to manage laboratory reservations.</p>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <div className="help">{errors.email}</div>}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {errors.password && <div className="help">{errors.password}</div>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          {import.meta.env.DEV && <div className="demo-login">
            <p>Quick local demo</p>
            <div className="row">
              <button className="btn btn-ghost" type="button" onClick={() => setForm({ email: 'student@labslot.local', password: 'StudentPass123' })}>Use student demo</button>
              <button className="btn btn-ghost" type="button" onClick={() => setForm({ email: 'admin@labslot.local', password: 'ChangeThisAdminPassword1' })}>Use admin demo</button>
            </div>
            <small className="muted">The admin password follows `ADMIN_PASSWORD` in your local .env file.</small>
          </div>}
          <p style={{ marginTop: '1rem' }}>No account? <Link to="/register">Register as a student</Link></p>
        </div>
      </div>
    </div>
  );
}
