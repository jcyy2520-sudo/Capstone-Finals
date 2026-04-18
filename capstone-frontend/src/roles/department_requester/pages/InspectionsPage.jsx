import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';
import { ClipboardCheck, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function InspectionsPage() {
  const [iars, setIars] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([{ description: '', quantity: 1, unit: 'pcs', status: 'passed' }]);
  const [remarks, setRemarks] = useState('');

  const fetchData = async () => {
    try {
      const [iarsRes, contractsRes] = await Promise.all([
        api.get('/inspections'),
        api.get('/contracts'),
      ]);
      setIars(iarsRes.data);
      const activeContracts = (contractsRes.data.contracts || contractsRes.data || []).filter(c => c.status === 'active');
      setContracts(activeContracts);
    } catch {
      toast.error('Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit: 'pcs', status: 'passed' }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContract) { toast.error('Select a contract'); return; }
    if (items.some(i => !i.description.trim())) { toast.error('All items need a description'); return; }
    setSubmitting(true);
    try {
      await api.post(`/contracts/${selectedContract}/inspections`, {
        inspection_items: items,
        inspection_remarks: remarks || null,
      });
      toast.success('Inspection report created');
      setShowModal(false);
      setItems([{ description: '', quantity: 1, unit: 'pcs', status: 'passed' }]);
      setRemarks('');
      setSelectedContract('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create IAR');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      inspected: 'bg-amber-100 text-amber-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" /></div>;
  }

  const pendingCount = iars.filter(i => i.status === 'inspected').length;
  const acceptedCount = iars.filter(i => i.status === 'accepted').length;
  const rejectedCount = iars.filter(i => i.status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Inspections & Acceptance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create inspection reports for contract deliveries.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md text-[13px] font-medium hover:bg-cyan-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> New Inspection
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{String(pendingCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{String(acceptedCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{String(rejectedCount).padStart(2, '0')}</p>
        </div>
      </div>

      {/* IAR Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Inspection Reports</h2>
        </div>
        {iars.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Contract</th>
                  <th className="px-6 py-3 text-left">Items</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Inspected</th>
                  <th className="px-6 py-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {iars.map(iar => (
                  <tr key={iar.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-600">IAR-{String(iar.id).padStart(4, '0')}</td>
                    <td className="px-6 py-3">{iar.contract?.contract_reference || `CON-${String(iar.contract_id).padStart(5, '0')}`}</td>
                    <td className="px-6 py-3">{Array.isArray(iar.inspection_items) ? iar.inspection_items.length : 0} items</td>
                    <td className="px-6 py-3">{getStatusBadge(iar.status)}</td>
                    <td className="px-6 py-3 text-gray-500">{iar.inspected_at ? new Date(iar.inspected_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate">{iar.inspection_remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">No inspection reports yet</p>
            <p className="text-sm">Create your first inspection report for an active contract.</p>
          </div>
        )}
      </div>

      {/* Create IAR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">New Inspection Report</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                <select value={selectedContract} onChange={e => setSelectedContract(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-cyan-500 focus:border-cyan-500" required>
                  <option value="">Select an active contract...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.contract_reference || `CON-${String(c.id).padStart(5, '0')}`} — ₱{Number(c.contract_amount).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Inspection Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-cyan-600 hover:text-cyan-800 font-medium">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input type="text" placeholder="Item description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                      <input type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input type="text" placeholder="unit" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <select value={item.status} onChange={e => updateItem(idx, 'status', e.target.value)} className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm">
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="partial">Partial</option>
                      </select>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 mt-2"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-cyan-500 focus:border-cyan-500" placeholder="Additional inspection notes..." />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-cyan-600 text-white rounded-md text-[13px] font-medium hover:bg-cyan-700 disabled:opacity-50 transition">
                  {submitting ? 'Creating...' : 'Create IAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}