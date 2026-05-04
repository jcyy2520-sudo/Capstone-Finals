import { useEffect, useState } from 'react';
import api from '../../services/api';

const tableOptions = [
  { value: '', label: 'All Tables' },
  { value: 'app_entries', label: 'APP Entries' },
  { value: 'purchase_requisitions', label: 'Purchase Requisitions' },
  { value: 'invitations', label: 'Invitations' },
  { value: 'awards', label: 'Awards' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'blockchain_events', label: 'Blockchain Events' },
  { value: 'audit_logs', label: 'Audit Logs' },
  { value: 'procurement_notifications', label: 'Notifications' },
];

export default function ImmutableHistoryPage({ roleLabel = 'auditor' }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, created: 0, updated: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [tableName, setTableName] = useState('');
  const [operation, setOperation] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = { page, per_page: 20 };
        if (tableName) params.table_name = tableName;
        if (operation) params.operation = operation;
        if (search) params.search = search;

        const { data } = await api.get('/immutable-history', { params });
        if (cancelled) return;

        setRows(data.data || []);
        setSummary(data.summary || { total: 0, created: 0, updated: 0, deleted: 0 });
        setLastPage(data.meta?.last_page || 1);
      } catch {
        if (!cancelled) {
          setRows([]);
          setSummary({ total: 0, created: 0, updated: 0, deleted: 0 });
          setLastPage(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, tableName, operation, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Immutable History</h1>
        <p className="text-sm text-gray-500 mt-1">Read-only version snapshots for critical records in the {roleLabel} workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Tracked Snapshots" value={summary.total} />
        <SummaryCard label="Created" value={summary.created} tone="blue" />
        <SummaryCard label="Updated" value={summary.updated} tone="amber" />
        <SummaryCard label="Deleted" value={summary.deleted} tone="red" />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          placeholder="Search table, record, or snapshot content..."
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-full max-w-md"
        />
        <select
          value={tableName}
          onChange={(event) => { setTableName(event.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          {tableOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={operation}
          onChange={(event) => { setOperation(event.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Operations</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading immutable history...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No immutable history entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Time</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Table</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Record</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Operation</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Changed Fields</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const isExpanded = expandedId === row.id;

                  return (
                    <FragmentRow
                      key={row.id}
                      row={row}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100">
            <button
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1}
              className="text-sm text-blue-600 disabled:text-gray-300"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button
              onClick={() => setPage((currentPage) => Math.min(lastPage, currentPage + 1))}
              disabled={page === lastPage}
              className="text-sm text-blue-600 disabled:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FragmentRow({ row, isExpanded, onToggle }) {
  return (
    <>
      <tr className="hover:bg-gray-50 align-top">
        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(row.recorded_at)}</td>
        <td className="px-3 py-2.5">
          <p className="text-xs font-medium text-gray-900">{row.table_label}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{row.table_name}</p>
        </td>
        <td className="px-3 py-2.5">
          <p className="text-xs font-medium text-gray-900">{row.record_label}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">ID #{row.record_id}</p>
        </td>
        <td className="px-3 py-2.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${operationClassName(row.operation)}`}>
            {row.operation}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1 max-w-[280px]">
            {row.changed_fields.length === 0 ? (
              <span className="text-xs text-gray-400">No diff fields</span>
            ) : row.changed_fields.slice(0, 4).map((field) => (
              <span key={field} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {formatField(field)}
              </span>
            ))}
            {row.changed_fields.length > 4 && (
              <span className="text-[11px] text-gray-500">+{row.changed_fields.length - 4} more</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5">
          <button onClick={onToggle} className="text-xs text-blue-600 hover:text-blue-800">
            {isExpanded ? 'Hide' : 'View'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/70">
          <td colSpan={6} className="px-3 py-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <SnapshotPanel title="Previous Snapshot" data={row.old_snapshot} emptyLabel="No previous snapshot" />
              <SnapshotPanel title="New Snapshot" data={row.new_snapshot} emptyLabel="No new snapshot" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SnapshotPanel({ title, data, emptyLabel }) {
  const hasData = data && Object.keys(data).length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</h2>
      </div>
      <div className="p-3">
        {hasData ? (
          <pre className="text-[11px] leading-5 text-gray-700 whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p className="text-xs text-gray-400">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const valueClassName =
    tone === 'blue'
      ? 'text-blue-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : tone === 'red'
          ? 'text-red-700'
          : 'text-gray-900';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClassName}`}>{value}</p>
    </div>
  );
}

function operationClassName(operation) {
  if (operation === 'created') return 'bg-blue-100 text-blue-700';
  if (operation === 'updated') return 'bg-amber-100 text-amber-800';
  if (operation === 'deleted') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

function formatField(value) {
  return value.replace(/_/g, ' ');
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-PH');
}