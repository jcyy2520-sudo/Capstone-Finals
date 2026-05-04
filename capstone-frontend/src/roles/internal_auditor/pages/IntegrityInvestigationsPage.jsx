import { useEffect, useState } from 'react';
import api from '../../../services/api';

export default function IntegrityInvestigationsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (status) params.status = status;
        if (search) params.search = search;

        const { data } = await api.get('/integrity-investigations', { params });
        setRows(data.data || []);
        setSummary(data.summary || { total: 0, open: 0, resolved: 0 });
      } catch {
        setRows([]);
        setSummary({ total: 0, open: 0, resolved: 0 });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Integrity Investigations</h1>
        <p className="text-sm text-gray-500 mt-1">Live mismatch review for blockchain-backed procurement records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Tracked Mismatches" value={summary.total} />
        <SummaryCard label="Open Cases" value={summary.open} tone={summary.open > 0 ? 'amber' : undefined} />
        <SummaryCard label="Resolved Cases" value={summary.resolved} tone="green" />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search procurement, table, field, or value..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-full max-w-md"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading investigations...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No integrity investigations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Procurement</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Affected Table</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Field</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Expected</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Actual</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Source</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50 align-top">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">#{row.procurement_id}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(row.last_detected_at)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-gray-900">{formatTableName(row.affected_table)}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{row.entity_type} #{row.entity_id}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-gray-900">{formatFieldName(row.field)}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-[240px] truncate" title={row.label}>{row.label}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-emerald-700 max-w-[180px] break-words">{row.expected}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-rose-700 max-w-[180px] break-words">{row.actual}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{row.source_event.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.status === 'open' ? 'Open' : 'Resolved'}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-1">Checked {formatDate(row.last_checked_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const valueClassName =
    tone === 'amber'
      ? 'text-amber-700'
      : tone === 'green'
        ? 'text-emerald-700'
        : 'text-gray-900';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClassName}`}>{value}</p>
    </div>
  );
}

function formatTableName(value) {
  return value.replace(/_/g, ' ');
}

function formatFieldName(value) {
  return value.replace(/_/g, ' ');
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('en-PH');
}