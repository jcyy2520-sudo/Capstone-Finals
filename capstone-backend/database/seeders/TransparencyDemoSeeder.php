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
use App\Models\BlockchainEvent;
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
 * Seeds 6 procurements at varying lifecycle stages with full blockchain events.
 *
 * 1. School Building (Competitive Bidding) - COMPLETED (contract done, payment recorded)
 * 2. Medical Equipment (Competitive Bidding) - COMPLETED (contract done)
 * 3. Road Rehabilitation (Competitive Bidding) - COMPLETED (contract done)
 * 4. IT Infrastructure (SVP/RFQ) - AT AWARD STAGE (NOA issued, contract active)
 * 5. Office Furniture (Shopping) - MID-PROCESS (evaluation stage)
 * 6. Agricultural Inputs (Competitive Bidding) - EARLY STAGE (ITB posted, no bids yet)
 */
class TransparencyDemoSeeder extends Seeder
{
    private User $requester;
    private User $secretariat;
    private User $chairperson;
    private User $budgetOfficer;
    private User $hope;
    private User $twg;
    private $bacMembers;
    private $vendors;

    public function run(): void
    {
        $this->command->info('Cleaning previous transparency demo data...');
        $this->cleanPreviousRun();

        $this->command->info('Loading users and vendors...');
        $this->loadActors();

        $this->command->info('Seeding 6 transparency demo procurements with blockchain events...');

        $this->seedProject1_Completed_SchoolBuilding();
        $this->seedProject2_Completed_MedicalEquipment();
        $this->seedProject3_Completed_RoadRehab();
        $this->seedProject4_AtAward_ITInfra();
        $this->seedProject5_MidProcess_OfficeFurniture();
        $this->seedProject6_EarlyStage_AgriInputs();

        $this->command->info('✅ Transparency demo: 6 procurements seeded with blockchain events.');
    }

    /**
     * Remove data from a previous run of this seeder.
     * Identifies our records by the reference number patterns we use.
     */
    private function cleanPreviousRun(): void
    {
        $ourPrRefs = [
            'PR-2026-MEO-0010', 'PR-2026-MHO-0010', 'PR-2026-MEO-0011',
            'PR-2026-ITO-0010', 'PR-2026-GSO-0010', 'PR-2026-MAO-0010',
        ];
        $ourInvRefs = [
            'ITB-2026-0010', 'ITB-2026-0011', 'ITB-2026-0012', 'ITB-2026-0013',
            'RFQ-2026-0010', 'RFQ-2026-0011',
        ];
        $ourNoaRefs = [
            'NOA-2026-9010', 'NOA-2026-9011', 'NOA-2026-9012', 'NOA-2026-9013',
        ];

        // Get IDs for cascade cleanup
        $prIds = PurchaseRequisition::whereIn('pr_reference', $ourPrRefs)->pluck('id');
        $invIds = Invitation::whereIn('reference_number', $ourInvRefs)->pluck('id');
        $openingIds = BidOpening::whereIn('invitation_id', $invIds)->pluck('id');
        $awardIds = Award::whereIn('invitation_id', $invIds)
            ->orWhereIn('noa_reference', $ourNoaRefs)
            ->pluck('id');

        // Delete in reverse dependency order
        Contract::whereIn('award_id', $awardIds)->delete();
        Award::whereIn('id', $awardIds)->delete();
        BacResolution::whereIn('invitation_id', $invIds)->delete();
        PostQualification::whereIn('invitation_id', $invIds)->delete();
        EvaluationSummary::whereIn('invitation_id', $invIds)->delete();
        Evaluation::whereIn('invitation_id', $invIds)->delete();
        BidPrice::whereIn('bid_opening_id', $openingIds)->delete();
        BidOpeningAttendance::whereIn('bid_opening_id', $openingIds)->delete();
        BidOpening::whereIn('id', $openingIds)->delete();
        BidSubmission::whereIn('invitation_id', $invIds)->delete();
        RfqInvitation::whereIn('invitation_id', $invIds)->delete();
        Invitation::whereIn('id', $invIds)->delete();
        PrLineItem::whereIn('purchase_requisition_id', $prIds)->delete();

        // Clean blockchain events for these procurements
        BlockchainEvent::whereIn('procurement_id', $prIds->map(fn ($id) => (string) $id))->delete();

        PurchaseRequisition::whereIn('id', $prIds)->delete();

        // Clean APP entries by project title patterns
        AppEntry::where('pap_code', 'like', 'PAP-2026-%-01%')->delete();
    }

    private function loadActors(): void
    {
        $this->requester     = User::where('email', 'requester@procureseal.gov.ph')->firstOrFail();
        $this->secretariat   = User::where('email', 'secretariat@procureseal.gov.ph')->firstOrFail();
        $this->chairperson   = User::where('email', 'bacchair@procureseal.gov.ph')->firstOrFail();
        $this->budgetOfficer = User::where('email', 'budget@procureseal.gov.ph')->firstOrFail();
        $this->hope          = User::where('email', 'hope@procureseal.gov.ph')->firstOrFail();
        $this->twg           = User::where('email', 'twg@procureseal.gov.ph')->firstOrFail();
        $this->bacMembers    = User::where('email', 'like', 'bac%@procureseal.gov.ph')
            ->whereHas('role', fn ($q) => $q->where('name', Role::BAC_MEMBER))
            ->get();

        // Ensure 3 approved vendors exist
        $this->vendors = Vendor::where('status', 'approved')->take(3)->get();
        if ($this->vendors->count() < 3) {
            $this->createDemoVendors();
            $this->vendors = Vendor::where('status', 'approved')->take(3)->get();
        }
    }

    private function createDemoVendors(): void
    {
        $vendorRole = Role::where('name', 'vendor')->first();
        $vendorData = [
            ['name' => 'Maricel Torres', 'email' => 'vendor1@procureseal.gov.ph', 'business_name' => 'Torres General Construction & Supply', 'philgeps' => 'PG-V00001'],
            ['name' => 'Ricardo Lim', 'email' => 'vendor2@procureseal.gov.ph', 'business_name' => 'Lim Brothers Trading Corp', 'philgeps' => 'PG-V00002'],
            ['name' => 'Angelica Santos', 'email' => 'vendor3@procureseal.gov.ph', 'business_name' => 'A. Santos Medical & IT Solutions', 'philgeps' => 'PG-V00003'],
        ];

        foreach ($vendorData as $v) {
            $user = User::updateOrCreate(
                ['email' => $v['email']],
                [
                    'name' => $v['name'],
                    'password' => bcrypt('ProcureSeal@2025'),
                    'role_id' => $vendorRole?->id,
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );

            Vendor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $v['business_name'],
                    'business_type' => 'corporation',
                    'dti_sec_cda_number' => 'SEC-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                    'philgeps_number' => $v['philgeps'],
                    'tin' => '000-' . rand(100, 999) . '-' . rand(100, 999) . '-000',
                    'address' => 'Metro Manila, Philippines',
                    'contact_person' => $v['name'],
                    'contact_email' => $v['email'],
                    'contact_mobile' => '09' . rand(100000000, 999999999),
                    'procurement_categories' => ['goods', 'infrastructure_works', 'consulting_services'],
                    'status' => 'approved',
                    'is_blacklisted' => false,
                    'email_verified_at' => now(),
                ]
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 1: COMPLETED — School Building Construction (Competitive Bidding)
    // Full lifecycle: APP → PR → Budget → Pre-Proc → ITB → Bids → Opening → Eval → PostQual → Resolution → NOA → NTP → Contract → Payment
    // ═══════════════════════════════════════════════════════════
    private function seedProject1_Completed_SchoolBuilding(): void
    {
        $dept = Department::where('code', 'MEO')->firstOrFail();

        // APP
        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Construction of 2-Storey, 4-Classroom School Building — Brgy. San Isidro Elementary School',
            'description'               => 'Construction of a new school building with 4 classrooms, comfort rooms, and ramp accessibility per DepEd standards.',
            'category'                  => 'infrastructure_works',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 8500000.00,
            'mfo_code'                  => 'MFO-INFRA',
            'mfo_name_snapshot'         => 'Infrastructure Development',
            'pap_code'                  => 'PAP-2026-INFRA-010',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-010',
            'fund_source'               => 'Special Education Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'Municipal Engineering Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q3',
            'fiscal_year'               => 2026,
            'justification'             => 'Severe classroom shortage. Brgy. San Isidro ES operates double-shift with 1:80 classroom-student ratio.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(120),
            'submitted_at'              => now()->subDays(125),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(122),
        ]);

        // PR
        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-MEO-0010',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Construction of 2-storey school building per DepEd standard design. Funded under SEF.',
            'date_required'         => now()->subDays(30),
            'urgency_level'         => 'urgent',
            'total_value'           => 8200000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'competitive_bidding',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(115),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(113),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(112),
            'submitted_at'          => now()->subDays(118),
            'fund_source'           => 'Special Education Fund',
            'account_code'          => '100-604-010',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(111),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Structural Works (Foundation, Columns, Beams, Slabs)', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 4200000.00],
            ['item_description' => 'Architectural Works (Walls, Doors, Windows, Finishes)', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 2100000.00],
            ['item_description' => 'Electrical Works (Lighting, Outlets, Panel Board)', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 950000.00],
            ['item_description' => 'Plumbing & Sanitary Works (CR, Water System)', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 750000.00],
        ]);

        // ITB
        $itb = Invitation::create([
            'reference_number'           => 'ITB-2026-0010',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'itb',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 8500000.00,
            'fund_source'                => 'Special Education Fund',
            'procurement_mode'           => 'competitive_bidding',
            'bid_document_cost'          => 10000.00,
            'eligibility_check_date'     => now()->subDays(100),
            'pre_bid_conference_date'    => now()->subDays(95),
            'submission_deadline'        => now()->subDays(85),
            'opening_date'               => now()->subDays(84),
            'opening_venue'              => 'BAC Conference Room, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'philgeps_reference'         => 'PHILGEPS-2026-0010',
            'delivery_location'          => 'Brgy. San Isidro Elementary School, San Rafael, Bulacan',
            'delivery_schedule'          => '120 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(105),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(106),
            'hope_approved_by'           => $this->hope->id,
            'hope_approved_at'           => now()->subDays(105),
        ]);

        // Bids
        $bidAmounts = [8050000.00, 8250000.00, 8400000.00];
        $this->createBids($itb, $bidAmounts, now()->subDays(86));

        // Bid Opening
        $opening = $this->createBidOpening($itb, now()->subDays(84), 'completed');
        $this->createBidPrices($opening, $bidAmounts);

        // Evaluations
        $this->createEvaluations($opening, $itb, $bidAmounts, now()->subDays(80));

        // Post-Qualification
        $pq = $this->createPostQualification($opening, $itb, $this->vendors[0], now()->subDays(70));

        // Resolution
        $res = $this->createResolution($itb, $this->vendors[0], $bidAmounts[0], now()->subDays(65));
        $pq->update(['bac_resolution_id' => $res->id]);

        // Award
        $award = Award::create([
            'noa_reference'              => 'NOA-2026-0010',
            'invitation_id'              => $itb->id,
            'bid_opening_id'             => $opening->id,
            'vendor_id'                  => $this->vendors[0]->id,
            'contract_amount'            => $bidAmounts[0],
            'performance_security_amount' => $bidAmounts[0] * 0.05,
            'performance_security_deadline' => now()->subDays(50),
            'contract_signing_deadline'  => now()->subDays(50),
            'status'                     => 'NTP_ISSUED',
            'hope_signed_by'             => $this->hope->id,
            'hope_signed_at'             => now()->subDays(62),
            'noa_issued_at'              => now()->subDays(62),
            'noa_acknowledgment_deadline' => now()->subDays(55),
            'noa_acknowledged_at'        => now()->subDays(58),
            'ntp_issued_at'              => now()->subDays(55),
            'ntp_date'                   => now()->subDays(55),
        ]);

        // Contract — completed
        Contract::create([
            'contract_reference'     => 'CTR-2026-MEO-0010',
            'award_id'               => $award->id,
            'vendor_id'              => $this->vendors[0]->id,
            'purchase_requisition_id' => $pr->id,
            'ntp_date'               => now()->subDays(55),
            'duration_days'          => 120,
            'end_date'               => now()->subDays(55)->addDays(120),
            'contract_amount'        => $bidAmounts[0],
            'progress_percentage'    => 100,
            'status'                 => 'completed',
        ]);

        // BLOCKCHAIN EVENTS — Full lifecycle
        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(120));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(112));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(113));
        $this->fire($procId, 'PRE_PROCUREMENT_CONFERENCE_APPROVED', $this->chairperson->id, 'Invitation', $itb->id, now()->subDays(108));
        $this->fire($procId, BlockchainEvent::ITB_POSTED, $this->secretariat->id, 'Invitation', $itb->id, now()->subDays(105));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[0]->user_id, 'BidSubmission', null, now()->subDays(86));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[1]->user_id, 'BidSubmission', null, now()->subDays(86));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[2]->user_id, 'BidSubmission', null, now()->subDays(86));
        $this->fire($procId, BlockchainEvent::BID_OPENING_COMPLETED, $this->chairperson->id, 'BidOpening', $opening->id, now()->subDays(84));
        $this->fire($procId, BlockchainEvent::EVALUATION_COMPLETED, $this->chairperson->id, 'EvaluationSummary', null, now()->subDays(80));
        $this->fire($procId, BlockchainEvent::POST_QUAL_COMPLETED, $this->twg->id, 'PostQualification', $pq->id, now()->subDays(70));
        $this->fire($procId, 'HOPE_APPROVED_RESOLUTION', $this->hope->id, 'BacResolution', $res->id, now()->subDays(65));
        $this->fire($procId, BlockchainEvent::NOA_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(62));
        $this->fire($procId, 'NOA_ACKNOWLEDGED', $this->vendors[0]->user_id, 'Award', $award->id, now()->subDays(58));
        $this->fire($procId, BlockchainEvent::NTP_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(55));
        $this->fire($procId, BlockchainEvent::CONTRACT_SIGNED, $this->hope->id, 'Contract', null, now()->subDays(53));
        $this->fire($procId, 'PAYMENT_RECORDED', $this->budgetOfficer->id, 'Contract', null, now()->subDays(10));

        $this->command->info('   ✅ #1 School Building — COMPLETED (full lifecycle, 17 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 2: COMPLETED — Medical Equipment (Competitive Bidding)
    // ═══════════════════════════════════════════════════════════
    private function seedProject2_Completed_MedicalEquipment(): void
    {
        $dept = Department::where('code', 'MHO')->firstOrFail();

        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Procurement of Digital X-Ray Machine and Ultrasound Equipment for Rural Health Unit',
            'description'               => 'Acquisition of diagnostic imaging equipment for the main RHU to reduce referral cases to provincial hospital.',
            'category'                  => 'goods',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 4200000.00,
            'mfo_code'                  => 'MFO-HEALTH',
            'mfo_name_snapshot'         => 'Public Health Services',
            'pap_code'                  => 'PAP-2026-HEALTH-010',
            'uacs_object_code'          => '50604020',
            'approved_budget_reference' => 'LB-2026-ORD-011',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-020',
            'implementing_unit'         => 'Municipal Health Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'RHU handles 500+ patients/month. No diagnostic imaging available — all cases referred to provincial hospital at PHP 800/trip cost to patients.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(100),
            'submitted_at'              => now()->subDays(105),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(102),
        ]);

        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-MHO-0010',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Diagnostic imaging equipment for RHU — X-ray and ultrasound machines with installation and training.',
            'date_required'         => now()->subDays(20),
            'urgency_level'         => 'urgent',
            'total_value'           => 4000000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'competitive_bidding',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(95),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(93),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(92),
            'submitted_at'          => now()->subDays(98),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-604-020',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(91),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Digital X-Ray Machine (Fixed, 500mA) with CR System', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 2800000.00],
            ['item_description' => 'Portable Ultrasound Machine (Color Doppler, 3 Probes)', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 1200000.00],
        ]);

        $itb = Invitation::create([
            'reference_number'           => 'ITB-2026-0011',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'itb',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 4200000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'competitive_bidding',
            'bid_document_cost'          => 5000.00,
            'eligibility_check_date'     => now()->subDays(80),
            'pre_bid_conference_date'    => now()->subDays(75),
            'submission_deadline'        => now()->subDays(65),
            'opening_date'               => now()->subDays(64),
            'opening_venue'              => 'BAC Conference Room, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'philgeps_reference'         => 'PHILGEPS-2026-0011',
            'delivery_location'          => 'Municipal Health Office, San Rafael, Bulacan',
            'delivery_schedule'          => '45 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(85),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(86),
            'hope_approved_by'           => $this->hope->id,
            'hope_approved_at'           => now()->subDays(85),
        ]);

        $bidAmounts = [3950000.00, 4100000.00, 4180000.00];
        $this->createBids($itb, $bidAmounts, now()->subDays(66));
        $opening = $this->createBidOpening($itb, now()->subDays(64), 'completed');
        $this->createBidPrices($opening, $bidAmounts);
        $this->createEvaluations($opening, $itb, $bidAmounts, now()->subDays(60));
        $pq = $this->createPostQualification($opening, $itb, $this->vendors[0], now()->subDays(50));
        $res = $this->createResolution($itb, $this->vendors[0], $bidAmounts[0], now()->subDays(45));
        $pq->update(['bac_resolution_id' => $res->id]);

        $award = Award::create([
            'noa_reference'              => 'NOA-2026-9011',
            'invitation_id'              => $itb->id,
            'bid_opening_id'             => $opening->id,
            'vendor_id'                  => $this->vendors[0]->id,
            'contract_amount'            => $bidAmounts[0],
            'performance_security_amount' => $bidAmounts[0] * 0.05,
            'performance_security_deadline' => now()->subDays(30),
            'contract_signing_deadline'  => now()->subDays(30),
            'status'                     => 'NTP_ISSUED',
            'hope_signed_by'             => $this->hope->id,
            'hope_signed_at'             => now()->subDays(42),
            'noa_issued_at'              => now()->subDays(42),
            'noa_acknowledgment_deadline' => now()->subDays(35),
            'noa_acknowledged_at'        => now()->subDays(38),
            'ntp_issued_at'              => now()->subDays(35),
            'ntp_date'                   => now()->subDays(35),
        ]);

        Contract::create([
            'contract_reference'     => 'CTR-2026-MHO-0010',
            'award_id'               => $award->id,
            'vendor_id'              => $this->vendors[0]->id,
            'purchase_requisition_id' => $pr->id,
            'ntp_date'               => now()->subDays(35),
            'duration_days'          => 45,
            'end_date'               => now()->subDays(35)->addDays(45),
            'contract_amount'        => $bidAmounts[0],
            'progress_percentage'    => 100,
            'status'                 => 'completed',
        ]);

        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(100));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(92));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(93));
        $this->fire($procId, 'PRE_PROCUREMENT_CONFERENCE_APPROVED', $this->chairperson->id, 'Invitation', $itb->id, now()->subDays(88));
        $this->fire($procId, BlockchainEvent::ITB_POSTED, $this->secretariat->id, 'Invitation', $itb->id, now()->subDays(85));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[0]->user_id, 'BidSubmission', null, now()->subDays(66));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[1]->user_id, 'BidSubmission', null, now()->subDays(66));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[2]->user_id, 'BidSubmission', null, now()->subDays(66));
        $this->fire($procId, BlockchainEvent::BID_OPENING_COMPLETED, $this->chairperson->id, 'BidOpening', $opening->id, now()->subDays(64));
        $this->fire($procId, BlockchainEvent::EVALUATION_COMPLETED, $this->chairperson->id, 'EvaluationSummary', null, now()->subDays(60));
        $this->fire($procId, BlockchainEvent::POST_QUAL_COMPLETED, $this->twg->id, 'PostQualification', $pq->id, now()->subDays(50));
        $this->fire($procId, 'HOPE_APPROVED_RESOLUTION', $this->hope->id, 'BacResolution', $res->id, now()->subDays(45));
        $this->fire($procId, BlockchainEvent::NOA_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(42));
        $this->fire($procId, 'NOA_ACKNOWLEDGED', $this->vendors[0]->user_id, 'Award', $award->id, now()->subDays(38));
        $this->fire($procId, BlockchainEvent::NTP_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(35));
        $this->fire($procId, BlockchainEvent::CONTRACT_SIGNED, $this->hope->id, 'Contract', null, now()->subDays(33));

        $this->command->info('   ✅ #2 Medical Equipment — COMPLETED (16 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 3: COMPLETED — Road Rehabilitation (Competitive Bidding)
    // ═══════════════════════════════════════════════════════════
    private function seedProject3_Completed_RoadRehab(): void
    {
        $dept = Department::where('code', 'MEO')->firstOrFail();

        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Rehabilitation of Municipal Road Network — Brgy. Caingin to Brgy. Pangrisan (2.5 km)',
            'description'               => 'Asphalt overlay and drainage improvement of 2.5 km municipal road connecting two barangays. Includes road markings and guardrails.',
            'category'                  => 'infrastructure_works',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 12000000.00,
            'mfo_code'                  => 'MFO-INFRA',
            'mfo_name_snapshot'         => 'Infrastructure Development',
            'pap_code'                  => 'PAP-2026-INFRA-011',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-012',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'Municipal Engineering Office',
            'unit_of_measurement'       => 'km',
            'quantity'                   => 3,
            'target_start_quarter'      => 'Q1',
            'target_completion_quarter'  => 'Q3',
            'fiscal_year'               => 2026,
            'justification'             => 'Road is primary access route for 3 barangays with combined population of 12,000. Current condition rated "Poor" per DPWH road inventory.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(150),
            'submitted_at'              => now()->subDays(155),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(152),
        ]);

        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-MEO-0011',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Road rehabilitation — asphalt overlay and drainage system for Caingin-Pangrisan road.',
            'date_required'         => now()->subDays(50),
            'urgency_level'         => 'routine',
            'total_value'           => 11500000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'competitive_bidding',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(145),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(143),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(142),
            'submitted_at'          => now()->subDays(148),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-604-010',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(141),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Road Clearing and Earthworks', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 1500000.00],
            ['item_description' => 'Sub-base and Base Course', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 3200000.00],
            ['item_description' => 'Asphalt Overlay (50mm thick)', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 4800000.00],
            ['item_description' => 'Drainage System and Culverts', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 1500000.00],
            ['item_description' => 'Road Markings and Guardrails', 'unit_of_measure' => 'lot', 'quantity' => 1, 'estimated_unit_cost' => 500000.00],
        ]);

        $itb = Invitation::create([
            'reference_number'           => 'ITB-2026-0012',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'itb',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 12000000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'competitive_bidding',
            'bid_document_cost'          => 15000.00,
            'eligibility_check_date'     => now()->subDays(130),
            'pre_bid_conference_date'    => now()->subDays(125),
            'submission_deadline'        => now()->subDays(115),
            'opening_date'               => now()->subDays(114),
            'opening_venue'              => 'BAC Conference Room, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'philgeps_reference'         => 'PHILGEPS-2026-0012',
            'delivery_location'          => 'Brgy. Caingin to Brgy. Pangrisan Road, San Rafael, Bulacan',
            'delivery_schedule'          => '150 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(135),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(136),
            'hope_approved_by'           => $this->hope->id,
            'hope_approved_at'           => now()->subDays(135),
        ]);

        $bidAmounts = [11200000.00, 11600000.00, 11850000.00];
        $this->createBids($itb, $bidAmounts, now()->subDays(116));
        $opening = $this->createBidOpening($itb, now()->subDays(114), 'completed');
        $this->createBidPrices($opening, $bidAmounts);
        $this->createEvaluations($opening, $itb, $bidAmounts, now()->subDays(110));
        $pq = $this->createPostQualification($opening, $itb, $this->vendors[0], now()->subDays(100));
        $res = $this->createResolution($itb, $this->vendors[0], $bidAmounts[0], now()->subDays(95));
        $pq->update(['bac_resolution_id' => $res->id]);

        $award = Award::create([
            'noa_reference'              => 'NOA-2026-9012',
            'invitation_id'              => $itb->id,
            'bid_opening_id'             => $opening->id,
            'vendor_id'                  => $this->vendors[0]->id,
            'contract_amount'            => $bidAmounts[0],
            'performance_security_amount' => $bidAmounts[0] * 0.05,
            'performance_security_deadline' => now()->subDays(80),
            'contract_signing_deadline'  => now()->subDays(80),
            'status'                     => 'NTP_ISSUED',
            'hope_signed_by'             => $this->hope->id,
            'hope_signed_at'             => now()->subDays(92),
            'noa_issued_at'              => now()->subDays(92),
            'noa_acknowledgment_deadline' => now()->subDays(85),
            'noa_acknowledged_at'        => now()->subDays(88),
            'ntp_issued_at'              => now()->subDays(85),
            'ntp_date'                   => now()->subDays(85),
        ]);

        Contract::create([
            'contract_reference'     => 'CTR-2026-MEO-0011',
            'award_id'               => $award->id,
            'vendor_id'              => $this->vendors[0]->id,
            'purchase_requisition_id' => $pr->id,
            'ntp_date'               => now()->subDays(85),
            'duration_days'          => 150,
            'end_date'               => now()->subDays(85)->addDays(150),
            'contract_amount'        => $bidAmounts[0],
            'progress_percentage'    => 100,
            'status'                 => 'completed',
        ]);

        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(150));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(142));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(143));
        $this->fire($procId, 'PRE_PROCUREMENT_CONFERENCE_APPROVED', $this->chairperson->id, 'Invitation', $itb->id, now()->subDays(138));
        $this->fire($procId, BlockchainEvent::ITB_POSTED, $this->secretariat->id, 'Invitation', $itb->id, now()->subDays(135));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[0]->user_id, 'BidSubmission', null, now()->subDays(116));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[1]->user_id, 'BidSubmission', null, now()->subDays(116));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[2]->user_id, 'BidSubmission', null, now()->subDays(116));
        $this->fire($procId, BlockchainEvent::BID_OPENING_COMPLETED, $this->chairperson->id, 'BidOpening', $opening->id, now()->subDays(114));
        $this->fire($procId, BlockchainEvent::EVALUATION_COMPLETED, $this->chairperson->id, 'EvaluationSummary', null, now()->subDays(110));
        $this->fire($procId, BlockchainEvent::POST_QUAL_COMPLETED, $this->twg->id, 'PostQualification', $pq->id, now()->subDays(100));
        $this->fire($procId, 'HOPE_APPROVED_RESOLUTION', $this->hope->id, 'BacResolution', $res->id, now()->subDays(95));
        $this->fire($procId, BlockchainEvent::NOA_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(92));
        $this->fire($procId, 'NOA_ACKNOWLEDGED', $this->vendors[0]->user_id, 'Award', $award->id, now()->subDays(88));
        $this->fire($procId, BlockchainEvent::NTP_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(85));
        $this->fire($procId, BlockchainEvent::CONTRACT_SIGNED, $this->hope->id, 'Contract', null, now()->subDays(83));
        $this->fire($procId, 'PAYMENT_RECORDED', $this->budgetOfficer->id, 'Contract', null, now()->subDays(5));

        $this->command->info('   ✅ #3 Road Rehabilitation — COMPLETED (17 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 4: AT AWARD — IT Infrastructure (SVP/RFQ)
    // Lifecycle: APP → PR → Budget → RFQ Sent → Bids → Opening → Eval → PostQual → Resolution → NOA → (pending NTP)
    // ═══════════════════════════════════════════════════════════
    private function seedProject4_AtAward_ITInfra(): void
    {
        $dept = Department::where('code', 'ITO')->firstOrFail();

        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Procurement of Server and Network Security Infrastructure',
            'description'               => 'Server rack, firewall appliance, UPS system, and network switches for the municipal data center upgrade.',
            'category'                  => 'goods',
            'mode'                      => 'small_value_procurement',
            'abc'                       => 490000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-010',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-013',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'Information Technology Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Current server is 8 years old with no redundancy. Network has no firewall — direct security risk.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(40),
            'submitted_at'              => now()->subDays(45),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(42),
        ]);

        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-ITO-0010',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Server and network security hardware for municipal data center.',
            'date_required'         => now()->addDays(15),
            'urgency_level'         => 'urgent',
            'total_value'           => 475000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'small_value_procurement',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(35),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(33),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(32),
            'submitted_at'          => now()->subDays(38),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-604-010',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(31),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Tower Server (Xeon E-2400, 64GB ECC, 4x2TB RAID)', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 180000.00],
            ['item_description' => 'Next-Gen Firewall Appliance (UTM, VPN, IDS/IPS)', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 120000.00],
            ['item_description' => 'Online UPS 3kVA Rack-Mount', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 85000.00],
            ['item_description' => 'Managed PoE Switch 24-Port + SFP', 'unit_of_measure' => 'unit', 'quantity' => 2, 'estimated_unit_cost' => 45000.00],
        ]);

        $rfq = Invitation::create([
            'reference_number'           => 'RFQ-2026-0010',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'rfq',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 490000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'small_value_procurement',
            'submission_deadline'        => now()->subDays(18),
            'opening_date'               => now()->subDays(17),
            'opening_venue'              => 'BAC Office, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'delivery_location'          => 'ITO Server Room, Municipal Hall',
            'delivery_schedule'          => '15 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(25),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(26),
        ]);

        foreach ($this->vendors as $vendor) {
            RfqInvitation::create([
                'invitation_id' => $rfq->id,
                'vendor_id'     => $vendor->id,
                'sent_at'       => now()->subDays(25),
                'read_at'       => now()->subDays(24),
                'submitted_at'  => now()->subDays(19),
                'status'        => 'submitted',
            ]);
        }

        $bidAmounts = [460000.00, 472000.00, 485000.00];
        $this->createBids($rfq, $bidAmounts, now()->subDays(19));
        $opening = $this->createBidOpening($rfq, now()->subDays(17), 'completed');
        $this->createBidPrices($opening, $bidAmounts);
        $this->createEvaluations($opening, $rfq, $bidAmounts, now()->subDays(14));
        $pq = $this->createPostQualification($opening, $rfq, $this->vendors[0], now()->subDays(10));
        $res = $this->createResolution($rfq, $this->vendors[0], $bidAmounts[0], now()->subDays(7));
        $pq->update(['bac_resolution_id' => $res->id]);

        $award = Award::create([
            'noa_reference'              => 'NOA-2026-9013',
            'invitation_id'              => $rfq->id,
            'bid_opening_id'             => $opening->id,
            'vendor_id'                  => $this->vendors[0]->id,
            'contract_amount'            => $bidAmounts[0],
            'performance_security_amount' => $bidAmounts[0] * 0.05,
            'performance_security_deadline' => now()->addDays(10),
            'contract_signing_deadline'  => now()->addDays(10),
            'status'                     => 'ACKNOWLEDGED',
            'hope_signed_by'             => $this->hope->id,
            'hope_signed_at'             => now()->subDays(4),
            'noa_issued_at'              => now()->subDays(4),
            'noa_acknowledgment_deadline' => now()->addDays(3),
            'noa_acknowledged_at'        => now()->subDays(2),
        ]);

        // Blockchain events — SVP lifecycle (no pre-procurement conference for SVP)
        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(40));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(32));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(33));
        $this->fire($procId, BlockchainEvent::RFQ_SENT, $this->secretariat->id, 'Invitation', $rfq->id, now()->subDays(25));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[0]->user_id, 'BidSubmission', null, now()->subDays(19));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[1]->user_id, 'BidSubmission', null, now()->subDays(19));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[2]->user_id, 'BidSubmission', null, now()->subDays(19));
        $this->fire($procId, BlockchainEvent::BID_OPENING_COMPLETED, $this->chairperson->id, 'BidOpening', $opening->id, now()->subDays(17));
        $this->fire($procId, BlockchainEvent::EVALUATION_COMPLETED, $this->chairperson->id, 'EvaluationSummary', null, now()->subDays(14));
        $this->fire($procId, BlockchainEvent::POST_QUAL_COMPLETED, $this->twg->id, 'PostQualification', $pq->id, now()->subDays(10));
        $this->fire($procId, 'HOPE_APPROVED_RESOLUTION', $this->hope->id, 'BacResolution', $res->id, now()->subDays(7));
        $this->fire($procId, BlockchainEvent::NOA_ISSUED, $this->hope->id, 'Award', $award->id, now()->subDays(4));
        $this->fire($procId, 'NOA_ACKNOWLEDGED', $this->vendors[0]->user_id, 'Award', $award->id, now()->subDays(2));

        $this->command->info('   ✅ #4 IT Infrastructure (SVP) — AT AWARD, NOA acknowledged, awaiting NTP (13 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 5: MID-PROCESS — Office Furniture (Shopping)
    // Lifecycle: APP → PR → Budget → RFQ Sent → Bids → Opening → (evaluation in progress)
    // ═══════════════════════════════════════════════════════════
    private function seedProject5_MidProcess_OfficeFurniture(): void
    {
        $dept = Department::where('code', 'GSO')->firstOrFail();

        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Procurement of Executive Office Furniture for Municipal Hall Renovation',
            'description'               => 'Office desks, ergonomic chairs, filing cabinets, and conference table for renovated offices.',
            'category'                  => 'goods',
            'mode'                      => 'shopping',
            'abc'                       => 350000.00,
            'mfo_code'                  => 'MFO-GEN',
            'mfo_name_snapshot'         => 'General Administrative Services',
            'pap_code'                  => 'PAP-2026-GEN-011',
            'uacs_object_code'          => '50604010',
            'approved_budget_reference' => 'LB-2026-ORD-014',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-604-010',
            'implementing_unit'         => 'General Services Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q2',
            'fiscal_year'               => 2026,
            'justification'             => 'Municipal Hall renovation completed. Existing furniture damaged and non-ergonomic per DOLE standards.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(25),
            'submitted_at'              => now()->subDays(30),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(27),
        ]);

        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-GSO-0010',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Office furniture for renovated Municipal Hall offices.',
            'date_required'         => now()->addDays(20),
            'urgency_level'         => 'routine',
            'total_value'           => 340000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'shopping',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(20),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(18),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(17),
            'submitted_at'          => now()->subDays(22),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-604-010',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(16),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Executive Office Desk (L-shaped, 160x140cm) with Drawer Pedestal', 'unit_of_measure' => 'unit', 'quantity' => 5, 'estimated_unit_cost' => 25000.00],
            ['item_description' => 'Ergonomic Mesh Office Chair (High-back, Adjustable)', 'unit_of_measure' => 'unit', 'quantity' => 10, 'estimated_unit_cost' => 12000.00],
            ['item_description' => '4-Drawer Steel Filing Cabinet (Legal Size, Lock)', 'unit_of_measure' => 'unit', 'quantity' => 8, 'estimated_unit_cost' => 8000.00],
            ['item_description' => 'Conference Table (Oval, 10-seater, Melamine)', 'unit_of_measure' => 'unit', 'quantity' => 1, 'estimated_unit_cost' => 35000.00],
        ]);

        $rfq = Invitation::create([
            'reference_number'           => 'RFQ-2026-0011',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'rfq',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 350000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'shopping',
            'submission_deadline'        => now()->subDays(5),
            'opening_date'               => now()->subDays(4),
            'opening_venue'              => 'BAC Office, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'delivery_location'          => 'Municipal Hall, San Rafael, Bulacan',
            'delivery_schedule'          => '10 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(12),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(13),
        ]);

        foreach ($this->vendors as $vendor) {
            RfqInvitation::create([
                'invitation_id' => $rfq->id,
                'vendor_id'     => $vendor->id,
                'sent_at'       => now()->subDays(12),
                'read_at'       => now()->subDays(11),
                'submitted_at'  => now()->subDays(6),
                'status'        => 'submitted',
            ]);
        }

        $bidAmounts = [325000.00, 335000.00, 348000.00];
        $this->createBids($rfq, $bidAmounts, now()->subDays(6));
        $opening = $this->createBidOpening($rfq, now()->subDays(4), 'completed');
        $this->createBidPrices($opening, $bidAmounts);

        // Evaluations started but not approved yet
        foreach ($this->bacMembers->take(2) as $evaluator) {
            foreach ($this->vendors as $vendor) {
                Evaluation::create([
                    'bid_opening_id' => $opening->id,
                    'invitation_id'  => $rfq->id,
                    'evaluator_id'   => $evaluator->id,
                    'evaluator_role' => 'bac_member',
                    'vendor_id'      => $vendor->id,
                    'technical_items' => json_encode([
                        ['item' => 'Compliance with Specifications', 'result' => 'pass', 'remarks' => 'Meets specs'],
                    ]),
                    'calculated_price' => $bidAmounts[$this->vendors->search($vendor)],
                    'recommendation'   => 'responsive',
                    'overall_remarks'  => 'Quotation responsive.',
                    'status'           => 'submitted',
                    'submitted_at'     => now()->subDays(2),
                ]);
            }
        }

        // Blockchain events — Shopping lifecycle (no pre-procurement conference)
        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(25));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(17));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(18));
        $this->fire($procId, BlockchainEvent::RFQ_SENT, $this->secretariat->id, 'Invitation', $rfq->id, now()->subDays(12));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[0]->user_id, 'BidSubmission', null, now()->subDays(6));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[1]->user_id, 'BidSubmission', null, now()->subDays(6));
        $this->fire($procId, 'BID_SUBMITTED', $this->vendors[2]->user_id, 'BidSubmission', null, now()->subDays(6));
        $this->fire($procId, BlockchainEvent::BID_OPENING_COMPLETED, $this->chairperson->id, 'BidOpening', $opening->id, now()->subDays(4));

        $this->command->info('   ✅ #5 Office Furniture (Shopping) — MID-PROCESS, evaluation stage (8 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // PROJECT 6: EARLY STAGE — Agricultural Inputs (Competitive Bidding)
    // Lifecycle: APP → PR → Budget → Pre-Proc → ITB Posted → (waiting for bids)
    // ═══════════════════════════════════════════════════════════
    private function seedProject6_EarlyStage_AgriInputs(): void
    {
        $dept = Department::where('code', 'MAO')->firstOrFail();

        $app = AppEntry::create([
            'department_id'             => $dept->id,
            'project_title'             => 'Procurement of High-Yield Rice Seeds and Organic Fertilizer for Farmer Support Program',
            'description'               => 'Distribution of certified rice seeds and organic fertilizer to 300 registered farmers under the municipal agriculture support program.',
            'category'                  => 'goods',
            'mode'                      => 'competitive_bidding',
            'abc'                       => 2500000.00,
            'mfo_code'                  => 'MFO-AGRI',
            'mfo_name_snapshot'         => 'Agricultural Services',
            'pap_code'                  => 'PAP-2026-AGRI-010',
            'uacs_object_code'          => '50203090',
            'approved_budget_reference' => 'LB-2026-ORD-015',
            'fund_source'               => 'General Fund',
            'account_code'              => '100-203-090',
            'implementing_unit'         => 'Municipal Agriculture Office',
            'unit_of_measurement'       => 'lot',
            'quantity'                   => 1,
            'target_start_quarter'      => 'Q2',
            'target_completion_quarter'  => 'Q3',
            'fiscal_year'               => 2026,
            'justification'             => 'Wet season planting begins June. Farmers need certified seeds and fertilizer by May. Program covers 300 registered farmers in 12 barangays.',
            'status'                    => 'approved',
            'is_supplemental'           => false,
            'version'                   => 1,
            'created_by'                => $this->requester->id,
            'approved_by'               => $this->hope->id,
            'approved_at'               => now()->subDays(15),
            'submitted_at'              => now()->subDays(20),
            'budget_certified_by'       => $this->budgetOfficer->id,
            'budget_certified_at'       => now()->subDays(17),
        ]);

        $pr = PurchaseRequisition::create([
            'pr_reference'         => 'PR-2026-MAO-0010',
            'app_entry_id'          => $app->id,
            'department_id'         => $dept->id,
            'requester_id'          => $this->requester->id,
            'purpose'               => 'Rice seeds and organic fertilizer for wet season planting — 300 farmer beneficiaries.',
            'date_required'         => now()->addDays(45),
            'urgency_level'         => 'routine',
            'total_value'           => 2400000.00,
            'status'                => 'accepted',
            'procurement_mode'      => 'competitive_bidding',
            'endorsed_by'           => $this->requester->id,
            'endorsed_at'           => now()->subDays(12),
            'budget_certified_by'   => $this->budgetOfficer->id,
            'budget_certified_at'   => now()->subDays(10),
            'accepted_by'           => $this->secretariat->id,
            'accepted_at'           => now()->subDays(9),
            'submitted_at'          => now()->subDays(14),
            'fund_source'           => 'General Fund',
            'account_code'          => '100-203-090',
            'mode_confirmed_by'     => $this->chairperson->id,
            'mode_confirmed_at'     => now()->subDays(8),
        ]);

        $this->addLineItems($pr, [
            ['item_description' => 'Certified Hybrid Rice Seeds (NSIC Rc222, 20kg bag)', 'unit_of_measure' => 'bags', 'quantity' => 600, 'estimated_unit_cost' => 2500.00],
            ['item_description' => 'Organic Fertilizer (Vermicompost, 50kg bag)', 'unit_of_measure' => 'bags', 'quantity' => 900, 'estimated_unit_cost' => 1000.00],
        ]);

        $itb = Invitation::create([
            'reference_number'           => 'ITB-2026-0013',
            'purchase_requisition_id'    => $pr->id,
            'type'                       => 'itb',
            'project_title'              => $app->project_title,
            'procuring_entity'           => 'Municipality of San Rafael',
            'abc'                        => 2500000.00,
            'fund_source'                => 'General Fund',
            'procurement_mode'           => 'competitive_bidding',
            'bid_document_cost'          => 5000.00,
            'eligibility_check_date'     => now()->subDays(2),
            'pre_bid_conference_date'    => now()->addDays(5),
            'submission_deadline'        => now()->addDays(20),
            'opening_date'               => now()->addDays(21),
            'opening_venue'              => 'BAC Conference Room, Municipal Hall',
            'contact_person'             => 'Maria Santos',
            'contact_email'              => 'bac@sanrafael.gov.ph',
            'contact_phone'              => '(044) 123-4567',
            'philgeps_reference'         => 'PHILGEPS-2026-0013',
            'delivery_location'          => 'Municipal Agriculture Office Warehouse, San Rafael, Bulacan',
            'delivery_schedule'          => '30 calendar days from NTP',
            'payment_terms'              => '30_days',
            'status'                     => 'posted',
            'posted_at'                  => now()->subDays(3),
            'created_by'                 => $this->secretariat->id,
            'approved_by'                => $this->chairperson->id,
            'approved_at'                => now()->subDays(4),
            'hope_approved_by'           => $this->hope->id,
            'hope_approved_at'           => now()->subDays(3),
        ]);

        // Blockchain events — early stage only
        $procId = (string) $pr->id;
        $this->fire($procId, BlockchainEvent::APP_APPROVED, $this->hope->id, 'AppEntry', $app->id, now()->subDays(15));
        $this->fire($procId, BlockchainEvent::PR_ACCEPTED, $this->secretariat->id, 'PurchaseRequisition', $pr->id, now()->subDays(9));
        $this->fire($procId, 'BUDGET_CERTIFIED', $this->budgetOfficer->id, 'PurchaseRequisition', $pr->id, now()->subDays(10));
        $this->fire($procId, 'PRE_PROCUREMENT_CONFERENCE_APPROVED', $this->chairperson->id, 'Invitation', $itb->id, now()->subDays(5));
        $this->fire($procId, BlockchainEvent::ITB_POSTED, $this->secretariat->id, 'Invitation', $itb->id, now()->subDays(3));

        $this->command->info('   ✅ #6 Agricultural Inputs — EARLY STAGE, ITB posted, awaiting bids (5 events)');
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    private function addLineItems(PurchaseRequisition $pr, array $items): void
    {
        foreach ($items as $i => $item) {
            PrLineItem::create([
                'purchase_requisition_id' => $pr->id,
                'item_description'        => $item['item_description'],
                'unit_of_measure'         => $item['unit_of_measure'],
                'quantity'                => $item['quantity'],
                'estimated_unit_cost'     => $item['estimated_unit_cost'],
                'estimated_total_cost'    => $item['quantity'] * $item['estimated_unit_cost'],
                'sort_order'              => $i + 1,
            ]);
        }
    }

    private function createBids(Invitation $invitation, array $amounts, $submittedAt): void
    {
        foreach ($this->vendors as $idx => $vendor) {
            BidSubmission::create([
                'invitation_id' => $invitation->id,
                'vendor_id'     => $vendor->id,
                'bid_amount'    => $amounts[$idx],
                'remarks'       => 'Complete bid package submitted.',
                'documents'     => json_encode(['bid_docs' => 'bid_' . $vendor->id . '.pdf']),
                'status'        => 'submitted',
                'submitted_at'  => $submittedAt,
                'is_late'       => false,
                'document_hash' => hash('sha256', 'bid_' . $vendor->id . '_' . $invitation->id . '_' . now()->timestamp),
            ]);
        }
    }

    private function createBidOpening(Invitation $invitation, $sessionDate, string $status): BidOpening
    {
        $opening = BidOpening::create([
            'session_reference' => 'BOS-' . $invitation->reference_number . '-' . $sessionDate->format('Ymd'),
            'invitation_id'     => $invitation->id,
            'session_date'      => $sessionDate,
            'quorum_confirmed'  => true,
            'bac_members_present' => json_encode([
                ['id' => $this->chairperson->id, 'name' => $this->chairperson->name, 'role' => 'BAC Chairperson'],
                ['id' => $this->bacMembers[0]->id, 'name' => $this->bacMembers[0]->name, 'role' => 'BAC Member'],
                ['id' => $this->bacMembers[1]->id, 'name' => $this->bacMembers[1]->name, 'role' => 'BAC Member'],
            ]),
            'observers_present' => json_encode([]),
            'failure_declared'  => false,
            'status'            => $status,
            'conducted_by'      => $this->chairperson->id,
            'closed_at'         => $sessionDate,
        ]);

        foreach ($this->vendors as $vendor) {
            BidOpeningAttendance::create([
                'bid_opening_id' => $opening->id,
                'vendor_id'      => $vendor->id,
                'present'        => true,
            ]);
        }

        return $opening;
    }

    private function createBidPrices(BidOpening $opening, array $amounts): void
    {
        foreach ($this->vendors as $idx => $vendor) {
            BidPrice::create([
                'bid_opening_id'       => $opening->id,
                'vendor_id'            => $vendor->id,
                'amount_as_read'       => $amounts[$idx],
                'amount_as_calculated' => $amounts[$idx],
                'arithmetic_correction' => null,
                'rank'                 => $idx + 1,
            ]);
        }
    }

    private function createEvaluations(BidOpening $opening, Invitation $invitation, array $amounts, $submittedAt): void
    {
        foreach ($this->bacMembers as $evaluator) {
            foreach ($this->vendors as $vendor) {
                Evaluation::create([
                    'bid_opening_id' => $opening->id,
                    'invitation_id'  => $invitation->id,
                    'evaluator_id'   => $evaluator->id,
                    'evaluator_role' => 'bac_member',
                    'vendor_id'      => $vendor->id,
                    'technical_items' => json_encode([
                        ['item' => 'Compliance with Technical Specs', 'result' => 'pass', 'remarks' => 'Meets requirements'],
                    ]),
                    'calculated_price' => $amounts[$this->vendors->search($vendor)],
                    'recommendation'   => 'responsive',
                    'overall_remarks'  => 'Bid is responsive.',
                    'status'           => 'submitted',
                    'submitted_at'     => $submittedAt,
                ]);
            }
        }

        EvaluationSummary::create([
            'bid_opening_id' => $opening->id,
            'invitation_id'  => $invitation->id,
            'ranked_bidders' => json_encode(
                collect($this->vendors)->map(fn ($v, $i) => [
                    'vendor_id' => $v->id,
                    'vendor_name' => $v->business_name,
                    'bid_amount' => $amounts[$i],
                    'rank' => $i + 1,
                    'recommendation' => 'responsive',
                ])->toArray()
            ),
            'status'      => 'approved',
            'approved_by' => $this->chairperson->id,
            'approved_at' => $submittedAt,
        ]);
    }

    private function createPostQualification(BidOpening $opening, Invitation $invitation, Vendor $vendor, $completedAt): PostQualification
    {
        return PostQualification::create([
            'bid_opening_id'       => $opening->id,
            'invitation_id'        => $invitation->id,
            'vendor_id'            => $vendor->id,
            'rank'                 => 1,
            'invitation_reference' => 'PQ-' . $invitation->reference_number . '-R1',
            'document_results'     => json_encode([
                ['document' => 'Latest Income Tax Return', 'status' => 'submitted', 'verified' => true],
                ['document' => 'Audited Financial Statements', 'status' => 'submitted', 'verified' => true],
                ['document' => 'NFCC Computation', 'status' => 'submitted', 'verified' => true],
            ]),
            'required_documents' => json_encode(['Latest Income Tax Return', 'Audited Financial Statements', 'NFCC Computation']),
            'submitted_documents' => json_encode(['itr.pdf', 'fs.pdf', 'nfcc.pdf']),
            'twg_evaluation'      => json_encode(['overall' => 'satisfactory', 'score' => 92]),
            'twg_recommendation'  => 'pass',
            'twg_remarks'         => 'Vendor meets all post-qualification requirements.',
            'result'              => 'passed',
            'workflow_status'     => 'completed',
            'evaluated_by'        => $this->twg->id,
            'invitation_sent_at'  => $completedAt->copy()->subDays(5),
            'acknowledged_at'     => $completedAt->copy()->subDays(4),
            'submission_deadline_at' => $completedAt->copy()->subDays(2),
            'documents_submitted_at' => $completedAt->copy()->subDays(3),
            'completed_at'        => $completedAt,
            'finalized_at'        => $completedAt,
        ]);
    }

    private function createResolution(Invitation $invitation, Vendor $vendor, float $amount, $approvedAt): BacResolution
    {
        static $resCount = 0;
        $resCount++;

        return BacResolution::create([
            'resolution_reference' => 'BAC-RES-2026-T' . str_pad($resCount, 3, '0', STR_PAD_LEFT),
            'invitation_id'        => $invitation->id,
            'type'                 => 'award_recommendation',
            'subject'              => 'Resolution Recommending Award for ' . $invitation->project_title,
            'body'                 => 'RESOLVED, the BAC recommends award to ' . $vendor->business_name . ' with bid amount of PHP ' . number_format($amount, 2) . '.',
            'signatories'          => json_encode([
                ['id' => $this->chairperson->id, 'name' => $this->chairperson->name, 'role' => 'BAC Chairperson', 'signed' => true],
                ['id' => $this->bacMembers[0]->id, 'name' => $this->bacMembers[0]->name, 'role' => 'BAC Member', 'signed' => true],
                ['id' => $this->bacMembers[1]->id, 'name' => $this->bacMembers[1]->name, 'role' => 'BAC Member', 'signed' => true],
            ]),
            'min_signatures_required' => 3,
            'status'                  => 'approved_by_hope',
            'created_by'              => $this->secretariat->id,
            'hope_approved_by'        => $this->hope->id,
            'hope_approved_at'        => $approvedAt,
        ]);
    }

    /**
     * Fire a blockchain event with a specific timestamp.
     * Uses recordEvent() logic but overrides recorded_at for realistic timelines.
     */
    private function fire(string $procId, string $eventType, ?int $actorId, ?string $entityType, ?int $entityId, $timestamp): void
    {
        $previousBlock = BlockchainEvent::orderBy('block_number', 'desc')->first();
        $previousHash = $previousBlock?->block_hash ?? str_repeat('0', 64);
        $blockNumber = ($previousBlock?->block_number ?? 0) + 1;

        $metadata = ['procurement_id' => $procId];
        $metadataHash = hash('sha256', json_encode($metadata));

        $blockData = implode('|', [
            $eventType, $actorId ?? '', $entityType ?? '', $entityId ?? '',
            '', $metadataHash, $previousHash, $blockNumber, $timestamp->toIso8601String(),
        ]);
        $blockHash = hash('sha256', $blockData);

        BlockchainEvent::create([
            'event_type'     => $eventType,
            'procurement_id' => $procId,
            'entity_type'    => $entityType,
            'entity_id'      => $entityId,
            'actor_id'       => $actorId,
            'metadata_hash'  => $metadataHash,
            'previous_hash'  => $previousHash,
            'block_hash'     => $blockHash,
            'block_number'   => $blockNumber,
            'metadata'       => $metadata,
            'recorded_at'    => $timestamp,
        ]);
    }
}
