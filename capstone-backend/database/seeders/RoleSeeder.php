<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
    * Seed the ProcureSeal roles with their permissions.
     * Permissions follow: {module: {view, create, edit, approve, delete}}
     * Based on SRS Section 3: Roles & Access Control
     */
    public function run(): void
    {
        $roles = [
            // ── 1. System Administrator ──────────────────
            [
                'name' => Role::SYSTEM_ADMIN,
                'display_name' => 'System Administrator',
                'description' => 'IT Office / MIS Head — Full system configuration, user management, blockchain monitoring',
                'requires_2fa' => true,
                'permissions' => [
                    'user_management' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true, 'delete' => true],
                    'master_data' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true, 'delete' => true],
                    'audit_logs' => ['view' => true],
                    'blockchain' => ['view' => true],
                    'system_config' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true, 'delete' => true],
                    'notifications_admin' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'reports' => ['view' => true, 'create' => true],
                    // Cannot access procurement transactions
                ],
            ],

            // ── 2. HOPE (Head of Procuring Entity) ──────
            [
                'name' => Role::HOPE,
                'display_name' => 'HOPE (Head of Procuring Entity)',
                'description' => 'Mayor / Municipal Administrator — Final approvals, override authority',
                'requires_2fa' => true,
                'permissions' => [
                    'app' => ['view' => true, 'approve' => true, 'cancel' => true],
                    'purchase_requisition' => ['view' => true, 'approve' => true, 'cancel' => true],
                    'invitation' => ['view' => true],
                    'alternative_mode' => ['view' => true, 'approve' => true],
                    'bac_resolution' => ['view' => true, 'approve' => true],
                    'award' => ['view' => true, 'approve' => true, 'cancel' => true, 'sign' => true],
                    'ntp' => ['view' => true, 'approve' => true, 'sign' => true],
                    'contract' => ['view' => true, 'approve' => true, 'sign' => true, 'suspend' => true, 'terminate' => true],
                    'procurement' => ['view' => true],
                    'reports' => ['view' => true],
                    'dashboard' => ['view' => true],
                    'compliance' => ['view' => true],
                ],
            ],

            // ── 3. BAC Chairperson ──────────────────────
            [
                'name' => Role::BAC_CHAIRPERSON,
                'display_name' => 'BAC Chairperson',
                'description' => 'Presides over BAC meetings, signs ITBs and resolutions',
                'requires_2fa' => false,
                'permissions' => [
                    'procurement' => ['view' => true],
                    'invitation' => ['view' => true, 'approve' => true],
                    'bid_opening' => ['view' => true, 'create' => true, 'edit' => true],
                    'evaluation' => ['view' => true, 'approve' => true],
                    'post_qualification' => ['view' => true, 'approve' => true],
                    'bac_resolution' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true],
                    'failure_of_bidding' => ['view' => true, 'create' => true, 'approve' => true],
                    'bac_calendar' => ['view' => true, 'create' => true, 'edit' => true],
                    'reports' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 4. BAC Member ───────────────────────────
            [
                'name' => Role::BAC_MEMBER,
                'display_name' => 'BAC Member',
                'description' => 'BAC Committee Members — Eligibility checks, evaluation, voting',
                'requires_2fa' => false,
                'permissions' => [
                    'bid_opening' => ['view' => true, 'edit' => true], // confirm attendance, pass/fail
                    'evaluation' => ['view' => true, 'create' => true, 'edit' => true],
                    'post_qualification' => ['view' => true, 'create' => true, 'edit' => true],
                    'bac_resolution' => ['view' => true, 'approve' => true], // co-sign only
                    'bac_calendar' => ['view' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 5. BAC Secretariat ──────────────────────
            [
                'name' => Role::BAC_SECRETARIAT,
                'display_name' => 'BAC Secretariat',
                'description' => 'Central administrative hub — processes all procurement operations',
                'requires_2fa' => false,
                'permissions' => [
                    'purchase_requisition' => ['view' => true, 'edit' => true, 'approve' => true], // accept/return
                    'app' => ['view' => true, 'edit' => true], // consolidate
                    'invitation' => ['view' => true, 'create' => true, 'edit' => true],
                    'bidder_management' => ['view' => true, 'create' => true, 'edit' => true],
                    'prescreening' => ['view' => true, 'create' => true, 'edit' => true],
                    'bid_opening' => ['view' => true, 'create' => true, 'edit' => true],
                    'evaluation' => ['view' => true, 'edit' => true],
                    'post_qualification' => ['view' => true, 'edit' => true],
                    'award' => ['view' => true, 'create' => true, 'edit' => true],
                    'contract' => ['view' => true, 'create' => true, 'edit' => true],
                    'communications' => ['view' => true, 'create' => true],
                    'reports' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 6. TWG Member ───────────────────────────
            [
                'name' => Role::TWG_MEMBER,
                'display_name' => 'TWG Member (Technical Working Group)',
                'description' => 'Technical evaluators — spec review, post-qualification evaluation',
                'requires_2fa' => false,
                'permissions' => [
                    'evaluation' => ['view' => true, 'create' => true, 'edit' => true],
                    'post_qualification' => ['view' => true, 'create' => true, 'edit' => true],
                    'bid_opening' => ['view' => true], // observe
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 7. Procurement Officer ──────────────────
            [
                'name' => Role::PROCUREMENT_OFFICER,
                'display_name' => 'Procurement Officer',
                'description' => 'Procurement unit officer — procurement review, contract packaging, PO preparation, delivery routing',
                'requires_2fa' => false,
                'permissions' => [
                    'procurement' => ['view' => true],
                    'purchase_requisition' => ['view' => true, 'edit' => true, 'approve' => true],
                    'app' => ['view' => true, 'edit' => true, 'approve' => true],
                    'invitation' => ['view' => true, 'edit' => true],
                    'award' => ['view' => true],
                    'contract' => ['view' => true, 'create' => true, 'edit' => true],
                    'inspection' => ['view' => true],
                    'reports' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 8. Department Requester ─────────────────
            [
                'name' => Role::DEPARTMENT_REQUESTER,
                'display_name' => 'Department Requester',
                'description' => 'End-user office representative — creates APP entries and PRs and confirms operational receipt',
                'requires_2fa' => false,
                'permissions' => [
                    'app' => ['view' => true, 'create' => true, 'edit' => true],
                    'purchase_requisition' => ['view' => true, 'create' => true, 'edit' => true],
                    'procurement' => ['view' => true], // own PRs only (filtered in controller)
                    'inspection' => ['view' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 9. Department Head ──────────────────────
            [
                'name' => Role::DEPARTMENT_HEAD,
                'display_name' => 'Department Head',
                'description' => 'Department approver — endorses APP entries and PRs from the requesting office',
                'requires_2fa' => false,
                'permissions' => [
                    'app' => ['view' => true, 'approve' => true],
                    'purchase_requisition' => ['view' => true, 'approve' => true],
                    'procurement' => ['view' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 10. Budget Officer ──────────────────────
            [
                'name' => Role::BUDGET_OFFICER,
                'display_name' => 'Budget Officer',
                'description' => 'Municipal Budget Officer — certifies fund availability',
                'requires_2fa' => false,
                'permissions' => [
                    'purchase_requisition' => ['view' => true, 'approve' => true], // budget certification
                    'app' => ['view' => true, 'approve' => true], // budget certification for APP
                    'budget' => ['view' => true, 'create' => true, 'edit' => true],
                    'reports' => ['view' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 11. Finance Officer ─────────────────────
            [
                'name' => Role::FINANCE_OFFICER,
                'display_name' => 'Finance Officer',
                'description' => 'Municipal Treasurer / Accountant — invoice processing, payments',
                'requires_2fa' => true,
                'permissions' => [
                    'invoice' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true],
                    'payment' => ['view' => true, 'create' => true],
                    'contract' => ['view' => true], // view only
                    'reports' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 12. Vendor / Supplier ──────────────────
            [
                'name' => Role::VENDOR,
                'display_name' => 'Vendor / Supplier',
                'description' => 'External registered supplier — bids, quotations, deliveries',
                'requires_2fa' => false,
                'permissions' => [
                    'vendor_profile' => ['view' => true, 'edit' => true],
                    'vendor_documents' => ['view' => true, 'create' => true, 'edit' => true],
                    'procurement_opportunities' => ['view' => true],
                    'bid_submission' => ['view' => true, 'create' => true],
                    'vendor_invitations' => ['view' => true],
                    'vendor_contracts' => ['view' => true],
                    'vendor_invoice' => ['view' => true, 'create' => true],
                    'vendor_messages' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 13. Inspection and Acceptance Committee ─
            [
                'name' => Role::INSPECTION_ACCEPTANCE_COMMITTEE,
                'display_name' => 'Inspection and Acceptance Committee',
                'description' => 'Inspection and Acceptance Committee — inspects deliveries and signs IARs',
                'requires_2fa' => false,
                'permissions' => [
                    'contract' => ['view' => true],
                    'inspection' => ['view' => true, 'create' => true, 'edit' => true, 'approve' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 14. COA / GPPB Observer ─────────────────
            [
                'name' => Role::OBSERVER,
                'display_name' => 'COA / GPPB Observer',
                'description' => 'External oversight — read-only access to all procurement records',
                'requires_2fa' => false,
                'permissions' => [
                    'procurement' => ['view' => true],
                    'blockchain' => ['view' => true],
                    'documents' => ['view' => true],
                    'analytics' => ['view' => true],
                    'dashboard' => ['view' => true],
                ],
            ],

            // ── 15. Internal Auditor ───────────────────
            [
                'name' => Role::INTERNAL_AUDITOR,
                'display_name' => 'Internal Auditor',
                'description' => 'Internal Audit Unit — risk-based audit access, flagged transactions',
                'requires_2fa' => false,
                'permissions' => [
                    'procurement' => ['view' => true],
                    'audit_logs' => ['view' => true],
                    'blockchain' => ['view' => true],
                    'reports' => ['view' => true, 'create' => true],
                    'dashboard' => ['view' => true],
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        $this->command->info('✅ 15 ProcureSeal roles seeded successfully.');
    }
}
