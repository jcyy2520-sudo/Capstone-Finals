import { AlertTriangle, Clock3, ShieldCheck } from 'lucide-react';

const variants = {
  verified: {
    container: 'border-emerald-200 bg-emerald-50/80',
    iconWrap: 'bg-emerald-100',
    icon: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    message: 'text-emerald-900/80',
    meta: 'text-emerald-700/80',
    Icon: ShieldCheck,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/90',
    iconWrap: 'bg-amber-100',
    icon: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
    message: 'text-amber-900/80',
    meta: 'text-amber-700/80',
    Icon: AlertTriangle,
  },
  pending: {
    container: 'border-slate-200 bg-slate-50',
    iconWrap: 'bg-slate-200',
    icon: 'text-slate-600',
    badge: 'bg-white text-slate-700 border border-slate-200',
    message: 'text-slate-700',
    meta: 'text-slate-500',
    Icon: Clock3,
  },
};

export default function PublicIntegrityBadge({ integrityStatus, compact = false, className = '' }) {
  if (!integrityStatus) return null;

  const variant = variants[integrityStatus.state] || variants.pending;
  const Icon = variant.Icon;
  const padding = compact ? 'px-3 py-2.5' : 'px-3.5 py-3';
  const iconSize = compact ? 12 : 14;
  const messageSize = compact ? 'text-[11px]' : 'text-xs';

  return (
    <div className={`rounded-lg border ${variant.container} ${padding} ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 rounded-full p-1.5 ${variant.iconWrap}`}>
          <Icon size={iconSize} className={variant.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variant.badge}`}>
              {integrityStatus.label}
            </span>
            {integrityStatus.trail_blocks > 0 && (
              <span className={`text-[10px] font-medium ${variant.meta}`}>
                {integrityStatus.trail_blocks} blockchain record{integrityStatus.trail_blocks === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <p className={`mt-1 leading-relaxed ${messageSize} ${variant.message}`}>
            {integrityStatus.message}
          </p>
        </div>
      </div>
    </div>
  );
}