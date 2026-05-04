<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Models\AppEntry;
use App\Models\AuditLog;
use App\Models\Award;
use App\Models\BacResolution;
use App\Models\BidOpening;
use App\Models\BidSubmission;
use App\Models\BlockchainEvent;
use App\Models\Contract;
use App\Models\EvaluationSummary;
use App\Models\InspectionAcceptanceReport;
use App\Models\Invitation;
use App\Models\Invoice;
use App\Models\PostQualification;
use App\Models\ProcurementNotification;
use App\Models\PurchaseRequisition;
use App\Models\Role;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WorkspaceController extends Controller
{
    private const WORKSPACE_CACHE_TTL_SECONDS = 10;

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->load('role', 'department');
        $roleName = $user->role?->name;

        $payload = Cache::remember(
            $this->workspaceSummaryCacheKey($user->id, $roleName),
            now()->addSeconds(self::WORKSPACE_CACHE_TTL_SECONDS),
            function () use ($user, $roleName) {
                $context = match ($roleName) {
                    Role::SYSTEM_ADMIN => $this->systemAdminContext($user),
                    Role::HOPE => $this->hopeContext($user),
                    Role::BAC_CHAIRPERSON => $this->bacChairpersonContext($user),
                    Role::BAC_MEMBER => $this->bacMemberContext($user),
                    Role::BAC_SECRETARIAT => $this->bacSecretariatContext($user),
                    Role::TWG_MEMBER => $this->twgMemberContext($user),
                    Role::PROCUREMENT_OFFICER => $this->procurementOfficerContext($user),
                    Role::DEPARTMENT_REQUESTER => $this->departmentRequesterContext($user),
                    Role::DEPARTMENT_HEAD => $this->departmentHeadContext($user),
                    Role::BUDGET_OFFICER => $this->budgetOfficerContext($user),
                    Role::FINANCE_OFFICER => $this->financeOfficerContext($user),
                    Role::VENDOR => $this->vendorContext($user),
                    Role::INSPECTION_ACCEPTANCE_COMMITTEE => $this->inspectionAcceptanceCommitteeContext($user),
                    Role::OBSERVER => $this->observerContext($user),
                    Role::INTERNAL_AUDITOR => $this->internalAuditorContext($user),
                    default => $this->genericContext($user),
                };

                return [
                    'role' => [
                        'name' => $user->role?->name,
                        'display_name' => $user->role?->display_name,
                        'base_path' => $this->resolveRoleBasePath($roleName),
                        'dashboard_path' => $this->resolveRoleBasePath($roleName) ? $this->resolveRoleBasePath($roleName) . '/dashboard' : '/login',
                        'permissions' => $user->role?->permissions ?? [],
                    ],
                    'department' => $user->department ? [
                        'id' => $user->department->id,
                        'name' => $user->department->name,
                        'code' => $user->department->code,
                    ] : null,
                    'cards' => $context['cards'],
                    'highlights' => $context['highlights'],
                    'recent' => $context['recent'],
                    'actions' => $context['actions'],
                    'alert_count' => $context['alert_count'],
                    'generated_at' => now()->toIso8601String(),
                ];
            }
        );

        return response()->json($payload);
    }

    private function workspaceSummaryCacheKey(int $userId, ?string $roleName): string
    {
        return 'workspace:summary:user:' . $userId . ':role:' . ($roleName ?: 'none');
    }

    private function systemAdminContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('users', 'Active Users', User::count(), 'System-wide accounts', 'blue'),
                $this->metric('roles', 'Roles Configured', Role::count(), 'Access control profiles', 'slate'),
                $this->metric('audit_events', 'Audit Events', AuditLog::count(), 'Immutable admin trail', 'amber'),
                $this->metric('locked_accounts', 'Locked Accounts', User::where('status', 'locked')->count(), 'Requires admin review', 'rose'),
            ],
            'highlights' => [
                '2FA is enforced for privileged internal users and all sensitive operations are logged.',
                'Admin actions are isolated from procurement transaction approval paths.',
                'Ledger health and audit integrity can be checked from the same workspace.',
            ],
            'recent' => $this->recentAuditLogs(),
            'actions' => [
                $this->action('User Management', '/admin/users'),
                $this->action('Audit Logs', '/admin/audit'),
                $this->action('Blockchain Monitor', '/admin/blockchain'),
                $this->action('System Config', '/admin/config'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function hopeContext(User $user): array
    {
        $pendingApprovals = AppEntry::where('status', 'pending_hope_approval')->count()
            + PurchaseRequisition::whereIn('status', ['pending_dh_endorsement', 'pending_budget_certification', 'pending_secretariat_review'])->count()
            + Invitation::where('status', 'draft')->count()
            + BacResolution::where('status', 'SIGNED')->count()
            + Award::where('status', 'DRAFT')->count();

        $activeProcurements = Invitation::where('status', 'posted')->count()
            + BidOpening::where('status', 'IN_PROGRESS')->count()
            + Contract::where('status', 'active')->count();

        $overdueContracts = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now())
            ->count();

        return [
            'cards' => [
                $this->metric('pending_approvals', 'Pending Approvals', $pendingApprovals, 'APP / PR / award actions', 'amber'),
                $this->metric('active_procurements', 'Active Procurements', $activeProcurements, 'Live procurement lifecycle items', 'blue'),
                $this->metric('overdue_contracts', 'Overdue Contracts', $overdueContracts, 'Items past implementation date', 'rose'),
                $this->metric('unread_alerts', 'Unread Alerts', ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(), 'Actionable notices waiting for review', 'emerald'),
            ],
            'highlights' => [
                'Approve only budget-certified, legally routed records that are already in the workflow.',
                'All approval decisions are stored in the audit trail and reflected in the summary queue.',
                'Use this workspace to clear pending approvals before deadlines start slipping.',
            ],
            'recent' => $this->recentApprovals(),
            'actions' => [
                $this->action('My Approval Queue', '/hope/approvals'),
                $this->action('Annual Plan', '/hope/app'),
                $this->action('Awards', '/hope/awards'),
                $this->action('Contracts', '/hope/contracts'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function bacChairpersonContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('draft_resolutions', 'Draft Resolutions', BacResolution::where('status', 'DRAFT')->count(), 'Resolutions ready for BAC action', 'amber'),
                $this->metric('open_sessions', 'Open Bid Sessions', BidOpening::where('status', 'IN_PROGRESS')->count(), 'Active opening sessions', 'blue'),
                $this->metric('pending_post_qual', 'Post-Qual Queue', PostQualification::whereIn('workflow_status', ['invitation_sent', 'acknowledged', 'submitted'])->count(), 'Items waiting for chairperson review', 'violet'),
                $this->metric('live_invitations', 'Posted Invitations', Invitation::where('status', 'posted')->count(), 'Public procurement notices', 'emerald'),
            ],
            'highlights' => [
                'The chairperson workspace focuses on approvals, quorum-aware sessions, and formal resolutions.',
                'Use the resolution queue to sign, route, or return the BAC recommendation record.',
                'Bid opening and evaluation states are mirrored here for oversight without editing rights.',
            ],
            'recent' => $this->recentChairpersonItems(),
            'actions' => [
                $this->action('Invitations', '/chairperson/invitations'),
                $this->action('Bid Openings', '/chairperson/bid-openings'),
                $this->action('Evaluations', '/chairperson/evaluations'),
                $this->action('Resolutions', '/chairperson/resolutions'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function bacMemberContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('open_sessions', 'Open Sessions', BidOpening::where('status', 'IN_PROGRESS')->count(), 'Sessions requiring BAC attention', 'blue'),
                $this->metric('evaluation_tasks', 'Evaluation Tasks', EvaluationSummary::where('status', 'PENDING_CHAIRPERSON_REVIEW')->count(), 'Submitted evaluation summaries', 'amber'),
                $this->metric('post_qual_queue', 'Post-Qual Queue', PostQualification::whereIn('workflow_status', ['invitation_sent', 'acknowledged', 'submitted'])->count(), 'Ranked bidders awaiting checks', 'violet'),
                $this->metric('resolutions', 'Resolutions to Sign', BacResolution::where('status', 'SIGNED')->count(), 'Co-signature queue', 'emerald'),
            ],
            'highlights' => [
                'BAC members record quorum, pass/fail decisions, and evaluation inputs for the current session.',
                'Do not expect bid visibility before the opening session is formally active.',
                'Use the evaluation and post-qualification views to keep the committee aligned on ranking decisions.',
            ],
            'recent' => $this->recentBidOpenings(),
            'actions' => [
                $this->action('Bid Openings', '/bac-member/bid-openings'),
                $this->action('Evaluations', '/bac-member/evaluations'),
                $this->action('Post-Qualification', '/bac-member/post-qualification'),
                $this->action('Resolutions', '/bac-member/resolutions'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function bacSecretariatContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('pending_prs', 'Pending PRs', PurchaseRequisition::whereIn('status', ['submitted', 'pending_dh_endorsement', 'pending_budget_certification', 'pending_secretariat_review'])->count(), 'Requests waiting in the queue', 'amber'),
                $this->metric('app_queue', 'APP Entries', AppEntry::whereIn('status', ['pending_secretariat_consolidation', 'pending_hope_approval'])->count(), 'Planning entries for consolidation', 'blue'),
                $this->metric('posted_invitations', 'Posted Invitations', Invitation::where('status', 'posted')->count(), 'Public-facing procurement notices', 'emerald'),
                $this->metric('registered_vendors', 'Registered Vendors', Vendor::count(), 'Bidder registry records', 'slate'),
            ],
            'highlights' => [
                'This is the operational hub for PR routing, invitation posting, session setup, and bidder coordination.',
                'The queue is split by procurement phase so the Secretariat can move items without losing the paper trail.',
                'Use the bidder and pre-screening views to keep opening-day work under control.',
            ],
            'recent' => $this->recentSecretariatItems(),
            'actions' => [
                $this->action('Purchase Requisitions', '/secretariat/purchase-requisitions'),
                $this->action('Invitations', '/secretariat/invitations'),
                $this->action('Bid Openings', '/secretariat/bid-openings'),
                $this->action('Bidders', '/secretariat/bidders'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function procurementOfficerContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('app_consolidation', 'APP Consolidation', AppEntry::where('status', 'pending_secretariat_consolidation')->count(), 'Budget-certified APP items awaiting consolidation', 'blue'),
                $this->metric('pr_review', 'PR Review Queue', PurchaseRequisition::where('status', 'pending_secretariat_review')->count(), 'Requests awaiting procurement review', 'amber'),
                $this->metric('mode_confirmations', 'Mode Confirmations', PurchaseRequisition::where('status', 'pending_mode_confirmation')->count(), 'Requests waiting for BAC mode confirmation', 'violet'),
                $this->metric('active_contracts', 'Active Contracts', Contract::where('status', 'active')->count(), 'Contracts currently under implementation', 'emerald'),
            ],
            'highlights' => [
                'Use this workspace for procurement review, contract packaging, and PO-related follow-through.',
                'This role is separate from Department Head endorsement and IAC acceptance control points.',
                'Keep requests moving from certified demand into executable procurement records without taking BAC or HOPE actions.',
            ],
            'recent' => $this->recentProcurementOfficerItems(),
            'actions' => [
                $this->action('Purchase Requisitions', '/procurement/purchase-requisitions'),
                $this->action('Contracts', '/procurement/contracts'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function twgMemberContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('open_sessions', 'Open Sessions', BidOpening::where('status', 'IN_PROGRESS')->count(), 'Sessions requiring technical review', 'blue'),
                $this->metric('evaluation_tasks', 'Evaluation Tasks', EvaluationSummary::where('status', 'PENDING_CHAIRPERSON_REVIEW')->count(), 'Technical and financial summaries', 'amber'),
                $this->metric('post_qual_queue', 'Post-Qual Queue', PostQualification::whereIn('workflow_status', ['invitation_sent', 'acknowledged', 'submitted'])->count(), 'Documents waiting for validation', 'violet'),
                $this->metric('submitted_reports', 'Submitted Reports', EvaluationSummary::where('status', 'APPROVED')->count(), 'Completed technical evaluations', 'emerald'),
            ],
            'highlights' => [
                'TWG members focus on technical validation, ranking support, and post-qualification checks.',
                'Every recommendation is tied to the opening session and the resulting evaluation summary.',
                'Use this view to keep your assigned procurements moving without stepping outside the committee scope.',
            ],
            'recent' => $this->recentTwgItems(),
            'actions' => [
                $this->action('Evaluations', '/twg/evaluations'),
                $this->action('Post-Qualification', '/twg/post-qualification'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function departmentRequesterContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('my_app_entries', 'My APP Entries', AppEntry::where('created_by', $user->id)->count(), 'Planning submissions you created', 'blue'),
                $this->metric('my_prs', 'My PRs', PurchaseRequisition::where('requester_id', $user->id)->count(), 'Requests routed from your office', 'amber'),
                $this->metric('active_deliveries', 'Active Deliveries', Contract::whereHas('purchaseRequisition', fn ($query) => $query->where('requester_id', $user->id))->where('status', 'active')->count(), 'Contracts your office is currently monitoring', 'emerald'),
                $this->metric('returned_items', 'Returned Items', PurchaseRequisition::where('requester_id', $user->id)->where('status', 'returned')->count(), 'Items that need correction', 'rose'),
            ],
            'highlights' => [
                'This workspace is for creating APP entries, preparing PRs, and confirming that deliveries reached your office.',
                'You only see records tied to your department and your submissions.',
                'Inspection and acceptance is owned by the Inspection and Acceptance Committee, not by the requester.',
            ],
            'recent' => $this->recentRequesterItems($user),
            'actions' => [
                $this->action('Annual Plan', '/requester/app'),
                $this->action('Purchase Requisitions', '/requester/purchase-requisitions'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function departmentHeadContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('app_endorsements', 'APP Endorsements', AppEntry::where('department_id', $user->department_id)->where('status', 'submitted')->count(), 'Department APP items awaiting your endorsement', 'blue'),
                $this->metric('pr_endorsements', 'PR Endorsements', PurchaseRequisition::where('department_id', $user->department_id)->where('status', 'pending_dh_endorsement')->count(), 'Requests waiting for departmental action', 'amber'),
                $this->metric('returned_items', 'Returned Items', AppEntry::where('department_id', $user->department_id)->where('status', 'returned')->count() + PurchaseRequisition::where('department_id', $user->department_id)->where('status', 'returned')->count(), 'Records that need department correction', 'rose'),
                $this->metric('approved_app', 'Approved APP Items', AppEntry::where('department_id', $user->department_id)->where('status', 'approved')->count(), 'Approved planning items for your office', 'emerald'),
            ],
            'highlights' => [
                'This workspace is limited to department endorsement and return actions.',
                'Department Head approval is separate from requester entry and from later BAC, IAC, and Finance controls.',
                'Use endorsement only after checking necessity, completeness, and departmental priority.',
            ],
            'recent' => $this->recentDepartmentHeadItems($user),
            'actions' => [
                $this->action('APP Endorsements', '/department-head/app'),
                $this->action('PR Endorsements', '/department-head/purchase-requisitions'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function budgetOfficerContext(User $user): array
    {
        $reservedValue = PurchaseRequisition::where('status', 'pending_secretariat_review')->sum('total_value');

        return [
            'cards' => [
                $this->metric('app_certification', 'APP for Certification', AppEntry::where('status', 'pending_budget_certification')->count(), 'Planning lines awaiting certification', 'blue'),
                $this->metric('pr_certification', 'PRs for Certification', PurchaseRequisition::where('status', 'pending_budget_certification')->count(), 'Requests awaiting fund confirmation', 'amber'),
                $this->metric('reserved_value', 'Reserved Value', $reservedValue, 'Soft reservations already claimed', 'emerald'),
                $this->metric('returned_items', 'Returned Items', PurchaseRequisition::where('status', 'returned')->count(), 'Budget checks needing resubmission', 'rose'),
            ],
            'highlights' => [
                'Use this workspace to certify funds and keep APP / PR records aligned with available appropriations.',
                'Soft reservations are reflected here so oversubscription is obvious before approval.',
                'Any returned item should be reviewed before the procurement queue moves forward.',
            ],
            'recent' => $this->recentBudgetItems(),
            'actions' => [
                $this->action('Budget Certification', '/budget/certification'),
                $this->action('Annual Plan', '/budget/app'),
                $this->action('Purchase Requisitions', '/budget/purchase-requisitions'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function inspectionAcceptanceCommitteeContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('inspected_queue', 'Awaiting Acceptance', InspectionAcceptanceReport::where('status', 'inspected')->count(), 'Inspection reports waiting for final acceptance', 'amber'),
                $this->metric('accepted_reports', 'Accepted Deliveries', InspectionAcceptanceReport::where('status', 'accepted')->count(), 'Completed acceptance records', 'emerald'),
                $this->metric('rejected_reports', 'Rejected Deliveries', InspectionAcceptanceReport::where('status', 'rejected')->count(), 'Deliveries sent back for correction', 'rose'),
                $this->metric('active_contracts', 'Active Contracts', Contract::where('status', 'active')->count(), 'Contracts still generating inspection work', 'blue'),
            ],
            'highlights' => [
                'The IAC owns formal inspection and IAR completion after delivery reaches the end-user unit.',
                'This role does not award contracts, endorse requests, or release payments.',
                'Use the inspection queue to create, accept, or reject IARs based on PO and contract compliance.',
            ],
            'recent' => $this->recentInspectionCommitteeItems(),
            'actions' => [
                $this->action('Inspections', '/iac/inspections'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function financeOfficerContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('pending_invoices', 'Pending Invoices', Invoice::whereNull('validated_at')->count(), 'Documents awaiting validation', 'amber'),
                $this->metric('paid_invoices', 'Paid Invoices', Invoice::whereNotNull('paid_at')->count(), 'Closed payment records', 'emerald'),
                $this->metric('active_contracts', 'Active Contracts', Contract::where('status', 'active')->count(), 'Contracts currently in implementation', 'blue'),
                $this->metric('invoice_flags', 'Invoice Flags', Invoice::whereNull('paid_at')->whereNotNull('remarks')->count(), 'Invoices with notes or exceptions', 'rose'),
            ],
            'highlights' => [
                'Validate invoices only after delivery acceptance and contract checks are complete.',
                'The payment workflow stays read-only until the invoice clears the three-way match.',
                'Use the contract view to understand which projects are still generating billable activity.',
            ],
            'recent' => $this->recentFinanceItems(),
            'actions' => [
                $this->action('Invoices', '/finance/invoices'),
                $this->action('Payments', '/finance/payments'),
                $this->action('Reports', '/finance/reports'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function vendorContext(User $user): array
    {
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return [
                'cards' => [
                    $this->metric('open_invitations', 'Open Invitations', Invitation::where('status', 'posted')->count(), 'Public notices visible to vendors', 'blue'),
                    $this->metric('bids_submitted', 'Bids Submitted', 0, 'No vendor profile is linked yet', 'amber'),
                    $this->metric('post_qualification', 'Post-Qualification', 0, 'Vendor profile required before use', 'violet'),
                    $this->metric('active_contracts', 'Active Contracts', 0, 'Waiting for vendor registration approval', 'emerald'),
                ],
                'highlights' => [
                    'This account has no linked vendor profile yet, so procurement interactions remain read-only.',
                    'Once the BAC Secretariat links a vendor profile, invitations and bids will appear here.',
                    'Use the profile and messages pages to complete onboarding and follow-up tasks.',
                ],
                'recent' => [],
                'actions' => [
                    $this->action('Open Invitations', '/vendor/opportunities'),
                    $this->action('My Bids', '/vendor/bids'),
                    $this->action('My Contracts', '/vendor/contracts'),
                ],
                'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
            ];
        }

        return [
            'cards' => [
                $this->metric('open_invitations', 'Open Invitations', Invitation::where('status', 'posted')->count(), 'Public notices visible to vendors', 'blue'),
                $this->metric('bids_submitted', 'Bids Submitted', BidSubmission::where('vendor_id', $vendor->id)->count(), 'Bids already filed', 'amber'),
                $this->metric('post_qualification', 'Post-Qualification', PostQualification::where('vendor_id', $vendor->id)->count(), 'Invitation follow-up items', 'violet'),
                $this->metric('active_contracts', 'Active Contracts', Contract::where('vendor_id', $vendor->id)->where('status', 'active')->count(), 'Contracts currently running', 'emerald'),
            ],
            'highlights' => [
                'Only your own bidder records and communications appear in this workspace.',
                'Open invitations are separate from post-qualification and contract tasks.',
                'Submission windows, acknowledgments, and contract status should be checked before every action.',
            ],
            'recent' => $this->recentVendorItems($vendor),
            'actions' => [
                $this->action('Dashboard', '/vendor/dashboard'),
                $this->action('Open Invitations', '/vendor/opportunities'),
                $this->action('My Bids', '/vendor/bids'),
                $this->action('My Contracts', '/vendor/contracts'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function observerContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('visible_records', 'Visible Records', AppEntry::whereIn('status', ['approved', 'pending_hope_approval', 'pending_secretariat_consolidation', 'pending_budget_certification'])->count(), 'Procurements available for observation', 'blue'),
                $this->metric('blockchain_events', 'Blockchain Events', BlockchainEvent::count(), 'Immutable event ledger entries', 'emerald'),
                $this->metric('audit_logs', 'Audit Logs', AuditLog::count(), 'Operational history available for review', 'amber'),
                $this->metric('completed_sessions', 'Completed Sessions', BidOpening::where('status', 'CLOSED')->count(), 'Opening sessions already finalized', 'violet'),
            ],
            'highlights' => [
                'Observers remain read-only and cannot alter procurement records at any stage.',
                'Use the blockchain and audit surfaces to verify the chronology of events.',
                'The dashboard is meant for oversight, not intervention.',
            ],
            'recent' => $this->recentObserverItems(),
            'actions' => [
                $this->action('Procurement Records', '/observer/records'),
                $this->action('Blockchain Audit', '/observer/blockchain'),
                $this->action('Analytics', '/observer/analytics'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function internalAuditorContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('audit_logs', 'Audit Logs', AuditLog::count(), 'Events captured for review', 'blue'),
                $this->metric('exceptions', 'Exceptions', AuditLog::where('success', false)->count(), 'Failed or blocked actions', 'rose'),
                $this->metric('hash_mismatches', 'Hash Mismatches', BlockchainEvent::where('event_type', BlockchainEvent::DOCUMENT_HASH_MISMATCH)->count(), 'Potential tamper alerts', 'amber'),
                $this->metric('ledger_blocks', 'Ledger Blocks', BlockchainEvent::count(), 'Chain records available', 'emerald'),
            ],
            'highlights' => [
                'The internal audit view focuses on exceptions, controls, and integrity verification.',
                'Failed login attempts, blocked actions, and blockchain mismatches are surfaced for follow-up.',
                'The workspace is read-only and intended for control testing and risk review.',
            ],
            'recent' => $this->recentAuditLogs(),
            'actions' => [
                $this->action('Audit Trail', '/auditor/audit'),
                $this->action('Blockchain', '/auditor/blockchain'),
                $this->action('Reports', '/auditor/reports'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function genericContext(User $user): array
    {
        return [
            'cards' => [
                $this->metric('notifications', 'Unread Notifications', ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(), 'Open alerts in the queue', 'blue'),
                $this->metric('records', 'Available Records', AuditLog::count(), 'Fallback workspace data', 'slate'),
                $this->metric('ledger', 'Blockchain Events', BlockchainEvent::count(), 'Ledger entries', 'emerald'),
            ],
            'highlights' => [
                'This workspace does not have a role-specific configuration yet.',
                'Contact the System Administrator if your role should have a dedicated module view.',
                'The fallback view still exposes recent notifications and the audit trail.',
            ],
            'recent' => $this->recentAuditLogs(),
            'actions' => [
                $this->action('Dashboard', '/login'),
            ],
            'alert_count' => ProcurementNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    private function recentAuditLogs(int $limit = 5): array
    {
        return AuditLog::with('user.role')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (AuditLog $log) {
                return [
                    'title' => $log->action,
                    'meta' => trim(($log->user?->name ?? 'System') . ' · ' . ($log->entity_type ?? 'General')),
                    'status' => $log->success ? 'Success' : 'Blocked',
                    'timestamp' => optional($log->created_at)->toIso8601String(),
                    'note' => $log->description,
                ];
            })
            ->values()
            ->all();
    }

    private function recentApprovals(int $limit = 5): array
    {
        return collect()
            ->merge(AppEntry::whereIn('status', ['pending_secretariat_consolidation', 'pending_hope_approval'])->latest()->limit($limit)->get()->map(function (AppEntry $entry) {
                return [
                    'title' => $entry->project_title,
                    'meta' => 'APP Entry · ' . ($entry->mode ?? 'n/a'),
                    'status' => $entry->status,
                    'timestamp' => optional($entry->submitted_at ?? $entry->created_at)->toIso8601String(),
                    'note' => $entry->justification,
                ];
            }))
            ->merge(PurchaseRequisition::whereIn('status', ['pending_dh_endorsement', 'pending_budget_certification', 'pending_secretariat_review'])->latest()->limit($limit)->get()->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => 'PR · ' . number_format((float) $pr->total_value, 2),
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            }))
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->all();
    }

    private function recentProcurementOfficerItems(int $limit = 5): array
    {
        return collect()
            ->merge(AppEntry::where('status', 'pending_secretariat_consolidation')->latest()->limit($limit)->get()->map(function (AppEntry $entry) {
                return [
                    'title' => $entry->project_title,
                    'meta' => 'APP consolidation · ' . ($entry->department?->code ?? 'office'),
                    'status' => $entry->status,
                    'timestamp' => optional($entry->created_at)->toIso8601String(),
                    'note' => $entry->justification,
                ];
            }))
            ->merge(PurchaseRequisition::whereIn('status', ['pending_secretariat_review', 'pending_mode_confirmation', 'mode_confirmed'])->latest()->limit($limit)->get()->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => 'Procurement review · ' . number_format((float) $pr->total_value, 2),
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            }))
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->all();
    }

    private function recentChairpersonItems(int $limit = 5): array
    {
        return BacResolution::latest()
            ->limit($limit)
            ->get()
            ->map(function (BacResolution $resolution) {
                return [
                    'title' => $resolution->resolution_reference,
                    'meta' => strtoupper($resolution->type ?? 'resolution') . ' · ' . ($resolution->subject ?? 'No subject'),
                    'status' => $resolution->status,
                    'timestamp' => optional($resolution->created_at)->toIso8601String(),
                    'note' => $resolution->body,
                ];
            })
            ->values()
            ->all();
    }

    private function recentBidOpenings(int $limit = 5): array
    {
        return BidOpening::with('invitation')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (BidOpening $opening) {
                return [
                    'title' => $opening->session_reference,
                    'meta' => $opening->invitation?->reference_number ?? 'No invitation',
                    'status' => $opening->status,
                    'timestamp' => optional($opening->session_date ?? $opening->created_at)->toIso8601String(),
                    'note' => $opening->failure_declared ? 'Failure of bidding recorded' : ($opening->quorum_confirmed ? 'Quorum confirmed' : 'Session awaiting quorum'),
                ];
            })
            ->values()
            ->all();
    }

    private function recentSecretariatItems(int $limit = 5): array
    {
        return PurchaseRequisition::latest()
            ->limit($limit)
            ->get()
            ->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => $pr->appEntry?->project_title ?? 'APP linked request',
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            })
            ->values()
            ->all();
    }

    private function recentTwgItems(int $limit = 5): array
    {
        return EvaluationSummary::latest()
            ->limit($limit)
            ->get()
            ->map(function (EvaluationSummary $summary) {
                return [
                    'title' => 'Evaluation #' . $summary->id,
                    'meta' => $summary->invitation?->reference_number ?? 'Evaluation summary',
                    'status' => $summary->status,
                    'timestamp' => optional($summary->created_at)->toIso8601String(),
                    'note' => 'Ranked bidders ready for review.',
                ];
            })
            ->values()
            ->all();
    }

    private function recentRequesterItems(User $user, int $limit = 5): array
    {
        return collect()
            ->merge(AppEntry::where('created_by', $user->id)->latest()->limit($limit)->get()->map(function (AppEntry $entry) {
                return [
                    'title' => $entry->project_title,
                    'meta' => $entry->mfo_name_snapshot ?? $entry->category ?? 'APP entry',
                    'status' => $entry->status,
                    'timestamp' => optional($entry->submitted_at ?? $entry->created_at)->toIso8601String(),
                    'note' => $entry->justification,
                ];
            }))
            ->merge(PurchaseRequisition::where('requester_id', $user->id)->latest()->limit($limit)->get()->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => 'PR · ' . number_format((float) $pr->total_value, 2),
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            }))
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->all();
    }

    private function recentDepartmentHeadItems(User $user, int $limit = 5): array
    {
        return collect()
            ->merge(AppEntry::where('department_id', $user->department_id)->whereIn('status', ['submitted', 'returned'])->latest()->limit($limit)->get()->map(function (AppEntry $entry) {
                return [
                    'title' => $entry->project_title,
                    'meta' => 'APP endorsement · ' . ($entry->department?->code ?? 'office'),
                    'status' => $entry->status,
                    'timestamp' => optional($entry->submitted_at ?? $entry->created_at)->toIso8601String(),
                    'note' => $entry->justification,
                ];
            }))
            ->merge(PurchaseRequisition::where('department_id', $user->department_id)->whereIn('status', ['pending_dh_endorsement', 'returned'])->latest()->limit($limit)->get()->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => 'PR endorsement · ' . number_format((float) $pr->total_value, 2),
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            }))
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->all();
    }

    private function recentBudgetItems(int $limit = 5): array
    {
        return PurchaseRequisition::whereIn('status', ['pending_budget_certification', 'pending_secretariat_review', 'returned'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (PurchaseRequisition $pr) {
                return [
                    'title' => $pr->pr_reference,
                    'meta' => 'Budget review · ' . number_format((float) $pr->total_value, 2),
                    'status' => $pr->status,
                    'timestamp' => optional($pr->submitted_at ?? $pr->created_at)->toIso8601String(),
                    'note' => $pr->purpose,
                ];
            })
            ->values()
            ->all();
    }

    private function recentInspectionCommitteeItems(int $limit = 5): array
    {
        return InspectionAcceptanceReport::with('contract')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (InspectionAcceptanceReport $iar) {
                return [
                    'title' => 'IAR-' . str_pad((string) $iar->id, 4, '0', STR_PAD_LEFT),
                    'meta' => $iar->contract?->contract_reference ?? 'Inspection report',
                    'status' => $iar->status,
                    'timestamp' => optional($iar->inspected_at ?? $iar->created_at)->toIso8601String(),
                    'note' => $iar->inspection_remarks,
                ];
            })
            ->values()
            ->all();
    }

    private function recentFinanceItems(int $limit = 5): array
    {
        return Invoice::latest()
            ->limit($limit)
            ->get()
            ->map(function (Invoice $invoice) {
                return [
                    'title' => $invoice->invoice_number,
                    'meta' => $invoice->contract?->contract_reference ?? 'Invoice record',
                    'status' => $invoice->paid_at ? 'paid' : ($invoice->validated_at ? 'validated' : 'pending'),
                    'timestamp' => optional($invoice->created_at)->toIso8601String(),
                    'note' => 'Amount: ₱' . number_format((float) $invoice->amount, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function recentVendorItems(Vendor $vendor, int $limit = 5): array
    {
        return ProcurementNotification::where('recipient_id', $vendor->user_id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (ProcurementNotification $notification) {
                return [
                    'title' => $notification->title,
                    'meta' => strtoupper($notification->priority ?? 'normal') . ' notification',
                    'status' => $notification->read_at ? 'Read' : 'Unread',
                    'timestamp' => optional($notification->created_at)->toIso8601String(),
                    'note' => $notification->message,
                ];
            })
            ->values()
            ->all();
    }

    private function recentObserverItems(int $limit = 5): array
    {
        return BlockchainEvent::latest('recorded_at')
            ->limit($limit)
            ->get()
            ->map(function (BlockchainEvent $event) {
                return [
                    'title' => $event->event_type,
                    'meta' => 'Block #' . $event->block_number,
                    'status' => 'Recorded',
                    'timestamp' => optional($event->recorded_at)->toIso8601String(),
                    'note' => $event->entity_type ? ($event->entity_type . ' #' . $event->entity_id) : 'Immutable ledger event',
                ];
            })
            ->values()
            ->all();
    }

    private function resolveRoleBasePath(?string $roleName): ?string
    {
        return match ($roleName) {
            Role::SYSTEM_ADMIN => '/admin',
            Role::HOPE => '/hope',
            Role::BAC_CHAIRPERSON => '/chairperson',
            Role::BAC_SECRETARIAT => '/secretariat',
            Role::BAC_MEMBER => '/bac-member',
            Role::TWG_MEMBER => '/twg',
            Role::PROCUREMENT_OFFICER => '/procurement',
            Role::DEPARTMENT_REQUESTER => '/requester',
            Role::DEPARTMENT_HEAD => '/department-head',
            Role::BUDGET_OFFICER => '/budget',
            Role::FINANCE_OFFICER => '/finance',
            Role::VENDOR => '/vendor',
            Role::INSPECTION_ACCEPTANCE_COMMITTEE => '/iac',
            Role::OBSERVER => '/observer',
            Role::INTERNAL_AUDITOR => '/auditor',
            default => null,
        };
    }

    private function metric(string $key, string $label, int|float|string $value, string $detail, string $tone): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'value' => $value,
            'detail' => $detail,
            'tone' => $tone,
        ];
    }

    private function action(string $label, string $path, string $tone = 'primary'): array
    {
        return [
            'label' => $label,
            'path' => $path,
            'tone' => $tone,
        ];
    }
}