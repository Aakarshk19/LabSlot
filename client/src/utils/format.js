export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function categoryLabel(category) {
  return {
    WORKSTATION: 'Workstation',
    COMPUTER: 'Computer',
    ELECTRONIC_EQUIPMENT: 'Electronic equipment',
    LABORATORY_INSTRUMENT: 'Laboratory instrument',
  }[category] || category;
}

export function statusLabel(status) {
  return {
    AVAILABLE: 'Available',
    MAINTENANCE: 'Maintenance',
    DEACTIVATED: 'Deactivated',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
  }[status] || status;
}

export function todayInputValue() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
