import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { categoryLabel } from '../utils/format.js';

const colors = {
  WORKSTATION: '#1d6aa5',
  COMPUTER: '#154e7a',
  ELECTRONIC_EQUIPMENT: '#2f8f6b',
  LABORATORY_INSTRUMENT: '#3d6b8a',
};

export default function ResourceCard({ resource }) {
  return (
    <article className="card">
      <div className="resource-art" style={{ background: colors[resource.category] || '#1d6aa5' }}>
        {resource.resourceCode}
      </div>
      <div className="row space-between">
        <h3 style={{ fontSize: '1.15rem' }}>{resource.name}</h3>
        <StatusBadge status={resource.status} />
      </div>
      <p>{resource.description}</p>
      <p className="muted"><MapPin size={14} /> {resource.location} · {categoryLabel(resource.category)}</p>
      <Link className="btn btn-primary" to={`/resources/${resource.id}`}>View & book</Link>
    </article>
  );
}
