import toast from '../../../utils/toast';
import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function PurchaseRequisitionsPage() {
  const { user } = useAuth();
  const currentRole = 'department_requester';
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [appEntries, setAppEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    app_entry_id: '', department_id: user?.department_id || '',
    purpose: '', date_required: '', urgency_level: 'routine',
  });

  const [lineItems, setLineItems] = useState([
    { item_description: '', unit_of_measure: '', quantity: '', unit_cost: '' },
  ]);

  useEffect(() => {
    fetchPRs();
    api.get('/departments').then(r => setDepartments(r.data)).catch(err => console.error(err));
    api.get('/app-entries', { params: { status: 'approved' } })
      .then(r => setAppEntries(r.data.data || []))
      .catch(err => console.error(err));
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/purchase-requisitions', { params });
      setPrs(res.data.data || []);
    } catch (err) { toast.error('Action failed. Please try again.'); console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchPRs(); }, [filter]);

  // Selected APP entry details
  const selectedApp = useMemo(() => {
    return appEntries.find(a => a.id == form.app_entry_id);
   
  }, [form.app_entry_id, appEntries]);

  // Compute total
  const totalEstimated = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
    }, 0);
   
  }, [lineItems]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLineItemChange = (idx, field, value) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_description: '', unit_of_measure: '', quantity: '', unit_cost: '' }]);
  };

  const removeLineItem = (idx) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (asDraft = true) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/purchase-requisitions', {
        ...form,
        line_items: lineItems.map(li => ({
          item_description: li.item_description,
          unit_of_measure: li.unit_of_measure,
          quantity: parseInt(li.quantity) || 1,
          unit_cost: parseFloat(li.unit_cost) || 0,
        })),
        status: asDraft ? 'draft' : 'pending_dh_endorsement',
      });
      setShowForm(false);
      fetchPRs();
      setForm({ app_entry_id: '', department_id: user?.department_id || '', purpose: '', date_required: '', urgency_level: 'routine' });
      setLineItems([{ item_description: '', unit_of_measure: '', quantity: '', unit_cost: '' }]);
    } catch (err) {
      setError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || 'Failed to create PR.'));
    }
    setSaving(false);
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'return') {
        const remarks = prompt('Enter return remarks (min 10 characters):');
        if (!remarks || remarks.length < 10) return;
        await api.post(`/purchase-requisitions/${id}/${action}`, { remarks });
      } else {
        await api.post(`/purchase-requisitions/${id}/${action}`);
      }
      fetchPRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this draft PR?')) return;
    try {
      await api.delete(`/purchase-requisitions/${id}`);
      fetchPRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      pending_dh_endorsement: 'bg-blue-100 text-blue-700',
      pending_budget_certification: 'bg-orange-100 text-orange-700',
      pending_secretariat_review: 'bg-purple-100 text-purple-700',
      accepted: 'bg-green-100 text-green-700',
      returned: 'bg-red-100 text-red-600',
      cancelled: 'bg-gray-200 text-gray-500',
    };
    const labels = {
      draft: 'Draft', pending_dh_endorsement: 'For DH Endorsement',
      pending_budget_certification: 'For Budget Cert.', pending_secretariat_review: 'For Secretariat Review',
      accepted: 'Accepted', returned: 'Returned', cancelled: 'Cancelled',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>;
  };

  const getActions = (pr) => {
    const actions = [];
    if (pr.status === 'draft') {
      actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
      actions.push({ label: 'Delete', action: 'delete', color: 'red' });
    }
    if (pr.status === 'pending_dh_endorsement') {
      actions.push({ label: 'Endorse', action: 'endorse', color: 'green' });
    }
    return actions;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Purchase Requisitions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage purchase requisitions linked to approved APP entries</p>
        </div>
        {(currentRole === 'department_requester' || currentRole === 'bac_secretariat' || currentRole === 'system_admin') && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New PR
          </button>
        )}
      </div>

      {/* PR Creation Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Purchase Requisition</h3>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Approved APP Entry *</label>
              <select name="app_entry_id" value={form.app_entry_id} onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]">
                <option value="">Select APP entry...</option>
                {appEntries.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.project_title} — ₱{parseFloat(a.abc).toLocaleString()} ({a.department?.name})
                  </option>
                ))}
              </select>
              {selectedApp && (
                <p className="text-xs text-green-600 mt-1">
                  Budget: ₱{parseFloat(selectedApp.abc).toLocaleString()} · Mode: {selectedApp.mode?.replace(/_/g, ' ')} · {selectedApp.category?.replace(/_/g, ' ')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select name="department_id" value={form.department_id} onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]">
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Required *</label>
              <input name="date_required" type="date" value={form.date_required} onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
              <select name="urgency_level" value={form.urgency_level} onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Justification *</label>
              <textarea name="purpose" value={form.purpose} onChange={handleFormChange} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]" />
            </div>
          </div>

          {/* Line Items */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
          <div className="border rounded-lg overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 w-1/3">Description</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Unit</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Unit Cost (₱)</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Total (₱)</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1.5">
                      <input value={li.item_description} onChange={e => handleLineItemChange(idx, 'item_description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Item description" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={li.unit_of_measure} onChange={e => handleLineItemChange(idx, 'unit_of_measure', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="pcs" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={li.quantity} onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-right" min="1" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={li.unit_cost} onChange={e => handleLineItemChange(idx, 'unit_cost', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-right" min="0" step="0.01" />
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                      {((parseFloat(li.quantity) || 0) * (parseFloat(li.unit_cost) || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1.5">
                      {lineItems.length > 1 && (
                        <button onClick={() => removeLineItem(idx)} className="text-red-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mb-5">
            <button onClick={addLineItem} className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Line Item
            </button>
            <div className="text-right">
              <span className="text-sm text-gray-500">Total Estimated: </span>
              <span className={`text-base font-semibold ${selectedApp && totalEstimated > parseFloat(selectedApp.abc) ? 'text-red-600' : 'text-gray-900'}`}>
                ₱{totalEstimated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
              {selectedApp && (
                <p className="text-xs text-gray-400">Remaining APP Budget: ₱{parseFloat(selectedApp.abc).toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-500 disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save as Draft'}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50">
              {saving ? 'Submitting...' : '📤 Submit for Endorsement'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'draft', label: 'Draft' },
          { value: 'pending_dh_endorsement', label: 'For Endorsement' },
          { value: 'pending_budget_certification', label: 'For Budget Cert.' },
          { value: 'pending_secretariat_review', label: 'For Secretariat' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'returned', label: 'Returned' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* PRs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : prs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No purchase requisitions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">PR Reference</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">APP Entry</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Total (₱)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 font-mono text-xs">{pr.pr_reference}</div>
                      <div className="text-xs text-gray-400">{pr.urgency_level}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs max-w-xs truncate">{pr.app_entry?.project_title}</td>
                    <td className="px-3 py-2.5 text-gray-600">{pr.department?.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">
                      {parseFloat(pr.total_value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(pr.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        {getActions(pr).map(a => (
                          <button key={a.action}
                            onClick={() => a.action === 'delete' ? handleDelete(pr.id) : handleAction(pr.id, a.action)}
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
