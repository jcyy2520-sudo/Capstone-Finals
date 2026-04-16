<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Invitation;

class AlternativeModeValidator
{
    /**
     * Validate mode-specific data before submitting for HOPE approval.
     * Throws \Exception on validation failure.
     */
    public function validate(Invitation $invitation): void
    {
        $mode = $invitation->procurement_mode;
        $data = $invitation->mode_specific_data ?? [];

        match ($mode) {
            Invitation::MODE_DIRECT_ACQUISITION => $this->validateDirectAcquisition($invitation, $data),
            Invitation::MODE_REPEAT_ORDER => $this->validateRepeatOrder($invitation, $data),
            Invitation::MODE_NEGOTIATED => $this->validateNegotiated($invitation, $data),
            Invitation::MODE_DIRECT_CONTRACTING => $this->validateDirectContracting($invitation, $data),
            Invitation::MODE_LIMITED_SOURCE => $this->validateLimitedSource($invitation, $data),
            Invitation::MODE_DIRECT_SALES => $this->validateDirectSales($invitation, $data),
            Invitation::MODE_STI => $this->validateSti($invitation, $data),
            default => null, // Standard modes (competitive_bidding, SVP, shopping) skip this
        };
    }

    /**
     * RA 9184 Sec 52.1(b): Direct Acquisition — ABC ≤ ₱200,000
     * No splitting of contracts to circumvent threshold.
     */
    protected function validateDirectAcquisition(Invitation $invitation, array $data): void
    {
        if ($invitation->abc > 200000) {
            throw new \Exception('Direct Acquisition is only allowed for procurement with ABC ≤ ₱200,000 (RA 9184 Sec 52.1b).');
        }

        if (empty($data['supplier_quotation_date'])) {
            throw new \Exception('Supplier quotation date is required for Direct Acquisition.');
        }

        if (empty($invitation->selected_supplier_name)) {
            throw new \Exception('Selected supplier name is required for Direct Acquisition.');
        }
    }

    /**
     * RA 9184 Sec 51: Repeat Order — must reference prior contract, same items, same/lower price, within 6 months.
     */
    protected function validateRepeatOrder(Invitation $invitation, array $data): void
    {
        if (empty($data['original_contract_id'])) {
            throw new \Exception('Original contract reference is required for Repeat Order.');
        }

        $originalContract = Contract::find($data['original_contract_id']);
        if (!$originalContract) {
            throw new \Exception('Referenced original contract does not exist.');
        }

        if ($originalContract->status !== 'completed' && $originalContract->status !== 'active') {
            throw new \Exception('Original contract must be active or completed for Repeat Order.');
        }

        // Within 6 months of original contract end/completion
        if ($originalContract->end_date && $originalContract->end_date->diffInMonths(now()) > 6) {
            throw new \Exception('Repeat Order must be within 6 months of the original contract period (RA 9184 Sec 51).');
        }

        if (empty($data['same_items_confirmation'])) {
            throw new \Exception('Confirmation that items are the same as original contract is required.');
        }

        if (empty($data['price_compliance'])) {
            throw new \Exception('Price compliance declaration (same or lower price) is required.');
        }
    }

    /**
     * RA 9184 Sec 53: Negotiated Procurement — requires specific ground and support docs.
     */
    protected function validateNegotiated(Invitation $invitation, array $data): void
    {
        $validGrounds = [
            'two_failed_biddings',
            'emergency',
            'take_over',
            'adjacent_adjoining',
            'agency_to_agency',
            'scientific_scholarly',
            'highly_technical',
            'gocc_defense',
            'small_value',
        ];

        if (empty($data['negotiation_ground']) || !in_array($data['negotiation_ground'], $validGrounds)) {
            throw new \Exception('Valid negotiation ground is required (RA 9184 Sec 53). Allowed: ' . implode(', ', $validGrounds));
        }

        if ($data['negotiation_ground'] === 'two_failed_biddings') {
            if (empty($data['failed_bidding_references']) || !is_array($data['failed_bidding_references']) || count($data['failed_bidding_references']) < 2) {
                throw new \Exception('Two failed bidding references are required for Negotiated Procurement under two-failed-biddings ground.');
            }
        }

        if ($data['negotiation_ground'] === 'emergency') {
            if (empty($data['emergency_declaration_reference'])) {
                throw new \Exception('Emergency declaration reference is required for emergency negotiated procurement.');
            }
        }
    }

    /**
     * RA 9184 Sec 50: Direct Contracting — exclusive dealer/manufacturer proof.
     */
    protected function validateDirectContracting(Invitation $invitation, array $data): void
    {
        if (empty($data['exclusivity_basis'])) {
            throw new \Exception('Basis of exclusivity is required for Direct Contracting (RA 9184 Sec 50).');
        }

        $validBases = ['sole_distributor', 'patent_holder', 'proprietary', 'critical_component'];
        if (!in_array($data['exclusivity_basis'], $validBases)) {
            throw new \Exception('Invalid exclusivity basis. Allowed: ' . implode(', ', $validBases));
        }

        if (empty($invitation->selected_supplier_name)) {
            throw new \Exception('Selected supplier (exclusive dealer/manufacturer) is required for Direct Contracting.');
        }

        if (empty($data['exclusivity_proof_description'])) {
            throw new \Exception('Description of exclusivity proof document is required.');
        }
    }

    /**
     * RA 9184 Sec 49: Limited Source Bidding — shortlist justification required.
     */
    protected function validateLimitedSource(Invitation $invitation, array $data): void
    {
        if (empty($data['shortlist_justification'])) {
            throw new \Exception('Justification for limited source shortlist is required (RA 9184 Sec 49).');
        }

        if (empty($data['shortlisted_suppliers']) || !is_array($data['shortlisted_suppliers']) || count($data['shortlisted_suppliers']) < 2) {
            throw new \Exception('At least 2 shortlisted suppliers are required for Limited Source Bidding.');
        }
    }

    /**
     * Direct Sales — agency/GOCC reference + price comparison.
     */
    protected function validateDirectSales(Invitation $invitation, array $data): void
    {
        if (empty($data['selling_agency'])) {
            throw new \Exception('Selling agency name is required for Direct Sales.');
        }

        if (empty($data['price_comparison_basis'])) {
            throw new \Exception('Price comparison basis is required for Direct Sales.');
        }
    }

    /**
     * STI Procurement — classification + technical endorsement.
     */
    protected function validateSti(Invitation $invitation, array $data): void
    {
        if (empty($data['sti_classification'])) {
            throw new \Exception('STI classification is required for Science/Technology/Innovation procurement.');
        }

        $validClassifications = ['research_equipment', 'laboratory_supplies', 'ict_infrastructure', 'scientific_instruments', 'technical_software'];
        if (!in_array($data['sti_classification'], $validClassifications)) {
            throw new \Exception('Invalid STI classification. Allowed: ' . implode(', ', $validClassifications));
        }

        if (empty($data['technical_endorsement_by'])) {
            throw new \Exception('Technical endorsement source (department/agency) is required.');
        }
    }
}
