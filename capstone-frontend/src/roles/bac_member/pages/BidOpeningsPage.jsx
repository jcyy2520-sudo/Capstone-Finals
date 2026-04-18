import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { Gavel, ChevronDown, ChevronUp, Users, FileCheck, DollarSign, AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
  scheduled: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  postponed: 'bg-orange-100 text-orange-800',
};

function BidOpeningsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bid-openings');
      setSessions(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/bid-openings/${id}`);
      setDetail(res.data);
    } catch { /* silent */ }
    finally { setDetailLoading(false); }
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); }
    else { setExpandedId(id); fetchDetail(id); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Gavel className="w-6 h-6 text-blue-600" /> Bid Opening Sessions
        </h1>
        <p className="text-gray-500 text-sm mt-1">View bid opening sessions and results (read-only).</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No bid opening sessions</p>
          </div>
        ) : sessions.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(session.id)}>
              <div>
                <p className="font-semibold text-gray-900">{session.session_reference}</p>
                <p className="text-xs text-gray-500">{session.invitation?.reference_number || '—'} &middot; {new Date(session.session_date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-800'}`}>
                  {session.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                {expandedId === session.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {expandedId === session.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                {detailLoading ? <p className="text-sm text-gray-500">Loading...</p> : detail ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500 block">Quorum</span><span className="font-medium">{detail.quorum_confirmed ? '✅ Confirmed' : '❌ Not met'}</span></div>
                      <div><span className="text-gray-500 block">BAC Members</span><span className="font-medium">{(detail.bac_members_present || []).length}</span></div>
                      <div><span className="text-gray-500 block">Conductor</span><span className="font-medium">{detail.conductor?.name || '—'}</span></div>
                      <div><span className="text-gray-500 block">Closed At</span><span className="font-medium">{detail.closed_at ? new Date(detail.closed_at).toLocaleString() : '—'}</span></div>
                    </div>

                    {(detail.attendance || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><Users className="w-4 h-4" /> Bidder Attendance</h4>
                        <div className="flex flex-wrap gap-2">
                          {detail.attendance.map(a => (
                            <span key={a.id} className={`px-2 py-0.5 rounded text-xs font-medium ${a.present ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {a.vendor?.business_name || `Vendor #${a.vendor_id}`}: {a.present ? 'Present' : 'Absent'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(detail.eligibility_results || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><FileCheck className="w-4 h-4" /> Eligibility Results</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border border-gray-200 rounded">
                            <thead className="bg-gray-100"><tr>
                              <th className="px-3 py-1.5 text-left">Vendor</th><th className="px-3 py-1.5 text-left">Document</th>
                              <th className="px-3 py-1.5 text-center">Result</th><th className="px-3 py-1.5 text-center">Overall</th>
                              <th className="px-3 py-1.5 text-left">Remarks</th>
                            </tr></thead>
                            <tbody>
                              {detail.eligibility_results.map(r => (
                                <tr key={r.id} className="border-t border-gray-100">
                                  <td className="px-3 py-1.5">{r.vendor?.business_name || `#${r.vendor_id}`}</td>
                                  <td className="px-3 py-1.5">{r.doc_type}</td>
                                  <td className={`px-3 py-1.5 text-center font-bold ${r.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>{r.result.toUpperCase()}</td>
                                  <td className={`px-3 py-1.5 text-center font-bold ${r.overall_eligible ? 'text-green-600' : 'text-red-600'}`}>{r.overall_eligible ? 'ELIGIBLE' : 'INELIGIBLE'}</td>
                                  <td className="px-3 py-1.5 text-gray-500">{r.remarks || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(detail.bid_prices || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Bid Prices As Read</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border border-gray-200 rounded">
                            <thead className="bg-gray-100"><tr>
                              <th className="px-3 py-1.5 text-center">Rank</th><th className="px-3 py-1.5 text-left">Vendor</th>
                              <th className="px-3 py-1.5 text-right">As Read</th><th className="px-3 py-1.5 text-right">As Calculated</th>
                              <th className="px-3 py-1.5 text-left">Correction</th>
                            </tr></thead>
                            <tbody>
                              {[...detail.bid_prices].sort((a, b) => (a.rank || 999) - (b.rank || 999)).map(p => (
                                <tr key={p.id} className="border-t border-gray-100">
                                  <td className="px-3 py-1.5 text-center font-bold">{p.rank || '—'}</td>
                                  <td className="px-3 py-1.5">{p.vendor?.business_name || `#${p.vendor_id}`}</td>
                                  <td className="px-3 py-1.5 text-right">₱{Number(p.amount_as_read).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-3 py-1.5 text-right">₱{Number(p.amount_as_calculated).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-3 py-1.5 text-gray-500">{p.arithmetic_correction || 'None'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {detail.failure_declared && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                        <p className="font-semibold text-red-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Failure of Bidding Declared</p>
                        <p className="text-red-700 mt-1">{detail.failure_grounds}</p>
                      </div>
                    )}
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

export default BidOpeningsPage;

