import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = {
  name: '',
  resourceCode: '',
  description: '',
  category: 'WORKSTATION',
  location: '',
  specifications: '',
};

export default function AdminResources() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    adminApi.resources({ page, limit: 10, status: 'ALL' }).then(setData);
  }

  useEffect(() => { load(); }, [page]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await adminApi.updateResource(editing, form);
        toast.success('Resource updated');
      } else {
        await adminApi.createResource(form);
        toast.success('Resource created');
      }
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    try {
      await adminApi.updateResourceStatus(id, status);
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!data) return <Spinner />;

  return (
    <div className="page">
      <div className="container grid grid-2">
        <div className="card">
          <h1>{editing ? 'Edit resource' : 'Add resource'}</h1>
          <form onSubmit={onSubmit}>
            {['name', 'resourceCode', 'location', 'specifications'].map((key) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{key}</label>
                <input id={key} className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="WORKSTATION">Workstation</option>
                <option value="COMPUTER">Computer</option>
                <option value="ELECTRONIC_EQUIPMENT">Electronic equipment</option>
                <option value="LABORATORY_INSTRUMENT">Laboratory instrument</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save resource'}</button>
          </form>
        </div>
        <div>
          {(data.data.items || []).map((r) => (
            <div className="card" key={r.id} style={{ marginBottom: '0.8rem' }}>
              <div className="row space-between">
                <strong>{r.name}</strong>
                <StatusBadge status={r.status} />
              </div>
              <p>{r.resourceCode} · {r.location}</p>
              <div className="row">
                <button className="btn btn-ghost" onClick={() => { setEditing(r.id); setForm(r); }}>Edit</button>
                <button className="btn btn-ghost" onClick={() => setStatus(r.id, 'MAINTENANCE')}>Maintenance</button>
                <button className="btn btn-ghost" onClick={() => setStatus(r.id, 'AVAILABLE')}>Available</button>
                <button className="btn btn-danger" onClick={() => setStatus(r.id, 'DEACTIVATED')}>Deactivate</button>
              </div>
            </div>
          ))}
          <Pagination pagination={data.data.pagination} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
