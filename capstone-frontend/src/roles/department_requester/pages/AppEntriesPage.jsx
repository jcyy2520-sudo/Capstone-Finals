import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const CATEGORIES = [
  { value: 'goods', label: 'Goods' },
  { value: 'services', label: 'Services' },
  { value: 'infrastructure_works', label: 'Infrastructure / Works' },
  { value: 'consulting_services', label: 'Consulting Services' },
];

const MODES = [
  { value: 'competitive_bidding', label: 'Competitive Bidding' },
  { value: 'limited_source_bidding', label: 'Limited Source Bidding' },
  { value: 'direct_contracting', label: 'Direct Contracting' },
  { value: 'repeat_order', label: 'Repeat Order' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'negotiated_procurement', label: 'Negotiated Procurement' },
  { value: 'small_value_procurement', label: 'Small Value Procurement' },
  { value: 'lease_of_real_property', label: 'Lease of Real Property' },
  { value: 'community_participation', label: 'Community Participation' },
  { value: 'agency_to_agency', label: 'Agency-to-Agency' },
  { value: 'scientific_technological', label: 'Scientific, Technological \u0026 Specialized' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function AppEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [appRefs, setAppRefs] = useState({ mfo_options: [], pap_codes: [], uacs_object_codes: [], budget_references: [] });
  const [filter, setFilter] = useState('');
  const [modeHint, setModeHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    project_title: '', description: '', category: 'goods', mode: 'competitive_bidding',
    abc: '', unit_of_measurement: '', quantity: '', fund_source: 'General Fund',
    mfo_code: '', pap_code: '', uacs_object_code: '', approved_budget_reference: '',
    account_code: '', implementing_unit: '', department_id: user?.department_id || '',
    target_start_quarter: 'Q1', target_completion_quarter: 'Q1', justification: '',
  });

  useEffect(() => {
    fetchEntries();
    api.get('/departments').then(r => setDepartments(r.data)).catch(err => console.error(err));
    api.get('/app-entries/reference-data').then(r => setAppRefs(r.data)).catch(err => console.error(err));
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/app-entries', { params });
      setEntries(res.data.data || []);
    } catch (err) { toast.error('Action failed. Please try again.'); console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, [filter]);

  // Mode recommendation when ABC changes
  useEffect(() => {
    const abc = parseFloat(form.abc);
    if (!isNaN(abc) && abc > 0) {
      if (abc <= 50000) setModeHint('Shopping (\u2264\u20b150,000)');
      else if (abc <= 2000000) setModeHint('Small Value Procurement (\u2264\u20b12,000,000)');
      else setModeHint('Competitive Bidding (>\u20b12,000,000)');
    } else { setModeHint(''); }
   
  }, [form.abc]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (asDraft = true) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/app-entries', {
        ...form,
        abc: parseFloat(form.abc) || 0,
        quantity: form.quantity ? parseInt(form.quantity) : null,
        status: asDraft ? 'draft' : 'submitted',
      });
      setShowForm(false);
      fetchEntries();
      setForm({
        project_title: '', description: '', category: 'goods', mode: 'competitive_bidding',
        abc: '', unit_of_measurement: '', quantity: '', fund_source: 'General Fund',
        mfo_code: '', pap_code: '', uacs_object_code: '', approved_budget_reference: '',
        account_code: '', implementing_unit: '', department_id: user?.department_id || '',
        target_start_quarter: 'Q1', target_completion_quarter: 'Q1', justification: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    }
    setSaving(false);
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'return') {
        const remarks = prompt('Enter return remarks (min 10 chars):');
        if (!remarks || remarks.length < 10) return;
        await api.post(`/app-entries/${id}/${action}`, { remarks });
      } else {
        await api.post(`/app-entries/${id}/${action}`);
      }
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this draft entry?')) return;
    try {
      await api.delete(`/app-entries/${id}`);
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-blue-100 text-blue-700',
      pending_secretariat_consolidation: 'bg-yellow-100 text-yellow-700',
      pending_budget_certification: 'bg-orange-100 text-orange-700',
      pending_hope_approval: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      returned: 'bg-red-100 text-red-600',
      cancelled: 'bg-gray-200 text-gray-500',
    };
    const labels = {
      draft: 'Draft', submitted: 'Submitted',
      pending_secretariat_consolidation: 'Pending Consolidation',
      pending_budget_certification: 'For Budget Cert.',
      pending_hope_approval: 'For HOPE Approval',
      approved: 'Approved', returned: 'Returned', cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Determine which actions are available per role
  const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'draft') {
      actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
      actions.push({ label: 'Delete', action: 'delete', color: 'red' });
    }
    return actions;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Annual Procurement Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage project entries for the fiscal year</p>
        </div>
        {user?.role?.permissions?.app?.create && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Entry
          </button>
        )}
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create APP Project Entry</h3>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
              <input name="project_title" value={form.project_title} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={300} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Scope *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Mode *</label>
              <select name="mode" value={form.mode} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved Budget (ABC) ₱ *</label>
              <input name="abc" type="number" value={form.abc} onChange={handleChange} min="1" step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500" />
              {modeHint && <p className="text-xs text-blue-600 mt-1">💡 Recommended: {modeHint}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major Final Output (MFO) *</label>
              <select name="mfo_code" value={form.mfo_code} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                <option value="">Select MFO</option>
                {appRefs.mfo_options.map(mfo => <option key={mfo.code} value={mfo.code}>{mfo.code} — {mfo.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program / Activity / Project (PAP) Code *</label>
              <select name="pap_code" value={form.pap_code} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                <option value="">Select PAP code</option>
                {appRefs.pap_codes.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UACS Object Code *</label>
              <select name="uacs_object_code" value={form.uacs_object_code} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                <option value="">Select UACS object code</option>
                {appRefs.uacs_object_codes.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved Budget Reference (GAA/Local Budget) *</label>
              <select name="approved_budget_reference" value={form.approved_budget_reference} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                <option value="">Select budget reference</option>
                {appRefs.budget_references.map(ref => <option key={ref} value={ref}>{ref}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Source *</label>
              <select name="fund_source" value={form.fund_source} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                {['General Fund', 'Special Education Fund', 'Trust Fund', 'LGSF', 'External Loan'].map(f =>
                  <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Code *</label>
              <input name="account_code" value={form.account_code} onChange={handleChange} placeholder="000-000-000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select name="department_id" value={form.department_id} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Implementing Unit *</label>
              <input name="implementing_unit" value={form.implementing_unit} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500" />
            </div>
            {form.category === 'goods' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
                  <input name="unit_of_measurement" value={form.unit_of_measurement} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input name="quantity" type="number" value={form.quantity} onChange={handleChange} min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Start Quarter *</label>
              <select name="target_start_quarter" value={form.target_start_quarter} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Quarter *</label>
              <select name="target_completion_quarter" value={form.target_completion_quarter} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500">
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Justification / Basis *</label>
              <textarea name="justification" value={form.justification} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-500 disabled:opacity-50 transition">
              {saving ? 'Saving...' : '💾 Save as Draft'}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 transition">
              {saving ? 'Submitting...' : '📤 Submit for Consolidation'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'draft', label: 'Draft' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'pending_budget_certification', label: 'For Budget Cert.' },
          { value: 'pending_hope_approval', label: 'For HOPE Approval' },
          { value: 'approved', label: 'Approved' },
          { value: 'returned', label: 'Returned' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No APP entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Project Title</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Category</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">PAP / UACS</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">ABC (₱)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Mode</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{entry.project_title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{entry.target_start_quarter} – {entry.target_completion_quarter}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{entry.department?.name}</td>
                    <td className="px-3 py-2.5 text-gray-600 capitalize">{entry.category?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      <div>{entry.pap_code || '—'}</div>
                      <div className="text-gray-400 mt-0.5">{entry.uacs_object_code || '—'}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">
                      {parseFloat(entry.abc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{entry.mode?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5">{statusBadge(entry.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        {getActions(entry).map(a => (
                          <button key={a.action}
                            onClick={() => a.action === 'delete' ? handleDelete(entry.id) : handleAction(entry.id, a.action)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                              a.color === 'red' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                              a.color === 'green' ? 'bg-green-50 text-green-600 hover:bg-green-100' :
                              'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}>{a.label}</button>
                        ))}
                      </div>
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
