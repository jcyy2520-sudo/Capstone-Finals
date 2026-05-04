import RoleFeaturePage from '../../../shared/components/RoleFeaturePage';

const summary = [
  { label: 'Pending inspections', value: '0', note: 'Deliveries that still need reports', tone: 'amber' },
  { label: 'For acceptance', value: '0', note: 'Inspected reports awaiting committee action', tone: 'blue' },
  { label: 'Accepted', value: '0', note: 'IARs cleared for payment processing', tone: 'emerald' },
  { label: 'Rejected', value: '0', note: 'Deliveries with deficiencies recorded', tone: 'rose' },
];

const sections = [
  {
    label: 'Committee Control',
    title: 'Inspection and acceptance ownership',
    description: 'The IAC owns inspection reports and acceptance decisions after delivery. The requester can monitor delivery status but cannot create or approve IARs.',
    bullets: [
      'Create IARs only for delivered contracts ready for physical inspection.',
      'Accept only when goods or services match the contract and delivery record.',
      'Use rejection remarks when deficiencies or incomplete deliveries are found.',
    ],
  },
];

export default function InspectionAcceptanceCommitteeDashboardPage() {
  return (
    <RoleFeaturePage
      accent="emerald"
      eyebrow="Inspection Acceptance Committee"
      title="IAC Dashboard"
      description="Create, review, and finalize inspection and acceptance reports for delivered contracts."
      summary={summary}
      sections={sections}
      live
    />
  );
}