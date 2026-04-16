<?php

namespace Database\Seeders;

use App\Models\AppEntry;
use App\Models\Award;
use App\Models\BacResolution;
use App\Models\BidEligibilityResult;
use App\Models\BidOpening;
use App\Models\BidOpeningAttendance;
use App\Models\BidPrice;
use App\Models\BidSubmission;
use App\Models\Contract;
use App\Models\Department;
use App\Models\Evaluation;
use App\Models\EvaluationSummary;
use App\Models\Invitation;
use App\Models\PostQualification;
use App\Models\PrLineItem;
use App\Models\PurchaseRequisition;
use App\Models\RfqInvitation;
use App\Models\Role;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

/**
 * Seeds a complete procurement lifecycle with realistic Philippine LGU data.
 *
 * Creates two full procurement pipelines:
 *   Pipeline A (Competitive Bidding): APP → PR → ITB → Bid Opening → Evaluation → Post-Qual → Award → Contract
 *   Pipeline B (Small Value Procurement): APP → PR → RFQ → Bid Opening → Evaluation → Post-Qual → Award
 *
 * Also creates additional APP entries and PRs at various stages for demo purposes.
 */
class DemoProcurementSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔄 Cleaning existing demo data...');
        $this->cleanExistingData();

        $this->command->info('🔄 Seeding Pipeline A: Competitive Bidding (MHO - Medical Supplies)...');
        $this->seedPipelineA();

        $this->command->info('🔄 Seeding Pipeline B: Small Value Procurement (ITO - IT Equipment)...');
        $this->seedPipelineB();

        $this->command->info('🔄 Seeding additional APP entries at various stages...');
        $this->seedAdditionalAppEntries();

        $this->command->info('✅ Demo procurement data seeded successfully!');
    }

    private function cleanExistingData(): void
    {
        // Clean in reverse dependency order
        Contract::query()->delete();
        Award::query()->delete();
        PostQualification::query()->delete();
        BacResolution::query()->delete();
        EvaluationSummary::query()->delete();
        Evaluation::query()->delete();
        BidPrice::query()->delete();
        BidEligibilityResult::query()->delete();
        BidOpeningAttendance::query()->delete();
        BidOpening::query()->delete();
        BidSubmission::query()->delete();
        RfqInvitation::query()->delete();
        Invitation::query()->delete();
        PrLineItem::query()->delete();
        PurchaseRequisition::query()->delete();
        AppEntry::query()->delete();
    }

    /**
     * Pipeline A: Competitive Bidding - Medical Supplies for MHO
     * Full lifecycle from APP to Contract
     */
    private function seedPipelineA(): void
    {
        // ── Lookup users ────────────────────────────────────────
        $requester   = User::where('email', 'requester@procureseal.gov.ph')->first();
        $secretariat = User::where('email', 'secretariat@procureseal.gov.ph')->first();
        $chairperson = User::where('email', 'bacchair@procureseal.gov.ph')->first();
        $budgetOfficer = User::where('email', 'budget@procureseal.gov.ph')->first();
        $hope        = User::where('email', 'hope@procureseal.gov.ph')->first();
        $twg         = User::where('email', 'twg@procureseal.gov.ph')->first();
        $bacMembers  = User::where('email', 'like', 'bac%@procureseal.gov.ph')
            ->whereHas('role', fn ($q) => $q->where('name', Role::BAC_MEMBER))
            ->get();

        $mhoDept  = Department::where('code', 'MHO')->first();
        $vendors   = Vendor::where('status', 'approved')->get();

        // ── 1. APP Entry (Approved) ─────────────────────────────
        $appA = AppEntry::create([
            'department_id'             => $mhoDept->id,
            'project_title'             => 'Procurement of Essential Medical Supplies and Equipment for RHU',
            'description'               => 'Annual procurement of medical supplies including PPE, diagnostic kits, and basic medical equipment for the Rural Health Units under the Municipal Health Office.',
            'category'                  => 'goods',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 3500000.00,
            'mfo_code'                  => 'MFO-HEALTH',
            'mfo_name_snapshot'         => 'Public Health Services',
            'pap_code'                  => 'PAP-2026-HEALTH-001',
            'uacs_object_code'          => '50203010',
            'approved_budget_reference' => 'LB-2026-ORD-001',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-203-010',
            'implementing_unit'         => 'Municipal Health Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Mandatory annual replenishment of medical supplies per DOH guidelines. Current stock levels are critically low at 15% capacity.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'approved_by'               => $hope->id,
            'approved_at'               => now()->subDays(30),
            'submitted_at'              => now()->subDays(35),
            'budget_certified_by'       => $budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(32),
        ]);

        // ── 2. Purchase Requisition (Accepted) ──────────────────
        $prA = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-MHO-0001',
            'app_entry_id'          => $appA->id,
            'department_id'         => $mhoDept->id,
            'requester_id'          => $requester->id,
            'purpose'               => 'Replenishment of medical supplies for 5 Rural Health Units. Current stock at critical levels per quarterly inventory report.',
            'date_required'         => now()->addDays(60),
            'urgency_level'         => 'urgent',
            'total_value'           => 3200000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'competitive_bidding',
            'endorsed_by'           => $requester->id,
            'endorsed_at'           => now()->subDays(28),
            'budget_certified_by'   => $budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(26),
            'accepted_by'           => $secretariat->id,
            'accepted_at'           => now()->subDays(25),
            'submitted_at'          => now()->subDays(29),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-203-010',
            'mode_confirmed_by'     => $chairperson->id,
            'mode_confirmed_at'     => now()->subDays(24),
        ]);

        // Line items
        $lineItems = [
            ['item_description' => 'Personal Protective Equipment (PPE) Set - N95 Masks, Gloves, Gowns', 'unit_of_measure' => 'sets', 'quantity' => 500, 'estimated_unit_cost' => 1200.00],
            ['item_description' => 'Rapid Diagnostic Test Kits (COVID-19/Dengue/TB)', 'unit_of_measure' => 'kits', 'quantity' => 2000, 'estimated_unit_cost' => 350.00],
            ['item_description' => 'Digital Blood Pressure Monitor (Arm-type, Automatic)', 'unit_of_measure' => 'units', 'quantity' => 20, 'estimated_unit_cost' => 4500.00],
            ['item_description' => 'Pulse Oximeter with LED Display', 'unit_of_measure' => 'units', 'quantity' => 30, 'estimated_unit_cost' => 2800.00],
            ['item_description' => 'First Aid Kit Complete Set (Industrial Grade)', 'unit_of_measure' => 'sets', 'quantity' => 50, 'estimated_unit_cost' => 3500.00],
            ['item_description' => 'Surgical Instruments Basic Set (Sterile)', 'unit_of_measure' => 'sets', 'quantity' => 10, 'estimated_unit_cost' => 25000.00],
            ['item_description' => 'Medical Grade Alcohol (70% Isopropyl, 500ml)', 'unit_of_measure' => 'bottles', 'quantity' => 1000, 'estimated_unit_cost' => 120.00],
            ['item_description' => 'Nebulizer Machine (Portable, with Accessories)', 'unit_of_measure' => 'units', 'quantity' => 15, 'estimated_unit_cost' => 5500.00],
        ];

        foreach ($lineItems as $i => $item) {
            PrLineItem::create([
                'purchase_requisition_id' => $prA->id,
                'item_description'        => $item['item_description'],
                'unit_of_measure'         => $item['unit_of_measure'],
                'quantity'                => $item['quantity'],
                'estimated_unit_cost'     => $item['estimated_unit_cost'],
                'estimated_total_cost'    => $item['quantity'] * $item['estimated_unit_cost'],
                'sort_order'              => $i + 1,
            ]);
        }

        // ── 3. Invitation to Bid (Posted) ───────────────────────
        $itbA = Invitation::create([
            'reference_number'           => 'ITB-2026-0001',
            'purchase_requisition_id'    => $prA->id,
            'type'                       => 'itb',
            'project_title'              => $appA->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 3500000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'competitive_bidding',
            'bid_document_cost'          => 5000.00,
            'eligibility_check_date'     => now()->subDays(14),
            'pre_bid_conference_date'    => now()->subDays(10),
            'submission_deadline'        => now()->subDays(3),
            'opening_date'               => now()->subDays(2),
            'opening_venue'              => 'BAC Conference Room, Municipal Hall, 2nd Floor',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'philgeps_reference'         => 'PHILGEPS-2026-0001234',
            'additional_requirements'    => 'FDA-approved products required. Certificate of Product Registration must be submitted.',
            'special_conditions'         => 'Delivery within 30 calendar days from receipt of NTP. Partial delivery accepted for items with lead time.',
            'technical_specifications'   => 'All medical supplies must conform to Philippine National Standards (PNS) and DOH specifications.',
            'delivery_location'          => 'Municipal Health Office Warehouse, San Rafael, Bulacan',
            'delivery_schedule'          => '30 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(20),
            'created_by'                 => $secretariat->id,
            'approved_by'                => $chairperson->id,
            'approved_at'                => now()->subDays(21),
            'hope_approved_by'           => $hope->id,
            'hope_approved_at'           => now()->subDays(20),
        ]);

        // ── 4. Bid Submissions from 3 vendors ──────────────────
        $bidAmounts = [3180000.00, 3350000.00, 3420000.00];
        foreach ($vendors as $idx => $vendor) {
            BidSubmission::create([
                'invitation_id' => $itbA->id,
                'vendor_id'     => $vendor->id,
                'bid_amount'    => $bidAmounts[$idx],
                'remarks'       => 'Complete bid package submitted with all required documents.',
                'documents'     => json_encode([
                    'eligibility_documents' => 'eligibility_' . $vendor->id . '.pdf',
                    'technical_proposal'    => 'technical_' . $vendor->id . '.pdf',
                    'financial_proposal'    => 'financial_' . $vendor->id . '.pdf',
                ]),
                'status'        => 'submitted',
                'submitted_at'  => now()->subDays(4),
                'is_late'       => false,
                'document_hash' => hash('sha256', 'bid_' . $vendor->id . '_' . $itbA->id),
            ]);
        }

        // ── 5. Bid Opening Session (Completed) ─────────────────
        $openingA = BidOpening::create([
            'session_reference' => 'BOS-ITB-2026-0001-' . now()->subDays(2)->format('Ymd'),
            'invitation_id'     => $itbA->id,
            'session_date'      => now()->subDays(2),
            'quorum_confirmed'  => true,
            'bac_members_present' => json_encode([
                ['id' => $chairperson->id, 'name' => $chairperson->name, 'role' => 'BAC Chairperson'],
                ['id' => $bacMembers[0]->id, 'name' => $bacMembers[0]->name, 'role' => 'BAC Member'],
                ['id' => $bacMembers[1]->id, 'name' => $bacMembers[1]->name, 'role' => 'BAC Member'],
                ['id' => $bacMembers[2]->id, 'name' => $bacMembers[2]->name, 'role' => 'BAC Member'],
            ]),
            'observers_present' => json_encode([
                ['id' => User::where('email', 'observer@procureseal.gov.ph')->first()?->id, 'name' => 'Gloria Ramos', 'organization' => 'COA'],
            ]),
            'failure_declared'  => false,
            'status'            => 'completed',
            'conducted_by'      => $chairperson->id,
            'closed_at'         => now()->subDays(2),
        ]);

        // Attendance
        foreach ($vendors as $vendor) {
            BidOpeningAttendance::create([
                'bid_opening_id' => $openingA->id,
                'vendor_id'      => $vendor->id,
                'present'        => true,
            ]);
        }

        // Eligibility Results (all pass)
        $docTypes = ['dti_sec_cda', 'mayors_permit', 'tax_clearance', 'philgeps_certificate', 'bid_security'];
        foreach ($vendors as $vendor) {
            foreach ($docTypes as $docType) {
                BidEligibilityResult::create([
                    'bid_opening_id'  => $openingA->id,
                    'vendor_id'       => $vendor->id,
                    'doc_type'        => $docType,
                    'result'          => 'pass',
                    'remarks'         => 'Document verified and valid.',
                    'overall_eligible' => true,
                ]);
            }
        }

        // Bid Prices
        foreach ($vendors as $idx => $vendor) {
            BidPrice::create([
                'bid_opening_id'       => $openingA->id,
                'vendor_id'            => $vendor->id,
                'amount_as_read'       => $bidAmounts[$idx],
                'amount_as_calculated' => $bidAmounts[$idx],
                'arithmetic_correction' => 0,
                'rank'                 => $idx + 1,
            ]);
        }

        // ── 6. Evaluations (Approved) ───────────────────────────
        // BAC member evaluations
        foreach ($bacMembers as $evaluator) {
            foreach ($vendors as $vendor) {
                Evaluation::create([
                    'bid_opening_id' => $openingA->id,
                    'invitation_id'  => $itbA->id,
                    'evaluator_id'   => $evaluator->id,
                    'evaluator_role' => 'bac_member',
                    'vendor_id'      => $vendor->id,
                    'technical_items' => json_encode([
                        ['item' => 'Compliance with Technical Specifications', 'result' => 'pass', 'remarks' => 'Meets all DOH requirements'],
                        ['item' => 'Product Quality Certification', 'result' => 'pass', 'remarks' => 'FDA-registered products'],
                        ['item' => 'Delivery Capability', 'result' => 'pass', 'remarks' => 'Confirmed delivery within 30 days'],
                    ]),
                    'calculated_price' => $bidAmounts[$vendors->search($vendor)],
                    'recommendation'   => 'responsive',
                    'overall_remarks'  => 'Bid is responsive to all requirements.',
                    'status'           => 'submitted',
                    'submitted_at'     => now()->subDays(1),
                ]);
            }
        }

        // TWG evaluation
        foreach ($vendors as $vendor) {
            Evaluation::create([
                'bid_opening_id' => $openingA->id,
                'invitation_id'  => $itbA->id,
                'evaluator_id'   => $twg->id,
                'evaluator_role' => 'twg_member',
                'vendor_id'      => $vendor->id,
                'technical_items' => json_encode([
                    ['item' => 'Technical Capability Assessment', 'result' => 'pass', 'remarks' => 'Vendor has proven track record'],
                    ['item' => 'Quality Assurance System', 'result' => 'pass', 'remarks' => 'ISO 9001 certified'],
                ]),
                'calculated_price' => $bidAmounts[$vendors->search($vendor)],
                'recommendation'   => 'responsive',
                'overall_remarks'  => 'Technical evaluation satisfactory.',
                'status'           => 'submitted',
                'submitted_at'     => now()->subDays(1),
            ]);
        }

        // Evaluation Summary
        EvaluationSummary::create([
            'bid_opening_id' => $openingA->id,
            'invitation_id'  => $itbA->id,
            'ranked_bidders' => json_encode([
                ['vendor_id' => $vendors[0]->id, 'vendor_name' => $vendors[0]->business_name, 'bid_amount' => $bidAmounts[0], 'rank' => 1, 'recommendation' => 'responsive'],
                ['vendor_id' => $vendors[1]->id, 'vendor_name' => $vendors[1]->business_name, 'bid_amount' => $bidAmounts[1], 'rank' => 2, 'recommendation' => 'responsive'],
                ['vendor_id' => $vendors[2]->id, 'vendor_name' => $vendors[2]->business_name, 'bid_amount' => $bidAmounts[2], 'rank' => 3, 'recommendation' => 'responsive'],
            ]),
            'status'      => 'approved',
            'approved_by' => $chairperson->id,
            'approved_at' => now()->subDays(1),
        ]);

        // ── 7. Post-Qualification (Passed for Rank 1) ───────────
        $pqA = PostQualification::create([
            'bid_opening_id'       => $openingA->id,
            'invitation_id'        => $itbA->id,
            'vendor_id'            => $vendors[0]->id,
            'rank'                 => 1,
            'invitation_reference' => 'PQ-ITB-2026-0001-R1',
            'document_results'     => json_encode([
                ['document' => 'Latest Income Tax Return', 'status' => 'submitted', 'verified' => true],
                ['document' => 'Audited Financial Statements (Last 3 years)', 'status' => 'submitted', 'verified' => true],
                ['document' => 'NFCC Computation', 'status' => 'submitted', 'verified' => true],
                ['document' => 'Valid Joint Venture Agreement (if applicable)', 'status' => 'not_applicable'],
            ]),
            'required_documents' => json_encode([
                'Latest Income Tax Return',
                'Audited Financial Statements (Last 3 years)',
                'NFCC Computation',
                'Valid Joint Venture Agreement (if applicable)',
            ]),
            'submitted_documents' => json_encode([
                'income_tax_return.pdf',
                'financial_statements_2023_2025.pdf',
                'nfcc_computation.pdf',
            ]),
            'twg_evaluation'      => json_encode(['overall' => 'satisfactory', 'score' => 95]),
            'twg_recommendation'  => 'pass',
            'twg_remarks'         => 'Vendor meets all post-qualification requirements. Recommended to proceed with award.',
            'result'              => 'passed',
            'workflow_status'     => 'completed',
            'evaluated_by'        => $twg->id,
            'invitation_sent_at'  => now()->subDays(5),
            'acknowledged_at'     => now()->subDays(4),
            'submission_deadline_at' => now()->subDays(2),
            'documents_submitted_at' => now()->subDays(3),
            'completed_at'        => now()->subDays(1),
            'finalized_at'        => now()->subDays(1),
        ]);

        // Update bid opening status to reflect post-qualification passed
        $openingA->update(['status' => 'POST_QUALIFICATION_PASSED']);

        // ── 8. BAC Resolution (HOPE Approved) ───────────────────
        $resA = BacResolution::create([
            'resolution_reference' => 'BAC-RES-2026-0001',
            'invitation_id'        => $itbA->id,
            'type'                 => 'award_recommendation',
            'subject'              => 'Resolution Recommending Award for the Procurement of Essential Medical Supplies and Equipment for RHU',
            'body'                 => 'RESOLVED, that after a thorough evaluation and post-qualification of bids received for ITB-2026-0001, the Bids and Awards Committee recommends the award of contract to ' . $vendors[0]->business_name . ' with a bid amount of PHP ' . number_format($bidAmounts[0], 2) . ', being the Lowest Calculated Responsive Bid (LCRB).',
            'signatories'          => json_encode([
                ['id' => $chairperson->id, 'name' => $chairperson->name, 'role' => 'BAC Chairperson', 'signed' => true, 'signed_at' => now()->subDays(1)->toISOString()],
                ['id' => $bacMembers[0]->id, 'name' => $bacMembers[0]->name, 'role' => 'BAC Member', 'signed' => true, 'signed_at' => now()->subDays(1)->toISOString()],
                ['id' => $bacMembers[1]->id, 'name' => $bacMembers[1]->name, 'role' => 'BAC Member', 'signed' => true, 'signed_at' => now()->subDays(1)->toISOString()],
                ['id' => $bacMembers[2]->id, 'name' => $bacMembers[2]->name, 'role' => 'BAC Member', 'signed' => true, 'signed_at' => now()->subDays(1)->toISOString()],
            ]),
            'min_signatures_required' => 3,
            'status'                  => 'approved_by_hope',
            'created_by'              => $secretariat->id,
            'hope_approved_by'        => $hope->id,
            'hope_approved_at'        => now()->subHours(12),
        ]);

        // Link resolution to post-qualification
        $pqA->update(['bac_resolution_id' => $resA->id]);

        // ── 9. Award (NOA Issued, Acknowledged) ────────────────
        $awardA = Award::create([
            'noa_reference'              => 'NOA-2026-0001',
            'invitation_id'              => $itbA->id,
            'bid_opening_id'             => $openingA->id,
            'vendor_id'                  => $vendors[0]->id,
            'contract_amount'            => $bidAmounts[0],
            'performance_security_amount' => $bidAmounts[0] * 0.05,
            'performance_security_deadline' => now()->addDays(10),
            'contract_signing_deadline'  => now()->addDays(10),
            'special_conditions'         => 'Delivery to all 5 RHUs within the municipality. Items must be FDA-registered.',
            'status'                     => 'ACKNOWLEDGED',
            'hope_signed_by'             => $hope->id,
            'hope_signed_at'             => now()->subHours(10),
            'noa_issued_at'              => now()->subHours(10),
            'noa_acknowledgment_deadline' => now()->addDays(5),
            'noa_acknowledged_at'        => now()->subHours(6),
        ]);

        // Update bid opening to reflect NOA acknowledged
        $openingA->update(['status' => 'NOA_ACKNOWLEDGED']);

        // ── 10. Contract (Active) ──────────────────────────────
        Contract::create([
            'contract_reference'     => 'CTR-2026-MHO-0001',
            'award_id'               => $awardA->id,
            'vendor_id'              => $vendors[0]->id,
            'purchase_requisition_id' => $prA->id,
            'ntp_date'               => now(),
            'duration_days'          => 30,
            'end_date'               => now()->addDays(30),
            'contract_amount'        => $bidAmounts[0],
            'milestones'             => json_encode([
                ['name' => 'Initial Delivery (60%)', 'target_date' => now()->addDays(15)->toDateString(), 'status' => 'pending'],
                ['name' => 'Final Delivery (40%)', 'target_date' => now()->addDays(30)->toDateString(), 'status' => 'pending'],
            ]),
            'progress_percentage'    => 0,
            'status'                 => 'active',
        ]);

        $this->command->info('   ✅ Pipeline A complete: Medical Supplies (Competitive Bidding)');
    }

    /**
     * Pipeline B: Small Value Procurement - IT Equipment for ITO
     * Full lifecycle from APP to Award stage
     */
    private function seedPipelineB(): void
    {
        $requester   = User::where('email', 'requester@procureseal.gov.ph')->first();
        $secretariat = User::where('email', 'secretariat@procureseal.gov.ph')->first();
        $chairperson = User::where('email', 'bacchair@procureseal.gov.ph')->first();
        $budgetOfficer = User::where('email', 'budget@procureseal.gov.ph')->first();
        $hope        = User::where('email', 'hope@procureseal.gov.ph')->first();
        $twg         = User::where('email', 'twg@procureseal.gov.ph')->first();
        $bacMembers  = User::where('email', 'like', 'bac%@procureseal.gov.ph')
            ->whereHas('role', fn ($q) => $q->where('name', Role::BAC_MEMBER))
            ->get();

        $itoDept = Department::where('code', 'ITO')->first();
        $vendors = Vendor::where('status', 'approved')->get();

        // Use a second requester or reuse - for demo, we create a second dept requester
        // Actually the existing requester is MHO. For ITO, we'll still use them since it's demo data.
        // In real system, each dept has its own requester.

        // ── 1. APP Entry (Approved) ─────────────────────────────
        $appB = AppEntry::create([
            'department_id'             => $itoDept->id,
            'project_title'             => 'Procurement of Computer Equipment and Network Infrastructure Upgrade',
            'description'               => 'Upgrade of workstations and network switches for the municipal LAN. Includes 10 desktop computers, 2 network switches, and cabling materials.',
            'category'                  => 'goods',
            'mode'                      => 'small_value_procurement',
            'abc'                       => 480000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-001',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-002',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'Information Technology Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Current workstations are 7+ years old and can no longer run updated government software (eNGAS, eBudget). Network infrastructure needs 1Gbps upgrade.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'approved_by'               => $hope->id,
            'approved_at'               => now()->subDays(25),
            'submitted_at'              => now()->subDays(30),
            'budget_certified_by'       => $budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(27),
        ]);

        // ── 2. Purchase Requisition (Accepted) ──────────────────
        $prB = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-ITO-0001',
            'app_entry_id'          => $appB->id,
            'department_id'         => $itoDept->id,
            'requester_id'          => $requester->id,
            'purpose'               => 'Replacement of obsolete workstations and upgrade of network infrastructure to support digital government services.',
            'date_required'         => now()->addDays(30),
            'urgency_level'         => 'routine',
            'total_value'           => 465000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'small_value_procurement',
            'endorsed_by'           => $requester->id,
            'endorsed_at'           => now()->subDays(22),
            'budget_certified_by'   => $budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(20),
            'accepted_by'           => $secretariat->id,
            'accepted_at'           => now()->subDays(19),
            'submitted_at'          => now()->subDays(23),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-604-010',
            'mode_confirmed_by'     => $chairperson->id,
            'mode_confirmed_at'     => now()->subDays(18),
        ]);

        // Line items
        $lineItems = [
            ['item_description' => 'Desktop Computer (Core i5 12th Gen, 16GB RAM, 512GB SSD, 24" Monitor)', 'unit_of_measure' => 'units', 'quantity' => 10, 'estimated_unit_cost' => 35000.00],
            ['item_description' => 'Managed Network Switch 24-Port Gigabit with PoE', 'unit_of_measure' => 'units', 'quantity' => 2, 'estimated_unit_cost' => 25000.00],
            ['item_description' => 'UTP Cat6 Cable (305m box)', 'unit_of_measure' => 'boxes', 'quantity' => 5, 'estimated_unit_cost' => 6000.00],
            ['item_description' => 'RJ45 Connector Cat6 (100pcs/bag)', 'unit_of_measure' => 'bags', 'quantity' => 5, 'estimated_unit_cost' => 500.00],
            ['item_description' => 'UPS 1000VA Line Interactive', 'unit_of_measure' => 'units', 'quantity' => 10, 'estimated_unit_cost' => 4500.00],
        ];

        foreach ($lineItems as $i => $item) {
            PrLineItem::create([
                'purchase_requisition_id' => $prB->id,
                'item_description'        => $item['item_description'],
                'unit_of_measure'         => $item['unit_of_measure'],
                'quantity'                => $item['quantity'],
                'estimated_unit_cost'     => $item['estimated_unit_cost'],
                'estimated_total_cost'    => $item['quantity'] * $item['estimated_unit_cost'],
                'sort_order'              => $i + 1,
            ]);
        }

        // ── 3. RFQ Invitation (Posted) ──────────────────────────
        $rfqB = Invitation::create([
            'reference_number'           => 'RFQ-2026-0001',
            'purchase_requisition_id'    => $prB->id,
            'type'                       => 'rfq',
            'project_title'              => $appB->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 480000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'small_value_procurement',
            'submission_deadline'        => now()->subDays(3),
            'opening_date'               => now()->subDays(2),
            'opening_venue'              => 'BAC Office, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'delivery_location'          => 'ITO Office, Municipal Hall, San Rafael, Bulacan',
            'delivery_schedule'          => '15 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(10),
            'created_by'                 => $secretariat->id,
            'approved_by'                => $chairperson->id,
            'approved_at'                => now()->subDays(11),
        ]);

        // RFQ Invitations sent to vendors
        foreach ($vendors as $vendor) {
            RfqInvitation::create([
                'invitation_id' => $rfqB->id,
                'vendor_id'     => $vendor->id,
                'sent_at'       => now()->subDays(10),
                'read_at'       => now()->subDays(9),
                'submitted_at'  => now()->subDays(4),
                'status'        => 'submitted',
            ]);
        }

        // Bid Submissions
        $rfqBidAmounts = [445000.00, 460000.00, 472000.00];
        foreach ($vendors as $idx => $vendor) {
            BidSubmission::create([
                'invitation_id' => $rfqB->id,
                'vendor_id'     => $vendor->id,
                'bid_amount'    => $rfqBidAmounts[$idx],
                'remarks'       => 'Quotation submitted per RFQ requirements.',
                'documents'     => json_encode(['quotation' => 'quote_' . $vendor->id . '.pdf']),
                'status'        => 'submitted',
                'submitted_at'  => now()->subDays(4),
                'is_late'       => false,
                'document_hash' => hash('sha256', 'rfq_bid_' . $vendor->id . '_' . $rfqB->id),
            ]);
        }

        // ── 4. Bid Opening (Completed) ──────────────────────────
        $openingB = BidOpening::create([
            'session_reference' => 'BOS-RFQ-2026-0001-' . now()->subDays(2)->format('Ymd'),
            'invitation_id'     => $rfqB->id,
            'session_date'      => now()->subDays(2),
            'quorum_confirmed'  => true,
            'bac_members_present' => json_encode([
                ['id' => $chairperson->id, 'name' => $chairperson->name, 'role' => 'BAC Chairperson'],
                ['id' => $bacMembers[0]->id, 'name' => $bacMembers[0]->name, 'role' => 'BAC Member'],
                ['id' => $bacMembers[1]->id, 'name' => $bacMembers[1]->name, 'role' => 'BAC Member'],
            ]),
            'observers_present' => json_encode([]),
            'failure_declared'  => false,
            'status'            => 'completed',
            'conducted_by'      => $chairperson->id,
            'closed_at'         => now()->subDays(2),
        ]);

        // Attendance
        foreach ($vendors as $vendor) {
            BidOpeningAttendance::create([
                'bid_opening_id' => $openingB->id,
                'vendor_id'      => $vendor->id,
                'present'        => true,
            ]);
        }

        // Bid Prices
        foreach ($vendors as $idx => $vendor) {
            BidPrice::create([
                'bid_opening_id'       => $openingB->id,
                'vendor_id'            => $vendor->id,
                'amount_as_read'       => $rfqBidAmounts[$idx],
                'amount_as_calculated' => $rfqBidAmounts[$idx],
                'arithmetic_correction' => 0,
                'rank'                 => $idx + 1,
            ]);
        }

        // Eligibility (SVP - simplified)
        foreach ($vendors as $vendor) {
            BidEligibilityResult::create([
                'bid_opening_id'  => $openingB->id,
                'vendor_id'       => $vendor->id,
                'doc_type'        => 'philgeps_certificate',
                'result'          => 'pass',
                'remarks'         => 'PhilGEPS registered.',
                'overall_eligible' => true,
            ]);
        }

        // ── 5. Evaluations (Pending Chairperson Review) ────────
        foreach ($bacMembers->take(2) as $evaluator) {
            foreach ($vendors as $vendor) {
                Evaluation::create([
                    'bid_opening_id' => $openingB->id,
                    'invitation_id'  => $rfqB->id,
                    'evaluator_id'   => $evaluator->id,
                    'evaluator_role' => 'bac_member',
                    'vendor_id'      => $vendor->id,
                    'technical_items' => json_encode([
                        ['item' => 'Compliance with Specifications', 'result' => 'pass', 'remarks' => 'Meets minimum specs'],
                        ['item' => 'Warranty Coverage', 'result' => 'pass', 'remarks' => '1 year warranty included'],
                    ]),
                    'calculated_price' => $rfqBidAmounts[$vendors->search($vendor)],
                    'recommendation'   => 'responsive',
                    'overall_remarks'  => 'Quotation is responsive.',
                    'status'           => 'submitted',
                    'submitted_at'     => now()->subHours(12),
                ]);
            }
        }

        // Evaluation Summary (pending chairperson review - not yet approved)
        EvaluationSummary::create([
            'bid_opening_id' => $openingB->id,
            'invitation_id'  => $rfqB->id,
            'ranked_bidders' => json_encode([
                ['vendor_id' => $vendors[0]->id, 'vendor_name' => $vendors[0]->business_name, 'bid_amount' => $rfqBidAmounts[0], 'rank' => 1, 'recommendation' => 'responsive'],
                ['vendor_id' => $vendors[1]->id, 'vendor_name' => $vendors[1]->business_name, 'bid_amount' => $rfqBidAmounts[1], 'rank' => 2, 'recommendation' => 'responsive'],
                ['vendor_id' => $vendors[2]->id, 'vendor_name' => $vendors[2]->business_name, 'bid_amount' => $rfqBidAmounts[2], 'rank' => 3, 'recommendation' => 'responsive'],
            ]),
            'status' => 'pending_chairperson_review',
        ]);

        $this->command->info('   ✅ Pipeline B complete: IT Equipment (SVP) - awaiting chairperson eval approval');
    }

    /**
     * Additional APP entries and PRs at various stages for realistic dashboard display
     */
    private function seedAdditionalAppEntries(): void
    {
        $requester     = User::where('email', 'requester@procureseal.gov.ph')->first();
        $secretariat   = User::where('email', 'secretariat@procureseal.gov.ph')->first();
        $budgetOfficer = User::where('email', 'budget@procureseal.gov.ph')->first();
        $hope          = User::where('email', 'hope@procureseal.gov.ph')->first();
        $chairperson   = User::where('email', 'bacchair@procureseal.gov.ph')->first();

        $meoDept  = Department::where('code', 'MEO')->first();
        $mswdDept = Department::where('code', 'MSWD')->first();
        $gsoDept  = Department::where('code', 'GSO')->first();
        $maoDept  = Department::where('code', 'MAO')->first();

        // ── APP Entry: Draft (MEO - Infrastructure) ─────────────
        AppEntry::create([
            'department_id'             => $meoDept->id,
            'project_title'             => 'Road Repair and Concreting of Brgy. San Roque Access Road',
            'description'               => 'Concreting of 500 linear meters of barangay access road including drainage works and road markings.',
            'category'                  => 'infrastructure_works',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 5000000.00,
            'mfo_code'                  => 'MFO-INFRA',
            'mfo_name_snapshot'         => 'Infrastructure Development Services',
            'pap_code'                  => 'PAP-2026-INFRA-001',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-001',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'Municipal Engineering Office',
            'unit_of_measurement'       => 'linear meters',
            'quantity'                   => 500,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q3',
            'fiscal_year'               => 2026,
            'justification'             => 'Road is impassable during rainy season. Top priority per Brgy. San Roque development plan.',
            'status'                    => 'draft',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
        ]);

        // ── APP Entry: Submitted (MSWD - Social Services) ──────
        AppEntry::create([
            'department_id'             => $mswdDept->id,
            'project_title'             => 'Procurement of Food Packs for Disaster Relief Operations',
            'description'               => 'Pre-positioned food packs for 1,000 families for disaster preparedness. Includes rice, canned goods, and hygiene kits.',
            'category'                  => 'goods',
            'mode'                      => 'shopping',
            'abc'                       => 800000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-001',
            'uacs_object_code'          => '50203090',
            'approved_budget_reference' => 'LB-2026-ORD-002',
            'fund_source'               => 'Trust Fund',
            'account_code'              => '100-203-090',
            'implementing_unit'         => 'Municipal Social Welfare and Development',
            'unit_of_measurement'       => 'packs',
            'quantity'                   => 1000,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Pre-positioned relief goods per NDRRMC mandate for disaster-prone municipalities. Stock depleted after Typhoon Aghon.',
            'status'                    => 'submitted',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'submitted_at'              => now()->subDays(3),
        ]);

        // ── APP Entry: Pending Budget Certification (GSO) ──────
        AppEntry::create([
            'department_id'             => $gsoDept->id,
            'project_title'             => 'Procurement of Office Supplies and Furniture for Municipal Hall',
            'description'               => 'Annual supply of office consumables and replacement of damaged office furniture for all departments.',
            'category'                  => 'goods',
            'mode'                      => 'small_value_procurement',
            'abc'                       => 250000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-001',
            'uacs_object_code'          => '50203010',
            'approved_budget_reference' => 'LB-2026-ORD-001',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-203-010',
            'implementing_unit'         => 'General Services Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Annual office supply replenishment. Current inventory at 10% capacity.',
            'status'                    => 'pending_budget_certification',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'submitted_at'              => now()->subDays(5),
        ]);

        // ── APP Entry: Pending HOPE Approval (MAO) ─────────────
        AppEntry::create([
            'department_id'             => $maoDept->id,
            'project_title'             => 'Procurement of Agricultural Inputs and Farm Equipment',
            'description'               => 'Seeds, fertilizers, and hand tractors for the municipal agricultural support program benefiting 200 registered farmers.',
            'category'                  => 'goods',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 2800000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-001',
            'uacs_object_code'          => '50203090',
            'approved_budget_reference' => 'LB-2026-ORD-002',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-203-090',
            'implementing_unit'         => 'Municipal Agriculture Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q3',
            'fiscal_year'               => 2026,
            'justification'             => 'Support for registered farmers under the Municipal Agricultural Support Program. Aligned with DA Rice Competitiveness Enhancement Fund.',
            'status'                    => 'pending_hope_approval',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'submitted_at'              => now()->subDays(8),
            'budget_certified_by'       => $budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(5),
        ]);

        // ── APP Entry: Approved (GSO - Janitorial Services) with PR at various stages
        $appJanitorial = AppEntry::create([
            'department_id'             => $gsoDept->id,
            'project_title'             => 'Janitorial Services for Municipal Hall and Annex Buildings',
            'description'               => 'One-year janitorial service contract for the main Municipal Hall, Annex A, and Health Center buildings.',
            'category'                  => 'services',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 1800000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-001',
            'uacs_object_code'          => '50299990',
            'approved_budget_reference' => 'LB-2026-ORD-001',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-299-990',
            'implementing_unit'         => 'General Services Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q4',
            'fiscal_year'               => 2026,
            'justification'             => 'Current janitorial contract expiring end of Q1 2026. Need continuous service.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $requester->id,
            'approved_by'               => $hope->id,
            'approved_at'               => now()->subDays(10),
            'submitted_at'              => now()->subDays(15),
            'budget_certified_by'       => $budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(12),
        ]);

        // PR for Janitorial - at "pending_dh_endorsement" stage
        $prJan = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-GSO-0001',
            'app_entry_id'          => $appJanitorial->id,
            'department_id'         => $gsoDept->id,
            'requester_id'          => $requester->id,
            'purpose'               => 'Janitorial services for all municipal buildings. Current contract ending April 30, 2026.',
            'date_required'         => now()->addDays(20),
            'urgency_level'         => 'urgent',
            'total_value'           => 1750000.00,
            'status'                => 'pending_dh_endorsement',
            'procurement_mode'      => 'competitive_bidding',
            'submitted_at'          => now()->subDays(2),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-299-990',
        ]);

        PrLineItem::create([
            'purchase_requisition_id' => $prJan->id,
            'item_description'        => 'Janitorial Services (12 months) - Municipal Hall Main Building',
            'unit_of_measure'         => 'months',
            'quantity'                => 12,
            'estimated_unit_cost'     => 95000.00,
            'estimated_total_cost'    => 1140000.00,
            'sort_order'              => 1,
        ]);

        PrLineItem::create([
            'purchase_requisition_id' => $prJan->id,
            'item_description'        => 'Janitorial Services (12 months) - Annex A and Health Center',
            'unit_of_measure'         => 'months',
            'quantity'                => 12,
            'estimated_unit_cost'     => 50833.33,
            'estimated_total_cost'    => 610000.00,
            'sort_order'              => 2,
        ]);

        // PR for another APP - at "pending_budget_certification" stage
        $appMedSupplies = AppEntry::where('project_title', 'like', '%Medical Supplies%')->first();
        if ($appMedSupplies) {
            $prPendingBudget = PurchaseRequisition::create([
                'pr_reference'         => 'PR-2026-MHO-0002',
                'app_entry_id'          => $appMedSupplies->id,
                'department_id'         => Department::where('code', 'MHO')->first()->id,
                'requester_id'          => $requester->id,
                'purpose'               => 'Additional medical supplies for expanded immunization program - supplemental batch.',
                'date_required'         => now()->addDays(45),
                'urgency_level'         => 'routine',
                'total_value'           => 280000.00,
                'status'                => 'pending_budget_certification',
                'procurement_mode'      => 'small_value_procurement',
                'submitted_at'          => now()->subDays(4),
                'endorsed_by'           => $requester->id,
                'endorsed_at'           => now()->subDays(3),
'fund_source'           => 'General Fund',
                'account_code'          => '100-203-010',
            ]);

            PrLineItem::create([
                'purchase_requisition_id' => $prPendingBudget->id,
                'item_description'        => 'BCG Vaccine (20-dose vial)',
                'unit_of_measure'         => 'vials',
                'quantity'                => 100,
                'estimated_unit_cost'     => 800.00,
                'estimated_total_cost'    => 80000.00,
                'sort_order'              => 1,
            ]);

            PrLineItem::create([
                'purchase_requisition_id' => $prPendingBudget->id,
                'item_description'        => 'Pentavalent Vaccine (10-dose vial)',
                'unit_of_measure'         => 'vials',
                'quantity'                => 200,
                'estimated_unit_cost'     => 600.00,
                'estimated_total_cost'    => 120000.00,
                'sort_order'              => 2,
            ]);

            PrLineItem::create([
                'purchase_requisition_id' => $prPendingBudget->id,
                'item_description'        => 'Disposable Syringes 1ml (100pcs/box)',
                'unit_of_measure'         => 'boxes',
                'quantity'                => 50,
                'estimated_unit_cost'     => 1600.00,
                'estimated_total_cost'    => 80000.00,
                'sort_order'              => 3,
            ]);
        }

        $this->command->info('   ✅ Additional entries created:');
        $this->command->info('      - MEO Road Repair (draft)');
        $this->command->info('      - MSWD Food Packs (submitted)');
        $this->command->info('      - GSO Office Supplies (pending_budget_certification)');
        $this->command->info('      - MAO Farm Equipment (pending_hope_approval)');
        $this->command->info('      - GSO Janitorial (approved + PR pending endorsement)');
        $this->command->info('      - MHO Supplemental Medical (PR pending budget certification)');

        // ── PR at "mode_confirmed" status (ready for invitation creation) ───
        $appJanFresh = AppEntry::where('project_title', 'like', '%Janitorial%')->first();
        if ($appJanFresh) {
            $prModeConfirmed = PurchaseRequisition::create([
                'pr_reference'         => 'PR-2026-GSO-0002',
                'app_entry_id'          => $appJanFresh->id,
                'department_id'         => $gsoDept->id,
                'requester_id'          => $requester->id,
                'purpose'               => 'Security guard services for Municipal Hall complex - 12-month contract for 4 guards (2 shifts).',
                'date_required'         => now()->addDays(30),
                'urgency_level'         => 'urgent',
                'total_value'           => 1680000.00,
                'status'                => 'mode_confirmed',
                'procurement_mode'      => 'competitive_bidding',
                'recommended_mode'      => 'competitive_bidding',
                'endorsed_by'           => $requester->id,
                'endorsed_at'           => now()->subDays(10),
                'budget_certified_by'   => $budgetOfficer->id,
                'budget_certified_at'   => now()->subDays(8),
                'accepted_by'           => $secretariat->id,
                'accepted_at'           => now()->subDays(6),
                'submitted_at'          => now()->subDays(12),
                'fund_source'           => 'General Fund',
                'account_code'          => '100-299-990',
                'mode_confirmed_by'     => $chairperson->id,
                'mode_confirmed_at'     => now()->subDays(4),
            ]);

            PrLineItem::create([
                'purchase_requisition_id' => $prModeConfirmed->id,
                'item_description'        => 'Security Guard Services (12 months) - Municipal Hall & Annex',
                'unit_of_measure'         => 'months',
                'quantity'                => 12,
                'estimated_unit_cost'     => 140000.00,
                'estimated_total_cost'    => 1680000.00,
                'sort_order'              => 1,
            ]);
            $this->command->info('      - GSO Security Guards (PR mode_confirmed - ready for invitation)');
        }
    }
}
