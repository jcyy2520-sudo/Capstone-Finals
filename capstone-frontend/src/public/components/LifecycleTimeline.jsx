import { CheckCircle2, Circle, Loader2, Clock, Hash, ChevronDown, User, MousePointerClick, FileText, Link2, Banknote, Shield } from 'lucide-react';
import { useState } from 'react';

/**
 * Full lifecycle timeline showing completed, current, and pending milestones.
 * Click any completed/current milestone to view detailed information.
 */
export default function LifecycleTimeline({ lifecycle, subEvents, bids }) {
  const [openStep, setOpenStep] = useState(null);

  if (!lifecycle || lifecycle.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No lifecycle data available.</p>;
  }

  const subEventsByMilestone = groupSubEvents(lifecycle, subEvents);

  return (
    <div className="relative">
      {/* Hint for users */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 pb-3 border-b border-slate-100">
        <MousePointerClick size={12} />
        <span>Click on any completed or active step to view full details</span>
      </div>

      {lifecycle.map((step, index) => (
        <MilestoneStep
          key={step.event}
          step={step}
          index={index}
          isLast={index === lifecycle.length - 1}
          subEvents={subEventsByMilestone[step.event] || []}
          bids={step.event === 'BID_OPENING_COMPLETED' ? bids : null}
          isOpen={openStep === step.event}
          onToggle={() => setOpenStep(openStep === step.event ? null : step.event)}
        />
      ))}
    </div>
  );
}

function MilestoneStep({ step, index, isLast, subEvents, bids, isOpen, onToggle }) {
  const isClickable = step.status === 'completed' || step.status === 'current';

  const statusStyles = {
    completed: {
      icon: <CheckCircle2 size={20} className="text-emerald-600" />,
      line: 'bg-emerald-300',
      bg: 'bg-emerald-50/60',
      bgHover: 'hover:bg-emerald-50',
      border: 'border-emerald-200',
      activeBorder: 'border-emerald-400 ring-1 ring-emerald-100',
      text: 'text-slate-900',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    current: {
      icon: <Loader2 size={20} className="text-blue-600 animate-spin" />,
      line: 'bg-slate-200',
      bg: 'bg-blue-50/60',
      bgHover: 'hover:bg-blue-50',
      border: 'border-blue-200',
      activeBorder: 'border-blue-400 ring-1 ring-blue-100',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-700',
    },
    pending: {
      icon: <Circle size={20} className="text-slate-300" />,
      line: 'bg-slate-200',
      bg: 'bg-white',
      bgHover: '',
      border: 'border-slate-200',
      activeBorder: '',
      text: 'text-slate-400',
      badge: 'bg-slate-100 text-slate-400',
    },
  };

  const s = statusStyles[step.status] || statusStyles.pending;

  return (
    <div className="flex gap-4">
      {/* Vertical timeline connector */}
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className="shrink-0">{s.icon}</div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[24px] ${
            step.status === 'completed' ? s.line : 'bg-slate-200'
          }`} />
        )}
      </div>

      {/* Milestone content */}
      <div className={`flex-1 min-w-0 pb-6 ${isLast ? 'pb-0' : ''}`}>
        {/* Clickable milestone bar */}
        <button
          type="button"
          onClick={isClickable ? onToggle : undefined}
          disabled={!isClickable}
          className={`w-full text-left rounded-lg border p-3 transition-all ${s.bg} ${
            isOpen ? s.activeBorder : s.border
          } ${isClickable ? `${s.bgHover} cursor-pointer` : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-sm font-semibold ${s.text}`}>{step.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.badge}`}>
                {step.status === 'completed' ? 'Done' : step.status === 'current' ? 'In Progress' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {step.completed_at && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(step.completed_at).toLocaleDateString('en-PH', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
              {isClickable && (
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
              )}
            </div>
          </div>
        </button>

        {/* Expanded detail panel */}
        {isOpen && isClickable && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
            {/* Detail grid */}
            <div className="p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} />
                Step Details
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <DetailRow label="Event" value={step.event.replace(/_/g, ' ')} />
                <DetailRow label="Status" value={step.status === 'completed' ? 'Completed' : 'In Progress'} highlight={step.status === 'completed' ? 'emerald' : 'blue'} />
                {step.actor_name && (
                  <DetailRow
                    label="Performed By"
                    value={`${step.actor_name}${step.actor_role ? ` — ${step.actor_role}` : ''}`}
                    icon={<User size={11} />}
                  />
                )}
                {step.actor_role && (
                  <DetailRow label="Role" value={step.actor_role} icon={<Shield size={11} />} />
                )}
                {step.completed_at && (
                  <DetailRow
                    label="Date & Time"
                    value={new Date(step.completed_at).toLocaleString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    icon={<Clock size={11} />}
                  />
                )}
                {step.budget_amount && (
                  <DetailRow
                    label="Approved Budget (ABC)"
                    value={new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(step.budget_amount)}
                    icon={<Banknote size={11} />}
                    highlight="blue"
                  />
                )}
                {step.contract_amount && (
                  <DetailRow
                    label="Contract Amount"
                    value={new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(step.contract_amount)}
                    icon={<Banknote size={11} />}
                    highlight="emerald"
                  />
                )}
              </div>

              {/* Blockchain proof */}
              {(step.block_hash || step.eth_tx_hash) && (
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Link2 size={12} />
                    Blockchain Proof
                  </h4>
                  <div className="space-y-1.5">
                    {step.block_hash && (
                      <div className="flex items-center gap-2">
                        <Hash size={11} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500">Block Hash:</span>
                        <code className="text-[10px] text-slate-600 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">
                          {step.block_hash}
                        </code>
                      </div>
                    )}
                    {step.eth_tx_hash && (
                      <div className="flex items-center gap-2">
                        <Hash size={11} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-slate-500">ETH Tx:</span>
                        <code className="text-[10px] text-emerald-600 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">
                          {step.eth_tx_hash}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-events section */}
            {subEvents.length > 0 && (
              <div className="border-t border-slate-200 p-4">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Related Activities ({subEvents.length})
                </h4>
                <div className="space-y-1.5">
                  {subEvents.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-500 bg-white rounded px-2.5 py-1.5 border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                      <span className="font-medium text-slate-600">{sub.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-slate-300">·</span>
                      <span>{sub.actor_name}</span>
                      {sub.actor_role && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{sub.actor_role}</span>
                      )}
                      <span className="ml-auto text-[10px] text-slate-400">
                        {new Date(sub.recorded_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bids section (under Bid Opening) */}
            {bids && bids.length > 0 && (
              <div className="border-t border-slate-200 p-4">
                <BidsInline bids={bids} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, highlight }) {
  const colorMap = {
    emerald: 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded',
    blue: 'text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded',
  };
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${highlight ? colorMap[highlight] : 'text-slate-700'}`}>
        {icon} {value || 'N/A'}
      </p>
    </div>
  );
}

function BidsInline({ bids }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Bids Received ({bids.length})
      </h4>
      <div className="space-y-1">
        {bids.map((bid, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px] bg-white rounded px-2.5 py-1.5 border border-slate-100">
            <span className={`font-medium ${bid.is_winner ? 'text-emerald-700' : 'text-slate-600'}`}>
              {bid.is_winner && '🏆 '}{bid.vendor_name}
            </span>
            <span className="font-mono text-slate-500">
              {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(bid.bid_amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Groups sub-events to the nearest preceding completed milestone.
 */
function groupSubEvents(lifecycle, subEvents) {
  if (!subEvents || subEvents.length === 0) return {};

  const groups = {};
  const completedMilestones = lifecycle
    .filter(s => s.status === 'completed')
    .map(s => ({ event: s.event, time: s.completed_at ? new Date(s.completed_at).getTime() : 0 }));

  for (const sub of subEvents) {
    const subTime = new Date(sub.recorded_at).getTime();
    let bestMilestone = completedMilestones[0]?.event || lifecycle[0]?.event;

    // Find the closest milestone that occurred before or at the same time
    for (const m of completedMilestones) {
      if (m.time <= subTime) bestMilestone = m.event;
      else break;
    }

    if (!groups[bestMilestone]) groups[bestMilestone] = [];
    groups[bestMilestone].push(sub);
  }

  return groups;
}
