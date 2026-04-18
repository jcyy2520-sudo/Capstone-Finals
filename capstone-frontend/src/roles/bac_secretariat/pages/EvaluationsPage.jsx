import toast from '../../../utils/toast';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';
import { ClipboardCheck, ChevronDown, ChevronUp, BarChart3, FileUp, Send } from 'lucide-react';

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

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bid-openings');
      const all = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      // Secretariat sees completed sessions (evaluation starts after bid opening closes)
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

  const generateAbstract = async () => {
    try {
      const res = await api.post(`/evaluations/${expandedId}/generate-abstract`);
      toast.success('Abstract of Bids As Calculated generated.');
      loadSummary(expandedId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate abstract'); }
  };

  const submitToChair = async () => {
    try {
      await api.put(`/evaluations/${expandedId}/submit-to-chair`);
      toast.success('Evaluation submitted to Chairperson for review.');
      loadSummary(expandedId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-blue-600" /> Bid Evaluation
        </h1>
        <p className="text-gray-500 text-sm mt-1">Generate abstracts and manage evaluation workflow for completed bid openings.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No completed bid openings for evaluation</p>
          </div>
        ) : sessions.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(session.id)}>
              <div>
                <p className="font-semibold text-gray-900">{session.session_reference}</p>
                <p className="text-xs text-gray-500">{session.invitation?.reference_number || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                {expandedId === session.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {expandedId === session.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                {detailLoading ? <p className="text-sm text-gray-500">Loading...</p> : summary ? (
                  <>
                    {/* Summary Status */}
                    {summary.summary && (() => {
                      const s = SUMMARY_STATUS[summary.summary.status] || { label: summary.summary.status, cls: 'bg-gray-100 text-gray-800' };
                      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
                    })()}

                    {/* TWG Evaluations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><BarChart3 className="w-4 h-4 text-purple-500" /> TWG Technical Evaluations ({summary.twg_evaluations?.length || 0})</h4>
                      {(summary.twg_evaluations || []).length === 0 ? (
                        <p className="text-xs text-gray-500">No TWG evaluations submitted yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {summary.twg_evaluations.map(ev => (
                            <div key={ev.id} className="p-2 bg-purple-50 rounded border border-purple-100 text-xs">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-bold mr-1">TWG</span>
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

                    {/* BAC Evaluations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><BarChart3 className="w-4 h-4 text-blue-500" /> BAC Member Evaluations ({summary.bac_evaluations?.length || 0})</h4>
                      {(summary.bac_evaluations || []).length === 0 ? (
                        <p className="text-xs text-gray-500">No BAC evaluations submitted yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {summary.bac_evaluations.map(ev => (
                            <div key={ev.id} className="p-2 bg-blue-50 rounded border border-blue-100 text-xs">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold mr-1">BAC</span>
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

                    {/* Ranked Bidders */}
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

                    {/* Document Version History */}
                    <DocumentVersionHistory entityType="App\\Models\\BidOpening" entityId={session.id} />

                    {/* Secretariat Actions */}
                    <div className="pt-2 border-t border-gray-200 flex gap-2">
                      {(!summary.summary || summary.summary.status === 'in_progress') && (
                        <button onClick={generateAbstract} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                          <FileUp className="w-3.5 h-3.5" /> Generate Abstract
                        </button>
                      )}
                      {summary.summary?.status === 'pending_chairperson_review' && (
                        <button onClick={submitToChair} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Submit to Chairperson
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EvaluationsPage;
