import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock, TrendingDown, TrendingUp, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import publicApi from '../services/publicApi';
import SearchFilterBar from './components/SearchFilterBar';

export default function TransparencyPage() {
  const navigate = useNavigate();
  const [allProcurements, setAllProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;

      const procRes = await publicApi.get('/procurements', { params });
      setAllProcurements(procRes.data.data || []);
      setLastPage(procRes.data.last_page || 1);
    } catch {
      setAllProcurements([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  // Derive finished/pending per procurement
  const enriched = allProcurements.map((proc) => ({
    ...proc,
    isFinished: proc.public_phase === 'active' && proc.lifecycle_steps > 0 && proc.lifecycle_completed === proc.lifecycle_steps,
  }));

  // Filter by status
  const filtered = status === 'finished'
    ? enriched.filter((p) => p.isFinished)
    : status === 'pending'
      ? enriched.filter((p) => p.public_phase === 'active' && !p.isFinished)
      : status === 'preparation'
        ? enriched.filter((p) => p.public_phase === 'preparation')
        : status === 'returned'
          ? enriched.filter((p) => p.public_phase === 'returned')
          : enriched;

  // Sort: preparation first, then active pending, then finished, then returned
  const phaseOrder = { preparation: 0, active: 1, returned: 2 };
  const procurements = [...filtered].sort((a, b) => {
    const phaseA = phaseOrder[a.public_phase] ?? 1;
    const phaseB = phaseOrder[b.public_phase] ?? 1;
    if (phaseA !== phaseB) return phaseA - phaseB;
    if (a.isFinished === b.isFinished) return 0;
    return a.isFinished ? 1 : -1;
  });

  const modeLabels = {
    competitive_bidding: 'Competitive Bidding',
    limited_source_bidding: 'Limited Source',
    direct_contracting: 'Direct Contracting',
    shopping: 'Shopping',
    shopping_52_1a: 'Shopping (52.1a)',
    shopping_52_1b: 'Shopping (52.1b)',
    small_value_procurement: 'Small Value',
    negotiated_procurement: 'Negotiated',
    repeat_order: 'Repeat Order',
    public_bidding: 'Public Bidding',
    rfq: 'RFQ',
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center pt-2 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-4">
          <ShieldCheck size={14} />
          Blockchain-Verified Public Records
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Procurement Transparency Portal
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
          All government procurement transactions are secured through blockchain
          and publicly available for verification under RA 9184.
        </p>
      </div>

      {/* Search and Filter */}
      <SearchFilterBar
        search={search} onSearchChange={setSearch}
        status={status} onStatusChange={setStatus}
      />

      {/* Procurement Records — Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Procurement Records</h2>
          {!loading && (
            <span className="text-xs text-slate-400">{procurements.length} shown</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : procurements.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">No procurement records found.</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {procurements.map((proc) => {
              // ── Preparation Card (muted/gray) ──
              if (proc.public_phase === 'preparation') {
                return (
                  <div
                    key={proc.reference_number}
                    onClick={() => navigate(`/transparency/${proc.reference_number}`)}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm cursor-pointer transition-all group flex flex-col opacity-75"
                  >
                    <div className="-mx-4 -mt-4 mb-3 px-4 py-2 rounded-t-xl flex items-center gap-2 bg-slate-100 border-b border-slate-200">
                      <FileText size={14} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600">In Preparation</span>
                    </div>
                    <code className="text-[11px] text-slate-400 font-medium mb-1">{proc.reference_number}</code>
                    <h3 className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {proc.project_title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{proc.department}</p>
                    <span className="text-[10px] inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium w-fit">
                      {modeLabels[proc.procurement_mode] || proc.procurement_mode}
                    </span>
                  </div>
                );
              }

              // ── Returned Card (red/amber warning) ──
              if (proc.public_phase === 'returned') {
                return (
                  <div
                    key={proc.reference_number}
                    onClick={() => navigate(`/transparency/${proc.reference_number}`)}
                    className="bg-white rounded-xl border border-red-200 p-4 hover:shadow-sm cursor-pointer transition-all group flex flex-col"
                  >
                    <div className="-mx-4 -mt-4 mb-3 px-4 py-2 rounded-t-xl flex items-center gap-2 bg-red-50 border-b border-red-100">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs font-semibold text-red-700">Returned</span>
                    </div>
                    <code className="text-[11px] text-red-400 font-medium mb-1">{proc.reference_number}</code>
                    <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {proc.project_title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{proc.department}</p>
                    {proc.return_remarks && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg px-2.5 py-1.5 line-clamp-2">
                        {proc.return_remarks}
                      </p>
                    )}
                  </div>
                );
              }

              // ── Active Card (current design — posted and beyond) ──
              const pct = proc.lifecycle_steps > 0
                ? Math.round((proc.lifecycle_completed / proc.lifecycle_steps) * 100)
                : 0;
              return (
                <div
                  key={proc.reference_number}
                  onClick={() => navigate(`/transparency/${proc.reference_number}`)}
                  className={`bg-white rounded-xl border p-4 hover:shadow-sm cursor-pointer transition-all group flex flex-col ${
                    proc.isFinished ? 'border-emerald-200' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Finished / Pending banner */}
                  <div className={`-mx-4 -mt-4 mb-3 px-4 py-2 rounded-t-xl flex items-center gap-2 ${
                    proc.isFinished
                      ? 'bg-emerald-50 border-b border-emerald-100'
                      : 'bg-amber-50 border-b border-amber-100'
                  }`}>
                    {proc.isFinished ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Finished</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">
                          Pending — {proc.lifecycle_completed}/{proc.lifecycle_steps} steps done
                        </span>
                      </>
                    )}
                  </div>

                  {/* Reference */}
                  <code className="text-[11px] text-blue-600 font-medium mb-1">{proc.reference_number}</code>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {proc.project_title}
                  </h3>

                  {/* Department + Mode */}
                  <p className="text-xs text-slate-400 mt-1">{proc.department}</p>
                  <span className="text-[10px] inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium w-fit">
                    {modeLabels[proc.procurement_mode] || proc.procurement_mode}
                  </span>

                  {/* PhilGEPS badge */}
                  {proc.philgeps_reference && (
                    <span className="text-[10px] inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium w-fit">
                      <ExternalLink size={9} />
                      PhilGEPS: {proc.philgeps_reference}
                    </span>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Budget + bids */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(proc.abc)}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Approved Budget</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{proc.bid_count} bid(s)</p>
                        {proc.winner && (
                          <p className="text-[10px] text-emerald-600 font-medium truncate max-w-[120px]" title={proc.winner}>
                            ✓ {proc.winner}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Budget Comparison — only on finished cards with both values */}
                    {proc.isFinished && proc.abc > 0 && proc.contract_amount > 0 && (() => {
                      const savings = proc.abc - proc.contract_amount;
                      const isOverrun = savings < 0;
                      const absSavings = Math.abs(savings);
                      return (
                        <div className={`mt-2 px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[11px] ${
                          isOverrun ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isOverrun
                            ? <TrendingUp size={12} className="shrink-0" />
                            : <TrendingDown size={12} className="shrink-0" />
                          }
                          <span className="truncate">
                            ABC {formatCurrency(proc.abc)} → Contract {formatCurrency(proc.contract_amount)}
                          </span>
                          <span className={`ml-auto shrink-0 font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                            isOverrun ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOverrun ? `+${formatCurrency(absSavings)}` : `saved ${formatCurrency(absSavings)}`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Progress bar */}
                  {proc.lifecycle_steps > 0 && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${proc.isFinished ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
