export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty card">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
