import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationApi } from '../api/client.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user) { setUnread(0); return undefined; }
    let active = true;
    const load = () => notificationApi.list({ limit: 1 }).then((r) => { if (active) setUnread(r.data.unread); }).catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user]);

  const studentLinks = [
    ['/dashboard', 'Dashboard'],
    ['/resources', 'Resources'],
    ['/bookings', 'My bookings'],
    ['/history', 'History'],
    ['/profile', 'Profile'],
    ['/notifications', 'Notifications'],
  ];
  const adminLinks = [
    ['/admin', 'Overview'],
    ['/admin/resources', 'Resources'],
    ['/admin/reservations', 'Reservations'],
    ['/admin/users', 'Users'],
    ['/admin/analytics', 'Analytics'],
  ];
  const links = user?.role === 'ADMIN' ? adminLinks : user ? studentLinks : [];

  async function onLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header>
      <nav className="navbar">
        <div className="container row space-between" style={{ width: '100%' }}>
          <Link to={user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/'} className="brand">
            <span className="brand-mark">LS</span>
            LabSlot
          </Link>
          <div className="nav-links">
            {!user && (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register" className="btn btn-primary">Register</NavLink>
              </>
            )}
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}>{label}</NavLink>
            ))}
            {user && <NavLink to="/notifications" aria-label={`Notifications, ${unread} unread`}><Bell size={16} />{unread > 0 && <span className="notification-count">{unread}</span>}</NavLink>}
            {user && <button className="btn btn-ghost" onClick={onLogout}>Log out</button>}
          </div>
          <button className="btn btn-ghost mobile-nav" aria-label="Open menu" onClick={() => setOpen((v) => !v)}>
            <Menu size={18} /> Menu
          </button>
        </div>
      </nav>
      {open && (
        <div className="mobile-menu">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
          {!user && <NavLink to="/login" onClick={() => setOpen(false)}>Log in</NavLink>}
          {user && <button className="btn btn-ghost" onClick={onLogout}>Log out</button>}
        </div>
      )}
    </header>
  );
}
