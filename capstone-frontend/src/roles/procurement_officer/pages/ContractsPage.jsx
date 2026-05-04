import ContractsPage from '../../bac_secretariat/pages/ContractsPage';

export default function ProcurementOfficerContractsPage() {
	return (
		<ContractsPage
			currentRole="procurement_officer"
			title="Contract Packaging and Delivery Tracking"
			description="Track pending contract packages and active implementation records without taking HOPE or BAC Secretariat-only actions."
		/>
	);
}