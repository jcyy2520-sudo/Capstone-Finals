import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_COLORS = {
  pending_budget_certification: 'bg-orange-100 text-orange-700',
  pending_hope_approval: 'bg-purple-100 text-purple-700',
  pending_secretariat_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  accepted: 'bg-green-100 text-green-700',
  returned: 'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  pending_budget_certification: 'For Certification',
  pending_hope_approval: 'Certified → HOPE',
  pending_secretariat_review: 'Certified → Secretariat',
  approved: 'Approved',
  accepted: 'Accepted',
  returned: 'Returned',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function CertificationPage() {
  const [tab, setTab] = useState('app');
  const [appEntries, setAppEntries] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loadingApp, setLoadingApp] = useState(true);
  const [loadingPr, setLoadingPr] = useState(true);
  const [filter, setFilter] = useState('pending_budget_certification');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchAppEntries(); }, [filter]);
  useEffect(() => { fetchPrs(); }, [filter]);

  const fetchAppEntries = async () => {
    setLoadingApp(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/app-entries', { params });
      setAppEntries(res.data.data || []);
    } catch {
      toast.error('Failed to load APP entries.');
    }
    setLoadingApp(false);
  };

  const fetchPrs = async () => {
    setLoadingPr(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/purchase-requisitions', { params });
      setPrs(res.data.data || []);
    } catch {
      toast.error('Failed to load purchase requisitions.');
    }
    setLoadingPr(false);
  };

  const handleCertifyApp = async (id) => {
    if (!confirm('Certify budget availability for this APP entry?')) return;
    setActionLoading(id);
    try {
      await api.post(`/app-entries/${id}/certify-budget`);
      toast.success('APP entry budget certified.');
      fetchAppEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certification failed.');
    }
    setActionLoading(null);
  };

  const handleReturnApp = async (id) => {
    const remarks = prompt('Enter return remarks (min 10 characters):');
    if (!remarks || remarks.length < 10) {
      if (remarks !== null) toast.error('Remarks must be at least 10 characters.');
      return;
    }
    setActionLoading(id);
    try {
      await api.post(`/app-entries/${id}/return`, { remarks });
      toast.success('APP entry returned for revision.');
      fetchAppEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
    setActionLoading(null);
  };

  const handleCertifyPr = async (id) => {
    if (!confirm('Certify budget availability for this Purchase Requisition?')) return;
    setActionLoading(`pr-${id}`);
    try {
      await api.post(`/purchase-requisitions/${id}/certify-budget`);
      toast.success('PR budget certified.');
      fetchPrs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certification failed.');
    }
    setActionLoading(null);
  };

  const handleReturnPr = async (id) => {
    const remarks = prompt('Enter return remarks (min 10 characters):');
    if (!remarks || remarks.length < 10) {
      if (remarks !== null) toast.error('Remarks must be at least 10 characters.');
      return;
    }
    setActionLoading(`pr-${id}`);
    try {
      await api.post(`/purchase-requisitions/${id}/return`, { remarks });
      toast.success('PR returned for revision.');
      fetchPrs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
    setActionLoading(null);
  };

  const formatCurrency = (val) =>
    parseFloat(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const pendingAppCount = appEntries.filter(e => e.status === 'pending_budget_certification').length;
  const pendingPrCount = prs.filter(p => p.status === 'pending_budget_certification').length;

  const tabs = [
    { key: 'app', label: 'APP Entries', count: pendingAppCount },
    { key: 'pr', label: 'Purchase Requisitions', count: pendingPrCount },
  ];

  const filters = [
    { value: 'pending_budget_certification', label: 'Pending Certification' },
    { value: '', label: 'All Visible' },
  ];

  const loading = tab === 'app' ? loadingApp : loadingPr;
  const data = tab === 'app' ? appEntries : prs;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Budget Certification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and certify budget availability for APP entries and purchase requisitions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-orange-600">APP Pending</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingAppCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-orange-600">PR Pending</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingPrCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Total Pending</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingAppCount + pendingPrCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {filter === 'pending_budget_certification'
              ? 'No items awaiting budget certification.'
              : 'No items found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {tab === 'app' ? (
                    <>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Project Title</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Category</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">ABC (₱)</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Mode</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">PR Reference</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">APP Entry</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">Total (₱)</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Mode</th>
                    </>
                  )}
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    {tab === 'app' ? (
                      <>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900 max-w-xs truncate">{item.project_title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">FY {item.fiscal_year}</div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{item.department?.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 capitalize">{item.category?.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-800">{formatCurrency(item.abc)}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{item.mode?.replace(/_/g, ' ')}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900">{item.pr_reference}</div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{item.department?.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs max-w-xs truncate">
                          {item.app_entry?.project_title || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-800">{formatCurrency(item.total_value)}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{item.procurement_mode?.replace(/_/g, ' ')}</td>
                      </>
                    )}
                    <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-2.5">
                      {item.status === 'pending_budget_certification' && (
                        <div className="flex gap-1.5">
                          <button
                            disabled={actionLoading === (tab === 'app' ? item.id : `pr-${item.id}`)}
                            onClick={() => tab === 'app' ? handleCertifyApp(item.id) : handleCertifyPr(item.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50">
                            Certify
                          </button>
                          <button
                            disabled={actionLoading === (tab === 'app' ? item.id : `pr-${item.id}`)}
                            onClick={() => tab === 'app' ? handleReturnApp(item.id) : handleReturnPr(item.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            Return
                          </button>
                        </div>
                      )}
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