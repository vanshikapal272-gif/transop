import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({ columns, data, searchable = true, pageSize = 10, onRowClick, emptyMessage = 'No data found' }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find(c => (c.key || c.accessor) === sortKey);
      const aVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor]) : a[sortKey];
      const bVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor]) : b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="data-table-toolbar">
          <div className="data-table-toolbar-left">
            <div className="data-table-search">
              <Search size={14} />
              <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{sorted.length} records</span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => {
              const key = col.key || col.accessor;
              const isSorted = sortKey === key;
              return (
                <th key={key}
                    onClick={() => col.sortable !== false && handleSort(key)}
                    className={isSorted ? 'sorted' : ''}
                    style={col.sortable === false ? { cursor: 'default' } : {}}>
                  <span>{col.header}</span>
                  {col.sortable !== false && (
                    <span className="sort-icon">
                      {isSorted ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronUp size={12} />}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="data-table-empty"><p>{emptyMessage}</p></div>
              </td>
            </tr>
          ) : (
            paged.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={onRowClick ? { cursor: 'pointer' } : {}}>
                {columns.map(col => (
                  <td key={col.key || col.accessor}>
                    {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="data-table-pagination">
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="data-table-pagination-btns">
            <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            <span style={{ padding: '0 8px', fontSize: 'var(--fs-sm)' }}>Page {page + 1} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
