<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\VendorRegistrationController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\ImmutableHistoryController;
use App\Http\Controllers\BAC\AppEntryController;
use App\Http\Controllers\Department\PurchaseRequisitionController;
use App\Http\Controllers\BAC\InvitationController;
use App\Http\Controllers\BAC\BidOpeningController;
use App\Http\Controllers\BAC\EvaluationController;
use App\Http\Controllers\BAC\PostQualificationController;
use App\Http\Controllers\BAC\AwardController;
use App\Http\Controllers\BAC\ContractController;
use App\Http\Controllers\BAC\InspectionAcceptanceReportController;
use App\Http\Controllers\BAC\InvoiceController;
use App\Http\Controllers\BAC\BidderManagementController;
use App\Http\Controllers\BAC\BidSubmissionController;
use App\Http\Controllers\BAC\PreProcurementConferenceController;
use App\Http\Controllers\BAC\PreBidConferenceController;
use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;


/*
|--------------------------------------------------------------------------
| ProcureSeal API Routes
|--------------------------------------------------------------------------
|
| Routes organized by module with role-based middleware.
| Middleware stack: auth:sanctum → 2fa.verified → role:xxx → permission:mod,act
|
*/

// ── Public Routes ───────────────────────────────────────

Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'app' => 'ProcureSeal',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// ── Public Transparency API (no auth required) ─────────

Route::prefix('public')->middleware('throttle:60,1')->group(function () {
    Route::get('/procurements', [\App\Http\Controllers\Public\TransparencyController::class, 'index']);
    Route::get('/procurements/{reference}', [\App\Http\Controllers\Public\TransparencyController::class, 'show']);
    Route::get('/procurements/{reference}/timeline', [\App\Http\Controllers\Public\TransparencyController::class, 'timeline']);
    Route::get('/procurements/{reference}/bids', [\App\Http\Controllers\Public\TransparencyController::class, 'bids']);
    Route::get('/procurements/{reference}/blockchain', [\App\Http\Controllers\Public\TransparencyController::class, 'blockchainTrail']);
    Route::get('/blockchain/verify', [\App\Http\Controllers\Public\TransparencyController::class, 'verifyChain']);
    Route::get('/blockchain/verify-event/{blockNumber}', [\App\Http\Controllers\Public\TransparencyController::class, 'verifyEvent']);
    Route::get('/statistics', [\App\Http\Controllers\Public\TransparencyController::class, 'statistics']);
    Route::get('/procurements/{reference}/documents', [\App\Http\Controllers\Public\TransparencyController::class, 'documents']);
    Route::get('/documents/{id}/download', [\App\Http\Controllers\Public\TransparencyController::class, 'downloadDocument']);
    Route::get('/calendar', [\App\Http\Controllers\Public\TransparencyController::class, 'calendar']);
});

// ── Internal Webhook (bridge service -> Laravel) ──────────

Route::post('/internal/blockchain-webhook', [\App\Http\Controllers\Internal\BlockchainWebhookController::class, 'handle']);

// ── Auth Routes ─────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
    // Disabled: Vendor self-registration bypasses the physical verification flow.
    // Per SystemFlow, bidders are registered by BAC Secretariat only (POST /api/bidders).
    // Route::post('/vendor/register', [VendorRegistrationController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/verify-2fa', [AuthController::class, 'verify2FA'])->middleware('throttle:auth');
        Route::post('/change-password', [AuthController::class, 'forceChangePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::middleware(['auth:sanctum', '2fa.verified'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// ── Protected Routes (Auth + 2FA Required) ──────────────

Route::middleware(['auth:sanctum', '2fa.verified', 'throttle:api'])->group(function () {

    Route::get('/workspace/summary', [WorkspaceController::class, 'summary']);

    // ── Notifications ───────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });

    // ── Dashboard ───────────────────────────────────────
    Route::get('/dashboard', function (Request $request) {
        $user = $request->user()->load('role', 'department');
        return response()->json([
            'message' => 'Welcome to ProcureSeal Dashboard',
            'user' => $user->only('id', 'name', 'email', 'designation'),
            'role' => $user->role?->display_name,
            'department' => $user->department?->name,
        ]);
    });

    // ── Vendor Module ───────────────────────────────────
    Route::middleware('role:vendor')->prefix('vendor')->group(function () {
        Route::get('/dashboard-stats', [\App\Http\Controllers\Vendor\VendorController::class, 'getDashboardStats']);
        Route::get('/profile', [\App\Http\Controllers\Vendor\VendorController::class, 'getProfile']);
        Route::put('/profile', [\App\Http\Controllers\Vendor\VendorController::class, 'updateProfile']);
        Route::post('/documents', [\App\Http\Controllers\Vendor\VendorController::class, 'uploadDocument']);
        Route::get('/opportunities', [\App\Http\Controllers\Vendor\VendorController::class, 'getOpportunities']);
        Route::get('/opportunities/{id}', [\App\Http\Controllers\Vendor\VendorController::class, 'getOpportunityDetails']);
        Route::get('/bids', [\App\Http\Controllers\Vendor\VendorController::class, 'getBids']);
        Route::get('/post-qualifications', [\App\Http\Controllers\Vendor\VendorController::class, 'getPostQualifications']);
        Route::post('/bids/{id}/post-qual', [\App\Http\Controllers\Vendor\VendorController::class, 'uploadPostQual']);
        Route::get('/contracts', [\App\Http\Controllers\Vendor\VendorController::class, 'getContracts']);
        Route::get('/awards', [\App\Http\Controllers\Vendor\VendorController::class, 'getAwards']);
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::post('/bid-submissions', [BidSubmissionController::class, 'store']);
        Route::get('/my-bids', [BidSubmissionController::class, 'myBids']);
    });

    // ── Bid Submissions Module ──────────────────────────
    Route::prefix('bid-submissions')->group(function () {
        Route::get('/', [BidSubmissionController::class, 'index'])
            ->middleware('permission:bid_opening,view');
        Route::get('/{bidSubmission}', [BidSubmissionController::class, 'show'])
            ->middleware('permission:bid_opening,view');
    });

    // ── Pre-Procurement Conference Module ───────────────
    Route::prefix('pre-procurement-conferences')->group(function () {
        Route::get('/', [PreProcurementConferenceController::class, 'index'])
            ->middleware('permission:invitation,view');
        Route::post('/', [PreProcurementConferenceController::class, 'store'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::get('/{preProcurementConference}', [PreProcurementConferenceController::class, 'show'])
            ->middleware('permission:invitation,view');
        Route::post('/{preProcurementConference}/conduct', [PreProcurementConferenceController::class, 'conduct'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{preProcurementConference}/approve', [PreProcurementConferenceController::class, 'approve'])
            ->middleware('role:bac_chairperson,system_admin');
    });

    // ── Pre-Bid Conference Module ───────────────────────
    Route::prefix('invitations/{invitation}/pre-bid-conference')->group(function () {
        Route::get('/', [PreBidConferenceController::class, 'show'])
            ->middleware('permission:invitation,view');
        Route::post('/conduct', [PreBidConferenceController::class, 'conduct'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/finalize', [PreBidConferenceController::class, 'finalizeMinutes'])
            ->middleware('role:bac_secretariat,system_admin');
    });

    // ── Reference Data ──────────────────────────────────
    Route::get('/departments', function () {
        return response()->json(\App\Models\Department::orderBy('name')->get());
    });

    Route::get('/committee-members', function () {
        $committeeMembers = User::with('role:id,name,display_name')
            ->where('status', 'active')
            ->whereHas('role', function ($query) {
                $query->whereIn('name', ['bac_chairperson', 'bac_member', 'bac_secretariat']);
            })
            ->orderBy('name')
            ->get(['id', 'role_id', 'name', 'status']);

        return response()->json(['data' => $committeeMembers]);
    })->middleware('role:bac_secretariat,bac_chairperson,system_admin');

    // ── APP (Annual Procurement Plan) Module ────────────
    Route::prefix('app-entries')->group(function () {
        Route::get('/mode-recommendation', [AppEntryController::class, 'modeRecommendation'])
            ->middleware('permission:app,view');

        Route::get('/reference-data', [AppEntryController::class, 'referenceData'])
            ->middleware('permission:app,view');

        Route::get('/', [AppEntryController::class, 'index'])
            ->middleware('permission:app,view');
        Route::post('/', [AppEntryController::class, 'store'])
            ->middleware('permission:app,create');
        Route::get('/{appEntry}', [AppEntryController::class, 'show'])
            ->middleware('permission:app,view');
        Route::put('/{appEntry}', [AppEntryController::class, 'update'])
            ->middleware('permission:app,edit');
        Route::delete('/{appEntry}', [AppEntryController::class, 'destroy'])
            ->middleware('permission:app,delete');

        // Status transitions
        Route::post('/{appEntry}/submit', [AppEntryController::class, 'submit'])
            ->middleware('permission:app,create');
        Route::post('/{appEntry}/endorse', [AppEntryController::class, 'endorse'])
            ->middleware('role:department_head,system_admin');
        Route::post('/{appEntry}/accept', [AppEntryController::class, 'accept'])
            ->middleware('role:bac_secretariat,procurement_officer,system_admin');
        Route::post('/{appEntry}/certify-budget', [AppEntryController::class, 'certifyBudget'])
            ->middleware('role:budget_officer,system_admin');
        Route::post('/{appEntry}/approve', [AppEntryController::class, 'approve'])
            ->middleware('role:hope,system_admin');
        Route::post('/{appEntry}/return', [AppEntryController::class, 'returnEntry'])
            ->middleware('role:department_head,budget_officer,bac_secretariat,procurement_officer,hope,system_admin');
    });

    // ── Purchase Requisition Module ─────────────────────
    Route::prefix('purchase-requisitions')->group(function () {
        Route::get('/', [PurchaseRequisitionController::class, 'index'])
            ->middleware('permission:purchase_requisition,view');
        Route::get('/mode-confirmation-queue', [PurchaseRequisitionController::class, 'modeConfirmationQueue'])
            ->middleware('role:bac_chairperson,system_admin');
        Route::post('/', [PurchaseRequisitionController::class, 'store'])
            ->middleware('permission:purchase_requisition,create');
        Route::get('/{purchaseRequisition}', [PurchaseRequisitionController::class, 'show'])
            ->middleware('permission:purchase_requisition,view');
        Route::put('/{purchaseRequisition}', [PurchaseRequisitionController::class, 'update'])
            ->middleware('permission:purchase_requisition,edit');
        Route::delete('/{purchaseRequisition}', [PurchaseRequisitionController::class, 'destroy'])
            ->middleware('permission:purchase_requisition,delete');

        // Status transitions
        Route::post('/{purchaseRequisition}/submit', [PurchaseRequisitionController::class, 'submit'])
            ->middleware('permission:purchase_requisition,create');
        Route::post('/{purchaseRequisition}/endorse', [PurchaseRequisitionController::class, 'endorse'])
            ->middleware('role:department_head,system_admin');
        Route::post('/{purchaseRequisition}/certify-budget', [PurchaseRequisitionController::class, 'certifyBudget'])
            ->middleware('role:budget_officer,system_admin');
        Route::post('/{purchaseRequisition}/accept', [PurchaseRequisitionController::class, 'accept'])
            ->middleware('role:bac_secretariat,procurement_officer,system_admin');
        Route::post('/{purchaseRequisition}/return', [PurchaseRequisitionController::class, 'returnPr'])
            ->middleware('role:department_head,hope,bac_secretariat,procurement_officer,budget_officer,bac_chairperson,system_admin');
        Route::post('/{purchaseRequisition}/confirm-mode', [PurchaseRequisitionController::class, 'confirmMode'])
            ->middleware('role:bac_chairperson,system_admin');
    });

    // ── Invitations & Advertisements Module ─────────────
    Route::prefix('invitations')->group(function () {
        Route::get('/', [InvitationController::class, 'index'])
            ->middleware('permission:invitation,view');
        Route::post('/', [InvitationController::class, 'store'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::get('/{invitation}', [InvitationController::class, 'show'])
            ->middleware('permission:invitation,view');
        Route::put('/{invitation}', [InvitationController::class, 'update'])
            ->middleware('role:bac_secretariat,system_admin');
        
        // Status transitions
        Route::post('/{invitation}/submit', [InvitationController::class, 'submit'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{invitation}/approve', [InvitationController::class, 'approve'])
            ->middleware('role:bac_chairperson,hope,system_admin');
        Route::post('/{invitation}/return', [InvitationController::class, 'returnInvitation'])
            ->middleware('role:bac_chairperson,hope,system_admin');
        Route::post('/{invitation}/post', [InvitationController::class, 'post'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{invitation}/send-rfq', [InvitationController::class, 'sendRfq'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::get('/{invitation}/pdf', [InvitationController::class, 'generatePdf'])
            ->middleware('permission:invitation,view');
    });

    // ── Bidder Management (Secretariat) ─────────────────
    Route::prefix('bidders')->group(function () {
        Route::get('/', [BidderManagementController::class, 'index'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/', [BidderManagementController::class, 'store'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{vendor}/physical-verification', [BidderManagementController::class, 'verifyPhysicalDocuments'])
            ->middleware('role:bac_secretariat,system_admin');
    });

    // ── Bid Opening Module ──────────────────────────────
    Route::prefix('bid-openings')->group(function () {
        Route::get('/', [BidOpeningController::class, 'index'])
            ->middleware('permission:bid_opening,view');
        Route::post('/start', [BidOpeningController::class, 'store'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::get('/{bidOpening}', [BidOpeningController::class, 'show'])
            ->middleware('permission:bid_opening,view');
        Route::put('/{bidOpening}/eligibility', [BidOpeningController::class, 'updateEligibility'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::put('/{bidOpening}/bid-price', [BidOpeningController::class, 'updateBidPrice'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{bidOpening}/generate-abstract', [BidOpeningController::class, 'generateAbstract'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{bidOpening}/close', [BidOpeningController::class, 'closeSession'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{bidOpening}/failure', [BidOpeningController::class, 'declareFailure'])
            ->middleware('role:bac_secretariat,bac_chairperson,system_admin');
    });

    // ── Bid Evaluation Module ───────────────────────────
    Route::prefix('evaluations')->group(function () {
        Route::get('/', [EvaluationController::class, 'index'])
            ->middleware('permission:evaluation,view');
        Route::post('/{bidOpening}/submit', [EvaluationController::class, 'submit'])
            ->middleware('role:bac_member,twg_member,system_admin');
        Route::get('/{bidOpening}/summary', [EvaluationController::class, 'summary'])
            ->middleware('permission:evaluation,view');
        Route::post('/{bidOpening}/generate-abstract', [EvaluationController::class, 'generateAbstract'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::put('/{bidOpening}/submit-to-chair', [EvaluationController::class, 'submitToChair'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::put('/{bidOpening}/approve', [EvaluationController::class, 'approve'])
            ->middleware('role:bac_chairperson,system_admin');
        Route::post('/{bidOpening}/failure', [EvaluationController::class, 'declareFailure'])
            ->middleware('role:bac_chairperson,system_admin');
    });

    // ── Post Qualification Module ───────────────────────
    Route::prefix('post-qualifications')->group(function () {
        Route::get('/', [PostQualificationController::class, 'index'])
            ->middleware('permission:post_qualification,view');
        Route::post('/{bidOpening}/initiate', [PostQualificationController::class, 'initiate'])
            ->middleware('role:bac_secretariat,system_admin');
        Route::post('/{postQualification}/acknowledge', [PostQualificationController::class, 'acknowledge'])
            ->middleware('role:vendor,system_admin');
        Route::post('/{postQualification}/vendor-submit', [PostQualificationController::class, 'vendorSubmit'])
            ->middleware('role:vendor,system_admin');
        Route::post('/{postQualification}/evaluate', [PostQualificationController::class, 'evaluate'])
            ->middleware('role:bac_member,twg_member,system_admin');
        Route::post('/resolution/{bacResolution}/finalize', [PostQualificationController::class, 'finalizeResolution'])
            ->middleware('role:bac_chairperson,bac_secretariat,system_admin');
    });

    // ── Award Module ────────────────────────────────────
    Route::prefix('awards')->group(function () {
        Route::get('/', [AwardController::class, 'index'])
            ->middleware('permission:award,view');
        Route::post('/resolutions/{bacResolution}/approve', [AwardController::class, 'hopeApproveResolution'])
            ->middleware('role:hope,system_admin');
        Route::put('/{award}/issue-noa', [AwardController::class, 'issueNoa'])
            ->middleware('role:hope,system_admin');
        Route::put('/{award}/acknowledge', [AwardController::class, 'vendorAcknowledge'])
            ->middleware('role:vendor,system_admin');
        Route::post('/{award}/cancel', [AwardController::class, 'cancelAward'])
            ->middleware('role:hope,system_admin');
    });

    // ── Contract Management Module ───────────────────────
    Route::prefix('contracts')->group(function () {
        Route::get('/', [ContractController::class, 'index'])
            ->middleware('permission:contract,view');
        Route::post('/generate/{award}', [ContractController::class, 'generateContract'])
            ->middleware('role:hope,system_admin');
        Route::put('/{contract}/suspend', [ContractController::class, 'suspendContract'])
            ->middleware('role:hope,bac_secretariat,system_admin');
        Route::put('/{contract}/resume', [ContractController::class, 'resumeContract'])
            ->middleware('role:hope,bac_secretariat,system_admin');
        Route::put('/{contract}/terminate', [ContractController::class, 'terminateContract'])
            ->middleware('role:hope,system_admin');

        // Amendments
        Route::post('/{contract}/amendments', [ContractController::class, 'requestAmendment'])
            ->middleware('role:hope,bac_secretariat,system_admin');
        Route::put('/amendments/{amendment}/approve', [ContractController::class, 'approveAmendment'])
            ->middleware('role:hope,system_admin');

        // Extensions
        Route::post('/{contract}/extensions', [ContractController::class, 'requestExtension'])
            ->middleware('role:hope,bac_secretariat,system_admin');
        Route::put('/extensions/{extension}/approve', [ContractController::class, 'approveExtension'])
            ->middleware('role:hope,system_admin');

        // Inspection & Acceptance Reports (per contract)
        Route::get('/{contract}/inspections', [InspectionAcceptanceReportController::class, 'index'])
            ->middleware('permission:contract,view');
        Route::post('/{contract}/inspections', [InspectionAcceptanceReportController::class, 'store'])
            ->middleware('role:inspection_acceptance_committee,system_admin');
    });

    // ── Inspection Acceptance Reports (global) ───────────
    Route::prefix('inspections')->group(function () {
        Route::get('/', [InspectionAcceptanceReportController::class, 'all'])
            ->middleware('permission:contract,view');
        Route::put('/{iar}/accept', [InspectionAcceptanceReportController::class, 'accept'])
            ->middleware('role:inspection_acceptance_committee,system_admin');
        Route::put('/{iar}/reject', [InspectionAcceptanceReportController::class, 'reject'])
            ->middleware('role:inspection_acceptance_committee,system_admin');
    });

    // ── Invoice Module ──────────────────────────────────
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index'])
            ->middleware('permission:contract,view');
        Route::post('/', [InvoiceController::class, 'store'])
            ->middleware('role:vendor');
        Route::put('/{invoice}/validate', [InvoiceController::class, 'validate'])
            ->middleware('role:finance_officer,system_admin');
        Route::put('/{invoice}/reject', [InvoiceController::class, 'reject'])
            ->middleware('role:finance_officer,system_admin');
        Route::put('/{invoice}/pay', [InvoiceController::class, 'markPaid'])
            ->middleware('role:finance_officer,system_admin');
    });

    // ── System Admin Routes ─────────────────────────────
    Route::middleware('role:system_admin')->prefix('admin')->group(function () {
        Route::get('/users', function () {
            return response()->json(
                \App\Models\User::with('role', 'department')->orderBy('name')->paginate(20)
            );
        });
    });

    // ── Blockchain Audit Trail ──────────────────────────
    Route::prefix('blockchain')->group(function () {
        Route::middleware('permission:blockchain,view')->group(function () {
            Route::get('/events', function (Request $request) {
                $page = (int) $request->input('page', 1);
                $perPage = (int) $request->input('per_page', 20);

                $payload = Cache::remember(
                    "blockchain:events:page:{$page}:per-page:{$perPage}",
                    now()->addSeconds(15),
                    fn () => \App\Models\BlockchainEvent::with(['actor.role'])
                        ->orderBy('block_number', 'desc')
                        ->paginate($perPage)
                        ->toArray()
                );

                return response()->json($payload);
            });
            Route::get('/verify-chain', function () {
                $payload = Cache::remember(
                    'blockchain:verify-chain',
                    now()->addSeconds(15),
                    fn () => \App\Models\BlockchainEvent::verifyChainIntegrity()
                );

                return response()->json($payload);
            });
        });
    });

    // ── Document Registry ───────────────────────────────
    Route::prefix('documents')->group(function () {
        Route::get('/', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\DocumentVersion::with('uploader');
            if ($request->filled('entity_type')) {
                $query->where('entity_type', $request->entity_type);
            }
            if ($request->filled('entity_id')) {
                $query->where('entity_id', $request->entity_id);
            }
            return response()->json($query->orderByDesc('created_at')->get());
        })->middleware('permission:blockchain,view');

        Route::get('/{documentVersion}/verify', function (\App\Models\DocumentVersion $documentVersion) {
            $service = app(\App\Services\DocumentRegistryService::class);
            return response()->json($service->verifyIntegrity($documentVersion));
        })->middleware('permission:blockchain,view');
    });

    Route::middleware('role:system_admin,internal_auditor,observer')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });

    Route::middleware('role:system_admin,internal_auditor')->group(function () {
        Route::get('/immutable-history', [ImmutableHistoryController::class, 'index']);
    });

    Route::middleware('role:internal_auditor')->group(function () {
        Route::get('/integrity-investigations', function (Request $request) {
            $status = trim((string) $request->input('status', ''));
            $search = trim((string) $request->input('search', ''));

            return response()->json(
                app(\App\Services\ProcurementIntegrityService::class)->listInvestigations(
                    $status !== '' ? $status : null,
                    $search !== '' ? $search : null,
                )
            );
        });
    });

    // ── Reports & Analytics ─────────────────────────────
    Route::prefix('reports')->group(function () {
        Route::middleware('role:system_admin,hope,bac_chairperson,bac_secretariat,procurement_officer,budget_officer,finance_officer,internal_auditor,observer')->group(function () {
            Route::get('/summary', [ReportController::class, 'summary']);
            Route::get('/by-mode', [ReportController::class, 'byMode']);
            Route::get('/by-department', [ReportController::class, 'byDepartment']);
            Route::get('/by-status', [ReportController::class, 'byStatus']);
            Route::get('/timeline-compliance', [ReportController::class, 'timelineCompliance']);
        });
        Route::middleware('role:hope')->group(function () {
            Route::get('/hope-performance', [ReportController::class, 'hopePerformance']);
        });
        Route::middleware('role:observer')->group(function () {
            Route::get('/procurement-register', [ReportController::class, 'procurementRegister']);
        });
        Route::middleware('role:internal_auditor')->group(function () {
            Route::get('/risk-indicators', [ReportController::class, 'riskIndicators']);
        });
    });

    // ── Admin Routes ────────────────────────────────────────

    Route::middleware(['auth:sanctum', 'role:system_admin'])->prefix('admin')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Admin\UserManagementController::class);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/roles', function () {
            return response()->json(\App\Models\Role::all());
        });
        Route::get('/departments', function () {
            return response()->json(\App\Models\Department::all());
        });
    });
});
