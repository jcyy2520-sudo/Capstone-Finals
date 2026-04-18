import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import Table from './Table';
import Badge from './Badge';

const summaryToneClasses = {
  blue: 'border-blue-200 bg-white text-blue-900',
  emerald: 'border-emerald-200 bg-white text-emerald-900',
  amber: 'border-amber-200 bg-white text-amber-900',
  rose: 'border-rose-200 bg-white text-rose-900',
  violet: 'border-violet-200 bg-white text-violet-900',
  cyan: 'border-cyan-200 bg-white text-cyan-900',
  slate: 'border-slate-200 bg-white text-slate-900',
};

const accentRingClasses = {
  blue: 'ring-blue-100',
  emerald: 'ring-emerald-100',
  amber: 'ring-amber-100',
  rose: 'ring-rose-100',
  violet: 'ring-violet-100',
  cyan: 'ring-cyan-100',
  slate: 'ring-slate-100',
};

const sectionHeaderClasses = {
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
  violet: 'text-violet-700',
  cyan: 'text-cyan-700',
  slate: 'text-slate-700',
};

const liveStatusToneMap = {
  ok: 'approved',
  success: 'approved',
  approved: 'approved',
  paid: 'approved',
  validated: 'approved',
  posted: 'approved',
  completed: 'approved',
  active: 'sent',
  in_progress: 'sent',
  progress: 'sent',
  queued: 'pending',
  pending: 'pending',
  review: 'pending',
  returned: 'rejected',
  failed: 'rejected',
  blocked: 'rejected',
  rejected: 'rejected',
  cancelled: 'rejected',
  canceled: 'rejected',
};

const liveTableColumns = [
  { header: 'Record', accessorKey: 'record' },
  { header: 'Context', accessorKey: 'context' },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <Badge status={row.original.statusTone}>{row.original.status}</Badge>,
  },
  { header: 'Updated', accessorKey: 'updated' },
  { header: 'Details', accessorKey: 'details' },
];

function formatMetricValue(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  if (value === null || value === undefined || value === '') {
    return '0';
  }

  return String(value);
}

function toStatusTone(status) {
  const normalized = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');

  if (!normalized) {
    return 'sent';
  }

  return liveStatusToneMap[normalized] || 'sent';
}

function formatDateTime(value) {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function buildLiveSummary(cards, fallbackTone = 'slate') {
  return (cards || []).map((card, index) => ({
    label: card?.label || `Metric ${index + 1}`,
    value: formatMetricValue(card?.value),
    note: card?.detail || card?.note || '',
    tone: card?.tone || fallbackTone,
  }));
}

function buildLiveSections(workspace, errorText) {
  const highlights = Array.isArray(workspace?.highlights) ? workspace.highlights : [];
  const actions = Array.isArray(workspace?.actions) ? workspace.actions : [];
  const sections = [];

  if (highlights.length > 0) {
    sections.push({
      label: 'Operational Highlights',
      title: 'Live workflow signals',
      description: 'Current role-scoped observations from the backend workspace summary.',
      items: highlights.map((item, index) => ({
        title: `Signal ${index + 1}`,
        description: item,
      })),
    });
  }

  if (actions.length > 0) {
    sections.push({
      label: 'Action Routes',
      title: 'Role quick actions',
      description: 'Allowed route targets aligned with role permissions.',
      items: actions.map((action) => ({
        title: action?.label || 'Action',
        description: action?.path || 'No route path provided.',
      })),
    });
  }

  if (errorText) {
    sections.push({
      label: 'Data Source Status',
      title: 'Live feed warning',
      description: errorText,
      items: [
        {
          title: 'Fallback mode active',
          description: 'The page is showing scaffold fallback content until live workspace data is available.',
          badge: { status: 'pending', label: 'Degraded' },
        },
      ],
    });
  }

  return sections;
}

function buildLiveTable(recent) {
  const rows = (recent || []).map((item, index) => ({
    id: item?.id || `${item?.title || 'record'}-${index}`,
    record: item?.title || 'Untitled record',
    context: item?.meta || 'No context',
    status: item?.status || 'Recorded',
    statusTone: toStatusTone(item?.status),
    updated: formatDateTime(item?.timestamp),
    details: item?.note || '-',
  }));

  return {
    label: 'Live activity feed',
    title: 'Recent role-scoped records',
    description: 'Latest backend events visible to your role and permissions.',
    columns: liveTableColumns,
    data: rows,
    loading: false,
  };
}

function SummaryCard({ item }) {
  const tone = summaryToneClasses[item.tone] || summaryToneClasses.slate;

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{item.label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold leading-tight">{item.value}</p>
          {item.note && <p className="mt-1 text-sm opacity-80">{item.note}</p>}
        </div>
        {item.badge && <Badge status={item.badge.status}>{item.badge.label}</Badge>}
      </div>
    </article>
  );
}

function SectionCard({ section }) {
  const headingTone = sectionHeaderClasses[section.tone] || sectionHeaderClasses.slate;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${headingTone}`}>{section.label || 'Module'}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{section.title}</h3>
          {section.description && <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>}
        </div>
        {section.badge && <Badge status={section.badge.status}>{section.badge.label}</Badge>}
      </div>

      {section.items && section.items.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {section.items.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  {item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}
                </div>
                {item.badge && <Badge status={item.badge.status}>{item.badge.label}</Badge>}
              </div>
              {item.meta && <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{item.meta}</p>}
            </article>
          ))}
        </div>
      )}

      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${headingTone.replace('text-', 'bg-')}`}></span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TableCard({ table }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{table.label || 'Queue'}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{table.title}</h3>
          {table.description && <p className="mt-2 text-sm leading-6 text-slate-500">{table.description}</p>}
        </div>
        {table.badge && <Badge status={table.badge.status}>{table.badge.label}</Badge>}
      </div>
      <Table columns={table.columns} data={table.data} loading={table.loading} pagination={table.pagination} onPageChange={table.onPageChange} />
    </section>
  );
}

function CalloutCard({ callout }) {
  const calloutTone = summaryToneClasses[callout.tone] || summaryToneClasses.slate;

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${calloutTone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{callout.label || 'Operational note'}</p>
      <h3 className="mt-2 text-lg font-semibold">{callout.title}</h3>
      {callout.description && <p className="mt-2 max-w-4xl text-sm leading-6 opacity-90">{callout.description}</p>}
      {callout.footer && <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] opacity-70">{callout.footer}</p>}
    </section>
  );
}

export default function RoleFeaturePage({
  accent = 'slate',
  eyebrow,
  title,
  description,
  summary = [],
  sections = [],
  table,
  callout,
  footerNote,
  toolbar,
  live = false,
}) {
  const ringClass = accentRingClasses[accent] || accentRingClasses.slate;
  const [search, setSearch] = useState('');
  const [liveWorkspace, setLiveWorkspace] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');

  const loadLiveWorkspace = useCallback(async (signal) => {
    if (!live) {
      return;
    }

    setLiveLoading(true);
    setLiveError('');

    try {
      const response = await api.get('/workspace/summary', { signal });
      if (!signal?.aborted) {
        setLiveWorkspace(response?.data || null);
      }
    } catch (error) {
      if (error?.name === 'CanceledError' || signal?.aborted) return;
      const message = error?.response?.data?.message || 'Unable to fetch role workspace summary.';
      setLiveError(message);
      setLiveWorkspace(null);
    } finally {
      if (!signal?.aborted) {
        setLiveLoading(false);
      }
    }
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    loadLiveWorkspace(controller.signal);
    return () => controller.abort();
  }, [live, loadLiveWorkspace]);

  const effectiveSummary = useMemo(() => {
    if (liveWorkspace?.cards) {
      return buildLiveSummary(liveWorkspace.cards, accent);
    }

    return summary;
  }, [liveWorkspace, summary, accent]);

  const effectiveSections = useMemo(() => {
    if (liveWorkspace) {
      return buildLiveSections(liveWorkspace, liveError);
    }

    return live && liveError ? buildLiveSections(null, liveError) : sections;
  }, [liveWorkspace, sections, live, liveError]);

  const baseTable = useMemo(() => {
    if (liveWorkspace?.recent) {
      return buildLiveTable(liveWorkspace.recent);
    }

    if (live && liveLoading) {
      return {
        label: 'Live activity feed',
        title: 'Recent role-scoped records',
        description: 'Loading latest backend records...',
        columns: liveTableColumns,
        data: [],
        loading: true,
      };
    }

    return table;
  }, [liveWorkspace, live, liveLoading, table]);

  const effectiveToolbar = useMemo(() => {
    if (!live) {
      return toolbar;
    }

    const existingActions = Array.isArray(toolbar?.actions) ? toolbar.actions : [];

    return {
      ...toolbar,
      searchPlaceholder: toolbar?.searchPlaceholder || 'Search live records, context, status, or details...',
      actions: [
        {
          label: liveLoading ? 'Refreshing...' : 'Refresh data',
          onClick: () => loadLiveWorkspace(),
          variant: 'secondary',
        },
        ...existingActions,
      ],
    };
  }, [live, toolbar, liveLoading, loadLiveWorkspace]);

  const filteredTable = useMemo(() => {
    if (!baseTable || !Array.isArray(baseTable.data) || !search.trim()) {
      return baseTable;
    }

    const query = search.trim().toLowerCase();
    const nextData = baseTable.data.filter((item) => {
      return Object.values(item || {}).some((value) => String(value ?? '').toLowerCase().includes(query));
    });

    return {
      ...baseTable,
      data: nextData,
      pagination: undefined,
    };
  }, [baseTable, search]);

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ${ringClass}`}>
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>

        {(baseTable || effectiveToolbar) && (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 max-w-lg">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={effectiveToolbar?.searchPlaceholder || 'Search records, references, status, or owner...'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {Array.isArray(effectiveToolbar?.actions) && effectiveToolbar.actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {effectiveToolbar.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      action.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {effectiveSummary.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {effectiveSummary.map((item) => (
            <SummaryCard key={item.label} item={item} />
          ))}
        </section>
      )}

      {effectiveSections.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {effectiveSections.map((section) => (
            <SectionCard key={section.title} section={section} />
          ))}
        </section>
      )}

      {filteredTable && <TableCard table={filteredTable} />}

      {callout && <CalloutCard callout={callout} />}

      {footerNote && <p className="text-xs text-slate-500">{footerNote}</p>}
    </div>
  );
}

export function createRoleFeaturePage(config) {
  return function ConfiguredRoleFeaturePage() {
    return <RoleFeaturePage {...config} />;
  };
}