import RoleFeaturePage from '../../../shared/components/RoleFeaturePage';

const summary = [
  { label: 'APP queue', value: '0', note: 'Items waiting for endorsement', tone: 'blue' },
  { label: 'PR queue', value: '0', note: 'Department requests awaiting action', tone: 'amber' },
  { label: 'Returns', value: '0', note: 'Records sent back to your office', tone: 'rose' },
  { label: 'Approved APP', value: '0', note: 'Planning items already cleared', tone: 'emerald' },
];

const sections = [
  {
    label: 'Control Boundary',
    title: 'Department endorsement only',
    description: 'This role exists to endorse or return APP entries and purchase requisitions from the department before they move to budget and procurement.',
    bullets: [
      'Endorse only complete and necessary requests from your office.',
      'Do not treat requester encoding as departmental approval.',
      'Inspection, award, and payment actions remain outside this role.',
    ],
  },
];

export default function DepartmentHeadDashboardPage() {
  return (
    <RoleFeaturePage
      accent="amber"
      eyebrow="Department Head"
      title="Department Head Dashboard"
      description="Review APP entries and purchase requisitions routed from your department before they advance to budget certification."
      summary={summary}
      sections={sections}
      live
    />
  );
}