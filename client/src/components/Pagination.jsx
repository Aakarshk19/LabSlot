export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="row space-between" style={{ marginTop: '1rem' }}>
      <span className="muted">Page {pagination.page} of {pagination.pages}</span>
      <div className="row">
        <button className="btn btn-ghost" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
          Previous
        </button>
        <button className="btn btn-ghost" disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
