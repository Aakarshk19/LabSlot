import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="layout-body">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">LabSlot — Smart Lab & Equipment Booking Platform</div>
      </footer>
    </>
  );
}
