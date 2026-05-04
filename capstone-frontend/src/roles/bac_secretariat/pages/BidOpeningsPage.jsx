import toast from '../../../utils/toast';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';
import { Gavel, Users, FileCheck, DollarSign, FileText, XCircle, ChevronDown, ChevronUp, AlertTriangle, Download } from 'lucide-react';

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

  // Start session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [bacMembers, setBacMembers] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState('');
  const [selectedBacMembers, setSelectedBacMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Eligibility modal
  const [showEligModal, setShowEligModal] = useState(false);
  const [eligVendors, setEligVendors] = useState([]);
  const [eligResults, setEligResults] = useState([]);

  // Bid price modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceEntries, setPriceEntries] = useState([]);

  // Failure modal
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureGrounds, setFailureGrounds] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bid-openings');
      setSessions(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/bid-openings/${id}`);
      setDetail(res.data);
    } catch { toast.error('Failed to load session details'); }
    finally { setDetailLoading(false); }
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); }
    else { setExpandedId(id); fetchDetail(id); }
  };

  // ── Start Session ──
  const openStartModal = async () => {
    setShowStartModal(true);
    try {
      const [usersRes, invRes] = await Promise.all([
        api.get('/committee-members'),
        api.get('/invitations', { params: { status: 'posted' } }),
      ]);
      const allUsers = usersRes.data?.data || usersRes.data || [];
      setBacMembers(allUsers.filter(u => ['bac_chairperson', 'bac_member', 'bac_secretariat'].includes(u.role?.name)));
      setInvitations(invRes.data?.data || []);
    } catch { toast.error('Failed to load dependencies'); }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (selectedBacMembers.length < 3) { toast.error('Minimum 3 BAC members for quorum.'); return; }
    if (!selectedInvitation) { toast.error('Select an invitation.'); return; }
    setSubmitting(true);
    try {
      await api.post('/bid-openings/start', {
        invitation_id: parseInt(selectedInvitation),
        bac_members_present: selectedBacMembers.map(Number),
      });
      toast.success('Bid opening session started.');
      setShowStartModal(false); setSelectedInvitation(''); setSelectedBacMembers([]);
      fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start session'); }
    finally { setSubmitting(false); }
  };

  // ── Eligibility ──
  const openEligModal = (session) => {
    const vendors = (session.attendance || detail?.attendance || []).map(a => ({
      vendor_id: a.vendor_id,
      name: a.vendor?.business_name || `Vendor #${a.vendor_id}`,
    }));
    // Also include vendors from existing eligibility results
    const existingResults = detail?.eligibility_results || [];
    const seen = new Set(vendors.map(v => v.vendor_id));
    existingResults.forEach(r => {
      if (!seen.has(r.vendor_id)) {
        vendors.push({ vendor_id: r.vendor_id, name: r.vendor?.business_name || `Vendor #${r.vendor_id}` });
        seen.add(r.vendor_id);
      }
    });
    setEligVendors(vendors.length > 0 ? vendors : [{ vendor_id: '', name: '' }]);
    // Pre-populate from existing results
    setEligResults(existingResults.length > 0
      ? existingResults.map(r => ({ vendor_id: r.vendor_id, doc_type: r.doc_type, result: r.result, remarks: r.remarks || '', overall_eligible: r.overall_eligible }))
      : [{ vendor_id: '', doc_type: '', result: 'pass', remarks: '', overall_eligible: true }]
    );
    setShowEligModal(true);
  };

  const addEligRow = () => setEligResults([...eligResults, { vendor_id: '', doc_type: '', result: 'pass', remarks: '', overall_eligible: true }]);
  const updateEligRow = (i, field, val) => { const u = [...eligResults]; u[i][field] = field === 'overall_eligible' ? val === 'true' || val === true : val; setEligResults(u); };
  const removeEligRow = (i) => setEligResults(eligResults.filter((_, idx) => idx !== i));

  const submitEligibility = async () => {
    if (eligResults.some(r => !r.vendor_id || !r.doc_type)) { toast.error('Fill all vendor/doc_type fields.'); return; }
    setSubmitting(true);
    try {
      await api.put(`/bid-openings/${expandedId}/eligibility`, { results: eligResults });
      toast.success('Eligibility results saved.');
      setShowEligModal(false); fetchDetail(expandedId); fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save eligibility'); }
    finally { setSubmitting(false); }
  };

  // ── Bid Prices ──
  const openPriceModal = () => {
    const eligible = (detail?.eligibility_results || []).filter(r => r.overall_eligible);
    const uniqueVendors = [...new Map(eligible.map(r => [r.vendor_id, r])).values()];
    const existingPrices = detail?.bid_prices || [];
    setPriceEntries(uniqueVendors.map(v => {
      const existing = existingPrices.find(p => p.vendor_id === v.vendor_id);
      return {
        vendor_id: v.vendor_id,
        name: v.vendor?.business_name || `Vendor #${v.vendor_id}`,
        amount_as_read: existing?.amount_as_read || '',
      };
    }));
    setShowPriceModal(true);
  };
  const updatePrice = (i, val) => { const u = [...priceEntries]; u[i].amount_as_read = val; setPriceEntries(u); };

  const submitPrices = async () => {
    const prices = priceEntries.filter(p => p.amount_as_read !== '').map(p => ({ vendor_id: p.vendor_id, amount_as_read: parseFloat(p.amount_as_read) }));
    if (prices.length === 0) { toast.error('Enter at least one bid price.'); return; }
    setSubmitting(true);
    try {
      await api.put(`/bid-openings/${expandedId}/bid-price`, { prices });
      toast.success('Bid prices recorded.');
      setShowPriceModal(false); fetchDetail(expandedId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save prices'); }
    finally { setSubmitting(false); }
  };

  // ── Generate Abstract ──
  const generateAbstract = async (id) => {
    try {
      const res = await api.post(`/bid-openings/${id}/generate-abstract`);
      toast.success('Abstract generated. Hash: ' + res.data.abstract_hash?.substring(0, 12) + '...');
      if (res.data.download_url && res.data.download_url !== '#') {
        window.open(res.data.download_url, '_blank');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate abstract'); }
  };

  // ── Close Session ──
  const closeSession = async (id) => {
    if (!window.confirm('Close this bid opening session? This will auto-rank bid prices and lock all entries.')) return;
    try {
      await api.post(`/bid-openings/${id}/close`);
      toast.success('Session closed and bid prices ranked.');
      fetchSessions(); if (expandedId === id) fetchDetail(id);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to close session'); }
  };

  // ── Declare Failure ──
  const submitFailure = async () => {
    if (failureGrounds.length < 50) { toast.error('Grounds must be at least 50 characters.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/bid-openings/${expandedId}/failure`, { failure_grounds: failureGrounds });
      toast.success('Failure of bidding declared.');
      setShowFailureModal(false); setFailureGrounds(''); fetchSessions(); fetchDetail(expandedId);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to declare failure'); }
    finally { setSubmitting(false); }
  };

  const inProgressCount = sessions.filter(s => s.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Gavel className="w-6 h-6 text-blue-600" /> Bid Opening Sessions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Start sessions, check eligibility, record bid prices, and generate abstracts.</p>
        </div>
        <div className="flex items-center gap-3">
          {inProgressCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">{inProgressCount} In Progress</span>
          )}
          <button onClick={openStartModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
            <Gavel className="w-4 h-4" /> Start New Session
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No bid opening sessions yet</p>
            <p className="text-sm mt-1">Start a session from a posted invitation.</p>
          </div>
        ) : sessions.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Session Header Row */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(session.id)}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{session.session_reference}</p>
                  <p className="text-xs text-gray-500">{session.invitation?.reference_number || '—'} &middot; {new Date(session.session_date).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-800'}`}>
                  {session.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                {expandedId === session.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedId === session.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                {detailLoading ? (
                  <p className="text-sm text-gray-500">Loading details...</p>
                ) : detail ? (
                  <>
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500 block">Quorum</span><span className="font-medium">{detail.quorum_confirmed ? '✅ Confirmed' : '❌ Not met'}</span></div>
                      <div><span className="text-gray-500 block">BAC Members</span><span className="font-medium">{(detail.bac_members_present || []).length}</span></div>
                      <div><span className="text-gray-500 block">Conductor</span><span className="font-medium">{detail.conductor?.name || '—'}</span></div>
                      <div><span className="text-gray-500 block">Closed At</span><span className="font-medium">{detail.closed_at ? new Date(detail.closed_at).toLocaleString() : '—'}</span></div>
                    </div>

                    {/* Attendance */}
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

                    {/* Eligibility Results */}
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

                    {/* Bid Prices */}
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

                    {/* Failure info */}
                    {detail.failure_declared && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                        <p className="font-semibold text-red-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Failure of Bidding Declared</p>
                        <p className="text-red-700 mt-1">{detail.failure_grounds}</p>
                      </div>
                    )}

                    {/* Document Version History */}
                    <DocumentVersionHistory entityType="App\\Models\\BidOpening" entityId={session.id} />

                    {/* Action Buttons (only for in_progress) */}
                    {session.status === 'in_progress' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                        <button onClick={() => openEligModal(session)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" /> Update Eligibility
                        </button>
                        <button onClick={openPriceModal} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 flex items-center gap-1" disabled={!(detail?.eligibility_results || []).some(r => r.overall_eligible)}>
                          <DollarSign className="w-3.5 h-3.5" /> Record Bid Prices
                        </button>
                        <button onClick={() => generateAbstract(session.id)} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> Generate Abstract
                        </button>
                        <button onClick={() => closeSession(session.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Close Session
                        </button>
                        <button onClick={() => { setShowFailureModal(true); setFailureGrounds(''); }} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Declare Failure
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

      {/* ── Start Session Modal ── */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Start Bid Opening Session</h3>
              <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleStartSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posted Invitation</label>
                <select required value={selectedInvitation} onChange={e => setSelectedInvitation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select invitation...</option>
                  {invitations.map(inv => <option key={inv.id} value={inv.id}>{inv.reference_number} — {inv.procurement_mode?.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BAC Members Present (min 3 for quorum)</label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {bacMembers.length === 0 ? <p className="text-sm text-gray-500">Loading...</p> : bacMembers.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" value={m.id} checked={selectedBacMembers.includes(m.id.toString())}
                        onChange={e => { const v = e.target.value; setSelectedBacMembers(e.target.checked ? [...selectedBacMembers, v] : selectedBacMembers.filter(x => x !== v)); }}
                        className="rounded text-blue-600 h-4 w-4" />
                      {m.name} <span className="text-gray-400">({m.role?.display_name || m.role?.name})</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedBacMembers.length} selected</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStartModal(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Eligibility Modal ── */}
      {showEligModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Update Eligibility Results</h3>
              <button onClick={() => setShowEligModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {eligResults.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs font-medium text-gray-500">Vendor</label>}
                    <select value={row.vendor_id} onChange={e => updateEligRow(i, 'vendor_id', parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="">Select...</option>
                      {eligVendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs font-medium text-gray-500">Doc Type</label>}
                    <input value={row.doc_type} onChange={e => updateEligRow(i, 'doc_type', e.target.value)} placeholder="e.g. PhilGEPS Cert"
                      className="w-full px-2 py-1.5 border rounded text-sm" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs font-medium text-gray-500">Result</label>}
                    <select value={row.result} onChange={e => updateEligRow(i, 'result', e.target.value)}
                      className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="pass">Pass</option><option value="fail">Fail</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs font-medium text-gray-500">Overall</label>}
                    <select value={row.overall_eligible.toString()} onChange={e => updateEligRow(i, 'overall_eligible', e.target.value)}
                      className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="true">Eligible</option><option value="false">Ineligible</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => removeEligRow(i)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                  </div>
                </div>
              ))}
              <button onClick={addEligRow} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Row</button>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setShowEligModal(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
              <button onClick={submitEligibility} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Eligibility'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bid Price Modal ── */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Record Bid Prices</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-3">
              {priceEntries.length === 0 ? (
                <p className="text-sm text-gray-500">No eligible vendors found. Update eligibility first.</p>
              ) : priceEntries.map((entry, i) => (
                <div key={entry.vendor_id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-40 truncate">{entry.name}</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                    <input type="number" step="0.01" min="0" value={entry.amount_as_read} onChange={e => updatePrice(i, e.target.value)}
                      placeholder="0.00" className="w-full pl-7 pr-3 py-2 border rounded text-sm" />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setShowPriceModal(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
              <button onClick={submitPrices} disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Failure Modal ── */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b bg-red-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-800">Declare Failure of Bidding</h3>
              <button onClick={() => setShowFailureModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">Provide detailed grounds for declaring failure (min 50 characters).</p>
              <textarea value={failureGrounds} onChange={e => setFailureGrounds(e.target.value)} rows={4} placeholder="State the grounds..."
                className="w-full px-3 py-2 border rounded text-sm" />
              <p className="text-xs text-gray-400">{failureGrounds.length}/50 characters minimum</p>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setShowFailureModal(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
              <button onClick={submitFailure} disabled={submitting || failureGrounds.length < 50} className="px-4 py-2 bg-red-600 text-white rounded-md text-[13px] font-medium hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Declaring...' : 'Declare Failure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BidOpeningsPage;
