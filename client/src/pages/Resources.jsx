import { useEffect, useState } from 'react';
import { resourceApi } from '../api/client.js';
import ResourceCard from '../components/ResourceCard.jsx';
import Spinner from '../components/Spinner.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Resources() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    resourceApi.locations().then((res) => setLocations(res.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    resourceApi
      .list({ search, category, location, sort, page, limit: 9 })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category, location, sort, page]);

  return (
    <div className="page">
      <div className="container">
        <h1>Laboratory resources</h1>
        <p>Search by name or identifier, then filter by category and location.</p>
        <div className="card filter-bar" style={{ marginBottom: '1rem' }}>
          <input className="input" placeholder="Search name or code" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
            <option value="">All categories</option>
            <option value="WORKSTATION">Workstation</option>
            <option value="COMPUTER">Computer</option>
            <option value="ELECTRONIC_EQUIPMENT">Electronic equipment</option>
            <option value="LABORATORY_INSTRUMENT">Laboratory instrument</option>
          </select>
          <select value={location} onChange={(e) => { setPage(1); setLocation(e.target.value); }}>
            <option value="">All locations</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Sort by name</option>
            <option value="location">Sort by location</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading && <Spinner label="Loading resources" />}
        {!loading && data?.data.items.length === 0 && (
          <EmptyState title="No resources match" message="Try a different search or filter." />
        )}
        <div className="grid grid-3">
          {data?.data.items.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
        </div>
        <Pagination pagination={data?.data.pagination} onPage={setPage} />
      </div>
    </div>
  );
}
