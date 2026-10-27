import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name';
    if (!form.email.includes('@')) next.email = 'Enter a valid email';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) next.password = 'Include a letter and a number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setFormError('');
    try {
      await register(form);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <h1>Create a student account</h1>
          <p>Registration always creates a student role. Administrators are provisioned separately.</p>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <div className="help">{errors.name}</div>}
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <div className="help">{errors.email}</div>}
            </div>
            <div className="field">
              <label htmlFor="department">Department (optional)</label>
              <input id="department" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {errors.password && <div className="help">{errors.password}</div>}
            </div>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
          </form>
          <p style={{ marginTop: '1rem' }}>Already registered? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
