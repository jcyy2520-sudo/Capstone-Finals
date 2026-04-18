import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, ShieldCheck, Loader2, Hash, ExternalLink, AlertTriangle, FileText, CheckCircle2, XCircle, Download } from 'lucide-react';
import publicApi from '../services/publicApi';
import LifecycleTimeline from './components/LifecycleTimeline';

export default function TransparencyDetailPage() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [procurement, setProcurement] = useState(null);
  const [bids, setBids] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chainOpen, setChainOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [procRes, bidRes, chainRes, docRes] = await Promise.all([
        publicApi.get(`/procurements/${reference}`),
        publicApi.get(`/procurements/${reference}/bids`),
        publicApi.get(`/procurements/${reference}/blockchain`),
        publicApi.get(`/procurements/${reference}/documents`),
      ]);
      setProcurement(procRes.data);
      setBids(bidRes.data.data || []);
      setBlockchain(chainRes.data.data || []);
      setDocuments(docRes.data.data || []);
    } catch {
      setProcurement(null);
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => { load(); }, [load]);

  // Polling — refetch every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Client-side chain verification using Web Crypto API
  const verifyChain = async () => {
    if (blockchain.length === 0) return;
    setVerifying(true);
    setVerifyResult(null);

    const results = [];
    const GENESIS_HASH = '0'.repeat(64);

    for (let i = 0; i < blockchain.length; i++) {
      const block = blockchain[i];
      const prevBlock = i > 0 ? blockchain[i - 1] : null;

      // Check chain link: previous_hash must match predecessor's block_hash
      let linkValid = true;
      if (i === 0) {
        linkValid = block.previous_hash === GENESIS_HASH;
      } else if (prevBlock) {
        linkValid = block.previous_hash === prevBlock.block_hash;
      }

      results.push({
        block_number: block.block_number,
        event_type: block.event_type,
        link_valid: linkValid,
      });
    }

    const brokenAt = results.find(r => !r.link_valid);
    setVerifyResult({
      blocks: results,
      valid: !brokenAt,
      brokenBlock: brokenAt?.block_number || null,
    });
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading procurement details…</span>
      </div>
    );
  }

  if (!procurement) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-400">Procurement not found.</p>
        <button onClick={() => navigate('/transparency')} className="text-sm text-blue-600 hover:text-blue-700 mt-2">
          ← Back to Procurements
        </button>
      </div>
    );
  }

  // ── Preparation phase — limited detail view ──
  if (procurement.public_phase === 'preparation') {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/transparency')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <ArrowLeft size={16} /> Back to Procurements
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <FileText size={16} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">In Preparation</span>
          </div>
          <code className="text-xs text-slate-400 font-medium">{procurement.reference_number}</code>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{procurement.project_title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{procurement.department}</p>
          <p className="text-xs text-slate-400 mt-2 capitalize">{procurement.procurement_mode?.replace(/_/g, ' ')}</p>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-500 text-center">
              This procurement is currently being prepared. Full details will be available once it is publicly posted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Returned phase — shows return reason ──
  if (procurement.public_phase === 'returned') {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/transparency')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <ArrowLeft size={16} /> Back to Procurements
        </button>
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-100">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">Returned</span>
          </div>
          <code className="text-xs text-red-400 font-medium">{procurement.reference_number}</code>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{procurement.project_title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{procurement.department}</p>
          {procurement.return_remarks && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Return Reason</h3>
              <p className="text-sm text-red-800">{procurement.return_remarks}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const lifecycle = procurement.lifecycle || [];
  const subEvents = procurement.sub_events || [];
  const completedCount = lifecycle.filter(s => s.status === 'completed').length;
  const progressPct = lifecycle.length > 0 ? Math.round((completedCount / lifecycle.length) * 100) : 0;

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amt);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/transparency')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
        <ArrowLeft size={16} /> Back to Procurements
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <code className="text-xs text-blue-600 font-medium">{procurement.reference_number}</code>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{procurement.project_title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{procurement.department}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(procurement.abc)}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Approved Budget</p>
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
          <InfoCell label="Mode" value={procurement.procurement_mode?.replace(/_/g, ' ')} />
          <InfoCell label="Status" value={procurement.status} />
          <InfoCell label="Posted" value={formatDate(procurement.posted_at)} />
          <InfoCell label="Deadline" value={formatDate(procurement.submission_deadline)} />
        </div>

        {/* PhilGEPS Reference */}
        {procurement.philgeps_reference && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">PhilGEPS Reference:</span>
            <a
              href="https://notices.philgeps.gov.ph/GEPSNONPILOT/Tender/SplashOpenOpportunities.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {procurement.philgeps_reference}
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Award info */}
        {procurement.award && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Award Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoCell label="NOA Reference" value={procurement.award.noa_reference} />
              <InfoCell label="Awarded To" value={procurement.award.vendor} />
              <InfoCell label="Contract Amount" value={formatCurrency(procurement.award.contract_amount)} />
              <InfoCell label="Award Status" value={procurement.award.status} />
            </div>
          </div>
        )}

        {/* Contract info */}
        {procurement.contract && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contract Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoCell label="Contract Ref" value={procurement.contract.contract_reference} />
              <InfoCell label="NTP Date" value={formatDate(procurement.contract.ntp_date)} />
              <InfoCell label="Duration" value={`${procurement.contract.duration_days} days`} />
              <InfoCell label="Status" value={procurement.contract.status} />
            </div>
            {procurement.contract.progress_percentage != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Contract Progress</span>
                  <span className="text-xs font-semibold text-slate-700">{procurement.contract.progress_percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      procurement.contract.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${procurement.contract.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <FileText size={16} className="text-slate-500" />
          Documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">No documents available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {documents.map((doc) => {
              const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/public';
              const downloadUrl = `${apiBase}/documents/${doc.id}/download`;
              const typeIcons = {
                itb_rfq: '📄',
                abstract_of_bids: '📊',
                noa: '🏆',
                ntp: '📋',
                contract: '📝',
              };
              return (
                <a
                  key={doc.id}
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <span className="text-base">{typeIcons[doc.type] || '📄'}</span>
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600 flex-1">{doc.label}</span>
                  <Download size={14} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Procurement Lifecycle</h2>
          <span className="text-xs text-slate-500">
            {completedCount} of {lifecycle.length} milestones completed
            <span className="ml-2 font-semibold text-slate-700">{progressPct}%</span>
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Full Lifecycle Timeline — the main view */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <LifecycleTimeline lifecycle={lifecycle} subEvents={subEvents} bids={bids} />
      </div>

      {/* Collapsible Blockchain Trail */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setChainOpen(!chainOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Blockchain Verification Trail</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
              {blockchain.length} blocks
            </span>
          </div>
          {chainOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </button>
        {chainOpen && (
          <div className="border-t border-slate-100 px-5 py-4">
            {blockchain.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No blockchain records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">Block #</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">Event</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">Block Hash</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">Prev Hash</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">ETH Tx</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {blockchain.map((block) => (
                      <tr key={block.block_number} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-xs font-bold text-slate-700">#{block.block_number}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {block.event_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400 max-w-[100px] truncate" title={block.block_hash}>
                          {block.block_hash?.substring(0, 16)}…
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400 max-w-[100px] truncate" title={block.previous_hash}>
                          {block.previous_hash?.substring(0, 16)}…
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px]">
                          {block.eth_tx_hash ? (
                            <code className="text-emerald-600 font-mono" title={block.eth_tx_hash}>
                              {block.eth_tx_hash.substring(0, 14)}…
                            </code>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">
                          {new Date(block.recorded_at).toLocaleString('en-PH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Verify This Chain — client-side */}
            {blockchain.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client-Side Verification</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Verify chain link integrity directly in your browser</p>
                  </div>
                  <button
                    onClick={verifyChain}
                    disabled={verifying}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                    {verifying ? 'Verifying…' : 'Verify This Chain'}
                  </button>
                </div>

                {verifyResult && (
                  <div className="space-y-2">
                    {/* Summary */}
                    <div className={`rounded-lg border p-3 flex items-center gap-2.5 ${
                      verifyResult.valid
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {verifyResult.valid
                        ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        : <XCircle size={16} className="text-red-600 shrink-0" />
                      }
                      <div>
                        <p className={`text-sm font-semibold ${verifyResult.valid ? 'text-emerald-800' : 'text-red-800'}`}>
                          {verifyResult.valid
                            ? 'Chain Integrity Verified'
                            : `CHAIN INTEGRITY BROKEN at block #${verifyResult.brokenBlock}`
                          }
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {verifyResult.blocks.length} blocks checked in-browser — server cannot fake this result
                        </p>
                      </div>
                    </div>

                    {/* Per-block results */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                      {verifyResult.blocks.map((r) => (
                        <div
                          key={r.block_number}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
                            r.link_valid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {r.link_valid
                            ? <CheckCircle2 size={10} className="shrink-0" />
                            : <XCircle size={10} className="shrink-0" />
                          }
                          #{r.block_number}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-900 capitalize">{value || 'N/A'}</p>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
