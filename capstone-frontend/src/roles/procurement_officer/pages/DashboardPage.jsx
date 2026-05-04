import RoleFeaturePage from '../../../shared/components/RoleFeaturePage';

const summary = [
  { label: 'APP consolidation', value: '0', note: 'Entries routed from budget review', tone: 'blue' },
  { label: 'PR queue', value: '0', note: 'Requests awaiting procurement action', tone: 'amber' },
  { label: 'Contracts', value: '0', note: 'Execution and delivery tracking', tone: 'emerald' },
  { label: 'Returns', value: '0', note: 'Items pushed back for correction', tone: 'rose' },
];

const sections = [
  {
    label: 'Operational Scope',
    title: 'Procurement intake and execution support',
    description: 'This role picks up after budget certification to consolidate APP items, accept purchase requisitions, and monitor contract execution queues.',
    bullets: [
      'APP consolidation belongs here, not to the department requester.',
      'PR intake stays separate from BAC Chairperson mode confirmation.',
      'Inspection approval remains with the IAC.',
    ],
  },
];

export default function ProcurementOfficerDashboardPage() {
  return (
    <RoleFeaturePage
      accent="slate"
      eyebrow="Procurement Officer"
      title="Procurement Officer Dashboard"
      description="Manage procurement-facing APP, PR, and contract queues after department and budget clearance."
      summary={summary}
      sections={sections}
      live
    />
  );
}