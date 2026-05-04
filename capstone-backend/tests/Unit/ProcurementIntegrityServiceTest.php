<?php

namespace Tests\Unit;

use App\Models\AppEntry;
use App\Models\BidOpening;
use App\Models\BidPrice;
use App\Models\BidSubmission;
use App\Models\BlockchainEvent;
use App\Models\Department;
use App\Models\Invitation;
use App\Models\ProcurementNotification;
use App\Models\PurchaseRequisition;
use App\Models\Role;
use App\Models\Vendor;
use App\Models\User;
use App\Services\EthereumBridgeService;
use App\Services\NotificationService;
use App\Services\ProcurementIntegrityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProcurementIntegrityServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_detects_app_abc_bid_and_invitation_mismatches(): void
    {
        $user = User::factory()->create();

        $department = Department::create([
            'name' => 'Municipal Health Office',
            'code' => 'MHO',
        ]);

        $appEntry = AppEntry::create([
            'department_id' => $department->id,
            'project_title' => 'Medical Supplies',
            'description' => 'Annual supplies procurement',
            'category' => 'goods',
            'mode' => 'small_value_procurement',
            'abc' => 120000,
            'unit_of_measurement' => 'lot',
            'quantity' => 1,
            'fund_source' => 'General Fund',
            'account_code' => '5020301000',
            'implementing_unit' => 'MHO',
            'target_start_quarter' => 'Q1',
            'target_completion_quarter' => 'Q2',
            'fiscal_year' => 2026,
            'justification' => 'Required for primary care operations.',
            'status' => 'approved',
            'created_by' => $user->id,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        $purchaseRequisition = PurchaseRequisition::create([
            'pr_reference' => 'PR-2026-MHO-0001',
            'app_entry_id' => $appEntry->id,
            'department_id' => $department->id,
            'requester_id' => $user->id,
            'purpose' => 'Procure medical supplies',
            'date_required' => now()->addDays(14)->toDateString(),
            'urgency_level' => 'routine',
            'total_value' => 150000,
            'status' => 'mode_confirmed',
            'procurement_mode' => 'small_value_procurement',
        ]);

        $invitation = Invitation::create([
            'reference_number' => 'RFQ-2026-0001',
            'purchase_requisition_id' => $purchaseRequisition->id,
            'type' => 'rfq',
            'project_title' => 'Medical Supplies',
            'abc' => 155000,
            'fund_source' => 'General Fund',
            'procurement_mode' => 'small_value_procurement',
            'submission_deadline' => now()->addDays(7),
            'opening_date' => now()->addDays(8),
            'status' => 'posted',
            'created_by' => $user->id,
        ]);

        $vendor = Vendor::create([
            'business_name' => 'MedSupply Traders',
            'business_type' => 'corporation',
            'dti_sec_cda_number' => 'SEC-2026-0001',
            'philgeps_number' => '1234567890',
            'tin' => '123-456-789-000',
            'address' => 'Town Center',
            'contact_person' => 'Jane Supplier',
            'contact_email' => 'vendor@example.com',
            'contact_mobile' => '09171234567',
            'procurement_categories' => ['Goods'],
            'status' => 'approved',
        ]);

        $bidSubmission = BidSubmission::create([
            'invitation_id' => $invitation->id,
            'vendor_id' => $vendor->id,
            'bid_amount' => 99000,
            'documents' => ['quotation.pdf'],
            'status' => 'submitted',
        ]);

        $bidOpening = BidOpening::create([
            'session_reference' => 'BOS-RFQ-20260504',
            'invitation_id' => $invitation->id,
            'session_date' => now()->addDays(8),
            'status' => 'completed',
        ]);

        $bidPrice = BidPrice::create([
            'bid_opening_id' => $bidOpening->id,
            'vendor_id' => $vendor->id,
            'amount_as_read' => 99500,
            'amount_as_calculated' => 99500,
            'rank' => 1,
        ]);

        BlockchainEvent::recordEvent(
            'APP_ENTRY_APPROVED',
            $user->id,
            AppEntry::class,
            $appEntry->id,
            null,
            [
                'project_title' => 'Medical Supplies FY 2026',
                'abc' => 100000,
            ]
        );

        BlockchainEvent::recordEvent(
            'PR_MODE_CONFIRMED',
            $user->id,
            PurchaseRequisition::class,
            $purchaseRequisition->id,
            null,
            [
                'pr_ref' => $purchaseRequisition->pr_reference,
                'abc' => 100000,
                'confirmed_mode' => 'small_value_procurement',
            ]
        );

        BlockchainEvent::recordEvent(
            BlockchainEvent::BID_SUBMITTED,
            $user->id,
            BidSubmission::class,
            $bidSubmission->id,
            hash('sha256', 'bid-documents'),
            [
                'procurement_id' => (string) $purchaseRequisition->id,
                'invitation_reference' => $invitation->reference_number,
                'vendor_id' => $vendor->id,
                'bid_amount' => 98000,
            ]
        );

        $service = new ProcurementIntegrityService(
            $this->createMock(NotificationService::class),
            $this->createMock(EthereumBridgeService::class),
        );

        $report = $service->inspectProcurement((string) $purchaseRequisition->id);

        $this->assertSame((string) $purchaseRequisition->id, $report['procurement_id']);
        $this->assertSame(3, $report['trail_blocks']);
        $this->assertSame(6, $report['mismatch_count']);
        $this->assertNotNull($report['signature']);

        $pairs = collect($report['mismatches'])
            ->map(fn (array $mismatch) => [$mismatch['entity_type'], $mismatch['field']])
            ->all();

        $this->assertEqualsCanonicalizing([
            ['AppEntry', 'project_title'],
            ['AppEntry', 'abc'],
            ['PurchaseRequisition', 'total_value'],
            ['Invitation', 'abc'],
            ['BidSubmission', 'bid_amount'],
            ['BidPrice', 'amount_as_read'],
        ], $pairs);

        $appTitleMismatch = collect($report['mismatches'])
            ->firstWhere('field', 'project_title');

        $this->assertSame('Medical Supplies FY 2026', $appTitleMismatch['expected']);
        $this->assertSame('Medical Supplies', $appTitleMismatch['actual']);

        $bidPriceMismatch = collect($report['mismatches'])
            ->first(fn (array $mismatch) => $mismatch['entity_type'] === 'BidPrice');

        $this->assertSame('98000.00', $bidPriceMismatch['expected']);
        $this->assertSame('99500.00', $bidPriceMismatch['actual']);
        $this->assertSame($bidPrice->id, $bidPriceMismatch['entity_id']);
    }

    public function test_it_marks_investigations_resolved_when_live_values_match_again(): void
    {
        $records = $this->createTamperedProcurementFixture();

        $service = new ProcurementIntegrityService(
            $this->createMock(NotificationService::class),
            $this->createMock(EthereumBridgeService::class),
        );

        $service->scanProcurement((string) $records['purchase_requisition']->id);

        $records['app_entry']->update([
            'project_title' => 'Medical Supplies FY 2026',
            'abc' => 100000,
        ]);
        $records['purchase_requisition']->update(['total_value' => 100000]);
        $records['invitation']->update(['abc' => 100000]);
        $records['bid_submission']->update(['bid_amount' => 98000]);
        $records['bid_price']->update(['amount_as_read' => 98000, 'amount_as_calculated' => 98000]);

        $investigations = $service->listInvestigations();

        $this->assertSame(6, $investigations['summary']['total']);
        $this->assertSame(0, $investigations['summary']['open']);
        $this->assertSame(6, $investigations['summary']['resolved']);
        $this->assertCount(6, $investigations['data']);
        $this->assertContains('resolved', array_column($investigations['data'], 'status'));
        $this->assertNotContains('open', array_column($investigations['data'], 'status'));
    }

    public function test_it_keeps_resolved_rows_when_newer_mismatch_snapshots_drop_them(): void
    {
        $records = $this->createTamperedProcurementFixture();

        $service = new ProcurementIntegrityService(
            $this->createMock(NotificationService::class),
            $this->createMock(EthereumBridgeService::class),
        );

        $service->scanProcurement((string) $records['purchase_requisition']->id);

        $records['app_entry']->update([
            'project_title' => 'Medical Supplies FY 2026',
        ]);

        $service->scanProcurement((string) $records['purchase_requisition']->id);

        $investigations = $service->listInvestigations();

        $this->assertSame(6, $investigations['summary']['total']);
        $this->assertSame(5, $investigations['summary']['open']);
        $this->assertSame(1, $investigations['summary']['resolved']);

        $resolvedRow = collect($investigations['data'])
            ->first(fn (array $row) => $row['field'] === 'project_title');

        $this->assertNotNull($resolvedRow);
        $this->assertSame('resolved', $resolvedRow['status']);
        $this->assertSame('AppEntry', $resolvedRow['entity_type']);
    }

    public function test_it_dispatches_integrity_warning_notifications_for_tampered_procurement_data(): void
    {
        $records = $this->createTamperedProcurementFixture();

        $adminRole = Role::create([
            'name' => Role::SYSTEM_ADMIN,
            'display_name' => 'System Administrator',
        ]);
        $auditorRole = Role::create([
            'name' => Role::INTERNAL_AUDITOR,
            'display_name' => 'Internal Auditor',
        ]);
        $hopeRole = Role::create([
            'name' => Role::HOPE,
            'display_name' => 'HOPE',
        ]);
        $financeRole = Role::create([
            'name' => Role::FINANCE_OFFICER,
            'display_name' => 'Finance Officer',
        ]);

        $admin = User::factory()->create([
            'role_id' => $adminRole->id,
            'status' => 'active',
        ]);
        $auditor = User::factory()->create([
            'role_id' => $auditorRole->id,
            'status' => 'active',
        ]);
        $hope = User::factory()->create([
            'role_id' => $hopeRole->id,
            'status' => 'active',
        ]);
        $finance = User::factory()->create([
            'role_id' => $financeRole->id,
            'status' => 'active',
        ]);

        $service = new ProcurementIntegrityService(
            new NotificationService(),
            $this->createMock(EthereumBridgeService::class),
        );

        $report = $service->scanProcurement((string) $records['purchase_requisition']->id);

        $this->assertTrue($report['warning_dispatched']);

        $notifications = ProcurementNotification::query()
            ->where('type', 'integrity_warning')
            ->orderBy('recipient_id')
            ->get();

        $this->assertCount(4, $notifications);
        $this->assertEqualsCanonicalizing(
            [$admin->id, $auditor->id, $hope->id, $finance->id],
            $notifications->pluck('recipient_id')->all(),
        );
        $this->assertTrue($notifications->every(fn (ProcurementNotification $notification) =>
            $notification->priority === 'critical'
            && $notification->title === 'Integrity Warning'
            && $notification->entity_type === PurchaseRequisition::class
            && $notification->entity_id === $records['purchase_requisition']->id
        ));
    }

    private function createTamperedProcurementFixture(): array
    {
        $user = User::factory()->create();

        $department = Department::create([
            'name' => 'Municipal Health Office',
            'code' => 'MHO',
        ]);

        $appEntry = AppEntry::create([
            'department_id' => $department->id,
            'project_title' => 'Medical Supplies',
            'description' => 'Annual supplies procurement',
            'category' => 'goods',
            'mode' => 'small_value_procurement',
            'abc' => 120000,
            'unit_of_measurement' => 'lot',
            'quantity' => 1,
            'fund_source' => 'General Fund',
            'account_code' => '5020301000',
            'implementing_unit' => 'MHO',
            'target_start_quarter' => 'Q1',
            'target_completion_quarter' => 'Q2',
            'fiscal_year' => 2026,
            'justification' => 'Required for primary care operations.',
            'status' => 'approved',
            'created_by' => $user->id,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        $purchaseRequisition = PurchaseRequisition::create([
            'pr_reference' => 'PR-2026-MHO-0001',
            'app_entry_id' => $appEntry->id,
            'department_id' => $department->id,
            'requester_id' => $user->id,
            'purpose' => 'Procure medical supplies',
            'date_required' => now()->addDays(14)->toDateString(),
            'urgency_level' => 'routine',
            'total_value' => 150000,
            'status' => 'mode_confirmed',
            'procurement_mode' => 'small_value_procurement',
        ]);

        $invitation = Invitation::create([
            'reference_number' => 'RFQ-2026-0001',
            'purchase_requisition_id' => $purchaseRequisition->id,
            'type' => 'rfq',
            'project_title' => 'Medical Supplies',
            'abc' => 155000,
            'fund_source' => 'General Fund',
            'procurement_mode' => 'small_value_procurement',
            'submission_deadline' => now()->addDays(7),
            'opening_date' => now()->addDays(8),
            'status' => 'posted',
            'created_by' => $user->id,
        ]);

        $vendor = Vendor::create([
            'business_name' => 'MedSupply Traders',
            'business_type' => 'corporation',
            'dti_sec_cda_number' => 'SEC-2026-0001',
            'philgeps_number' => '1234567890',
            'tin' => '123-456-789-000',
            'address' => 'Town Center',
            'contact_person' => 'Jane Supplier',
            'contact_email' => 'vendor@example.com',
            'contact_mobile' => '09171234567',
            'procurement_categories' => ['Goods'],
            'status' => 'approved',
        ]);

        $bidSubmission = BidSubmission::create([
            'invitation_id' => $invitation->id,
            'vendor_id' => $vendor->id,
            'bid_amount' => 99000,
            'documents' => ['quotation.pdf'],
            'status' => 'submitted',
        ]);

        $bidOpening = BidOpening::create([
            'session_reference' => 'BOS-RFQ-20260504',
            'invitation_id' => $invitation->id,
            'session_date' => now()->addDays(8),
            'status' => 'completed',
        ]);

        $bidPrice = BidPrice::create([
            'bid_opening_id' => $bidOpening->id,
            'vendor_id' => $vendor->id,
            'amount_as_read' => 99500,
            'amount_as_calculated' => 99500,
            'rank' => 1,
        ]);

        BlockchainEvent::recordEvent(
            'APP_ENTRY_APPROVED',
            $user->id,
            AppEntry::class,
            $appEntry->id,
            null,
            [
                'project_title' => 'Medical Supplies FY 2026',
                'abc' => 100000,
            ]
        );

        BlockchainEvent::recordEvent(
            'PR_MODE_CONFIRMED',
            $user->id,
            PurchaseRequisition::class,
            $purchaseRequisition->id,
            null,
            [
                'pr_ref' => $purchaseRequisition->pr_reference,
                'abc' => 100000,
                'confirmed_mode' => 'small_value_procurement',
            ]
        );

        BlockchainEvent::recordEvent(
            BlockchainEvent::BID_SUBMITTED,
            $user->id,
            BidSubmission::class,
            $bidSubmission->id,
            hash('sha256', 'bid-documents'),
            [
                'procurement_id' => (string) $purchaseRequisition->id,
                'invitation_reference' => $invitation->reference_number,
                'vendor_id' => $vendor->id,
                'bid_amount' => 98000,
            ]
        );

        return [
            'app_entry' => $appEntry,
            'purchase_requisition' => $purchaseRequisition,
            'invitation' => $invitation,
            'bid_submission' => $bidSubmission,
            'bid_price' => $bidPrice,
        ];
    }
}