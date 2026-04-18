import toast from '../../../utils/toast';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { ClipboardCheck, ChevronDown, ChevronUp, BarChart3, Plus } from 'lucide-react';

const SUMMARY_STATUS = {
  in_progress: { label: 'IN PROGRESS', cls: 'bg-yellow-100 text-yellow-800' },
  pending_chairperson_review: { label: 'PENDING REVIEW', cls: 'bg-blue-100 text-blue-800' },
  approved: { label: 'APPROVED', cls: 'bg-green-100 text-green-800' },
  failure_of_bidding: { label: 'FAILED', cls: 'bg-red-100 text-red-800' },
};

function EvaluationsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Eval form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ vendor_id: '', calculated_price: '', arithmetic_correction_details: '', recommendation: 'responsive', overall_remarks: '', technical_items: [{ item: '', result: 'pass', remarks: '' }] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bid-openings');
      const all = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setSessions(all.filter(s => s.status === 'completed'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const loadSummary = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/evaluations/${id}/summary`);
      setSummary(res.data);
    } catch { setSummary(null); }
    finally { setDetailLoading(false); }
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setSummary(null); }
    else { setExpandedId(id); loadSummary(id); }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateTechItem = (idx, field, value) => {
    const items = [...formData.technical_items];
    items[idx] = { ...items[idx], [field]: value };
    setFormData(prev => ({ ...prev, technical_items: items }));
  };
  const addTechItem = () => setFormData(prev => ({ ...prev, technical_items: [...prev.technical_items, { item: '', result: 'pass', remarks: '' }] }));
  const removeTechItem = (idx) => setFormData(prev => ({ ...prev, technical_items: prev.technical_items.filter((_, i) => i !== idx) }));

  const submitEvaluation = async (e) => {
    e.preventDefault();
    if (!formData.vendor_id) { toast.error('Select a vendor.'); return; }
    if (formData.technical_items.some(t => !t.item)) { toast.error('All technical items need a name.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/evaluations/${expandedId}/submit`, {
        vendor_id: parseInt(formData.vendor_id),
        technical_items: formData.technical_items,
        calculated_price: parseFloat(formData.calculated_price),
        arithmetic_correction_details: formData.arithmetic_correction_details || null,
        recommendation: formData.recommendation,
        overall_remarks: formData.overall_remarks,
      });
      toast.success('Evaluation submitted successfully.');
      setShowForm(false);
      setFormData({ vendor_id: '', calculated_price: '', arithmetic_correction_details: '', recommendation: 'responsive', overall_remarks: '', technical_items: [{ item: '', result: 'pass', remarks: '' }] });
      loadSummary(expandedId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const summaryStatus = summary?.summary?.status;
  const canEvaluate = !summaryStatus || summaryStatus === 'in_progress';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-blue-600" /> BAC Member Evaluation
        </h1>
        <p className="text-gray-500 text-sm mt-1">Submit BAC member evaluations for completed bid openings.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No sessions available for evaluation</p>
          </div>
        ) : sessions.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(session.id)}>
              <div>
                <p className="font-semibold text-gray-900">{session.session_reference}</p>
                <p className="text-xs text-gray-500">{session.invitation?.reference_number || '—'}</p>
              </div>
              {expandedId === session.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedId === session.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                {detailLoading ? <p className="text-sm text-gray-500">Loading...</p> : summary ? (
                  <>
                    {summary.summary && (() => {
                      const s = SUMMARY_STATUS[summary.summary.status] || { label: summary.summary.status, cls: 'bg-gray-100 text-gray-800' };
                      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
                    })()}

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Submitted Evaluations ({summary.evaluations?.length || 0})</h4>
                      {(summary.evaluations || []).length === 0 ? (
                        <p className="text-xs text-gray-500">No evaluations submitted yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {summary.evaluations.map(ev => (
                            <div key={ev.id} className="p-2 bg-white rounded border text-xs">
                              <span className="font-medium">{ev.evaluator?.name || `User #${ev.evaluator_id}`}</span>
                              <span className="text-gray-500"> → Vendor #{ev.vendor_id}</span>
                              <span className="ml-2">₱{Number(ev.calculated_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <span className={`ml-2 font-bold ${ev.recommendation === 'responsive' ? 'text-green-600' : 'text-red-600'}`}>
                                {ev.recommendation?.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {summary.summary?.ranked_bidders?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Ranked Bidders</h4>
                        <table className="w-full text-xs border border-gray-200 rounded">
                          <thead className="bg-gray-100"><tr>
                            <th className="px-3 py-1.5 text-center">Rank</th>
                            <th className="px-3 py-1.5 text-left">Vendor</th>
                            <th className="px-3 py-1.5 text-right">Calculated Price</th>
                          </tr></thead>
                          <tbody>
                            {summary.summary.ranked_bidders.map(r => (
                              <tr key={r.rank} className="border-t border-gray-100">
                                <td className="px-3 py-1.5 text-center font-bold">{r.rank}</td>
                                <td className="px-3 py-1.5">Vendor #{r.vendor_id}</td>
                                <td className="px-3 py-1.5 text-right">₱{Number(r.calculated_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {canEvaluate && (
                      <div className="pt-2 border-t border-gray-200">
                        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Submit Evaluation
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evaluation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center sticky top-0">
              <h3 className="text-lg font-semibold text-gray-800">Submit Evaluation</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={submitEvaluation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
                <input type="number" required value={formData.vendor_id} onChange={e => updateField('vendor_id', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" placeholder="Eligible vendor ID" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technical Compliance Items</label>
                <div className="space-y-2">
                  {formData.technical_items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input type="text" required value={item.item} onChange={e => updateTechItem(idx, 'item', e.target.value)} placeholder="Requirement" className="flex-1 px-2 py-1.5 border rounded text-xs" />
                      <select value={item.result} onChange={e => updateTechItem(idx, 'result', e.target.value)} className="px-2 py-1.5 border rounded text-xs w-20">
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                      <input type="text" value={item.remarks} onChange={e => updateTechItem(idx, 'remarks', e.target.value)} placeholder="Remarks" className="flex-1 px-2 py-1.5 border rounded text-xs" />
                      {formData.technical_items.length > 1 && (
                        <button type="button" onClick={() => removeTechItem(idx)} className="text-red-500 text-xs px-1">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addTechItem} className="text-xs text-blue-600 hover:underline">+ Add Item</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Price (₱)</label>
                <input type="number" step="0.01" required value={formData.calculated_price} onChange={e => updateField('calculated_price', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arithmetic Correction Details</label>
                <textarea value={formData.arithmetic_correction_details} onChange={e => updateField('arithmetic_correction_details', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" rows={2} placeholder="Optional — correction applied" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                <select value={formData.recommendation} onChange={e => updateField('recommendation', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="responsive">Responsive</option>
                  <option value="non_responsive">Non-Responsive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Remarks</label>
                <textarea required value={formData.overall_remarks} onChange={e => updateField('overall_remarks', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationsPage;
