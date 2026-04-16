# ProcureSeal — System Final Implementation Plan

## Last Updated: 2026-04-14

---

## PREAMBLE

This plan governs the actual build sequence for ProcureSeal. It replaces all prior implementation plans.

**Stack:** Laravel 12 (backend) + React 19 (frontend) + Sanctum (auth) + Tailwind CSS (styling)
**Blockchain:** Application-level simulation via BlockchainEvent model (not Hyperledger Fabric)
**Database:** MySQL via Laragon (local dev)
**Priority Modes:** Competitive Bidding (full) → SVP (full) → Direct Acquisition (simplified) → Others (basic)
**Roles (12):** system_admin, hope, bac_chairperson, bac_member, bac_secretariat, twg_member, department_requester, budget_officer, finance_officer, vendor, observer, internal_auditor
**Note:** Department Head is not a separate role — the department_requester role handles endorsement when the user is designated as department head.

---

## PHASE 0: ENVIRONMENT & FOUNDATION
> Goal: Get the system bootable. Database migrated, seeded, login working end-to-end.

- [ ] **0.1** — Verify Laragon services running (PHP, MySQL, Apache/Nginx)
- [ ] **0.2** — Configure backend .env (DB credentials, APP_KEY, mail, etc.)
- [ ] **0.3** — Run `composer install` in capstone-backend/
- [ ] **0.4** — Run `php artisan migrate --seed` — confirm all 27 migrations + RoleSeeder
- [ ] **0.5** — Run `npm install` in capstone-frontend/
- [ ] **0.6** — Create test admin user via tinker or seeder
- [ ] **0.7** — Start backend (`php artisan serve`) and frontend (`npm run dev`)
- [ ] **0.8** — Test login flow: admin login → 2FA (if enabled) → dashboard redirect
- [ ] **0.9** — Verify role-based routing: login as each role → confirm correct dashboard loads
- [ ] **0.10** — Fix any migration errors, CORS issues, or auth token problems

**Exit Criteria:** All 12 roles can log in and see their assigned dashboard shell. No 500 errors.

---

## PHASE 1: SHARED UI FOUNDATION ✅ PRE-BUILT
> Goal: Build the reusable frontend components every role's pages will use.
> **STATUS: Already implemented.** Deep audit on 2026-04-13 confirmed all items exist.

- [x] **1.1** — Shared layout: `GenericLayout.jsx` (sidebar + topbar + content area) — EXISTS
- [x] **1.2** — Role-specific sidebars: All 12 role sidebar components built with SRS menu items — EXIST
- [x] **1.3** — Shared components in `src/shared/components/`: Table (5.6KB, pagination+sorting), Badge (status colors), Button, Modal (2.2KB, Esc handling), Icon (4.9KB, lucide wrapper), PageHeader, RoleFeaturePage (15KB mega-component with summary cards+tables+badges), RoleSidebarShell (5.2KB), ErrorBoundary, ProtectedRoute — ALL EXIST
- [x] **1.4** — Toast system: react-hot-toast installed, `src/utils/toast.js` utility exists — DONE
- [x] **1.5** — API service: `src/services/api.js` with axios instance, token interceptor, base URL config — DONE
- [x] **1.6** — Permission gating: AuthContext.jsx stores user permissions, ProtectedRoute.jsx enforces — DONE
- [x] **1.7** — All 12 role dashboards render inside GenericLayout with correct sidebars — VERIFIED

**Note:** Missing form-specific components (FormInput, FormSelect, FormDatePicker, FileUpload, ConfirmDialog, LoadingSpinner, EmptyState) — these are built inline per page as needed, not as shared abstractions. This is acceptable; we will extract only if duplication becomes a problem.

**Exit Criteria:** ✅ MET. Every role's dashboard renders with layout + sidebar. Shared components functional.

---

## PHASE 2: APP MODULE (Annual Procurement Plan)
> Goal: Department Requester creates APP entries → Secretariat consolidates → Budget Officer certifies → HOPE approves. Full status lifecycle.

### Backend — ✅ VERIFIED FUNCTIONAL (deep audit 2026-04-13)
- [x] **2.1** — `AppEntry` model: fields, relationships, fillable — VERIFIED
- [x] **2.2** — `AppEntryController`: 12 methods fully implemented (index/store/show/update/destroy + submit/accept/return/certifyBudget/approve/modeRecommendation/referenceData) — VERIFIED
- [x] **2.3** — `AppEntryService`: mode recommendation, validations, status transitions — VERIFIED
- [x] **2.4** — Routes: full CRUD + transition endpoints with permission middleware — VERIFIED
- [x] **2.5** — BlockchainEvent recording on APP state changes — VERIFIED (recordEvent called)
- [x] **2.6** — AuditLog entries for APP state changes — VERIFIED

### Frontend — PARTIAL (forms exist, dashboards stubbed)
- [x] **2.7** — Department Requester: AppEntriesPage.jsx — FUNCTIONAL (full form, validation, ABC calc, API calls)
- [x] **2.8** — Department Requester: APP entries list with status badges — FUNCTIONAL
- [x] **2.9** — BAC Secretariat: AppEntriesPage.jsx consolidation — FUNCTIONAL (accept/return with remarks)
- [x] **2.10** — Budget Officer: CertificationPage.jsx — BUILT (tabbed APP+PR view, certify/return actions, real API calls)
- [x] **2.11** — HOPE: ApprovalsPage.jsx — BUILT (APP approval queue, approve/return actions, budget_certified_at column)
- [x] **2.12** — E2E lifecycle tested: draft → submitted → pending_budget_certification → pending_hope_approval → approved ✅ (Blockchain: APP_ENTRY_SUBMITTED + APP_BUDGET_CERTIFIED recorded)

**Exit Criteria:** APP entry can be created, submitted, consolidated, budget-certified, and approved through the UI by 4 different roles. Blockchain events recorded. Returned entries show remarks.

---

## PHASE 3: PR MODULE (Purchase Requisition) ✅ COMPLETED
> Goal: Requester creates PR linked to approved APP → Endorsement step → Budget certifies → Secretariat accepts and assigns mode.

**Note on Department Head Role:** The endorsement step is handled by the `department_requester` role (or `hope`/`system_admin`). There is no separate `department_head` role — the Department model's `head_id` field designates which requester user is the department head, but they operate under the `department_requester` role. This simplifies the role matrix from 13 to 12 roles.

### Backend — ✅ VERIFIED FUNCTIONAL (deep audit 2026-04-13)
- [x] **3.1** — `PurchaseRequisition` + `PrLineItem` models — VERIFIED (relationships, fillable, auto-reference generation)
- [x] **3.2** — `PurchaseRequisitionController` 11 methods — VERIFIED (index/store/show/update/destroy + submit/endorse/certifyBudget/accept/return/returnForModeReassignment)
- [x] **3.3** — Mode assignment by BAC Secretariat during accept (not auto-suggested; mode sent in accept request body)
- [x] **3.4** — Enforced: PR can only link to approved APP entries (checked in submitForEndorsement)
- [x] **3.5** — Enforced: PR total ≤ remaining ABC of linked APP entry (checked in submitForEndorsement)
- [x] **3.6** — BlockchainEvent: PR_SUBMITTED, PR_BUDGET_CERTIFIED, PR_ACCEPTED — 4 recordEvent calls in service
- [x] **3.7** — AuditLog entries for all PR state changes — VERIFIED

### Frontend — ✅ ALL FUNCTIONAL
- [x] **3.7** — Department Requester: PurchaseRequisitionsPage.jsx — FUNCTIONAL (full form, line items, APP linking, remaining ABC)
- [x] **3.8** — Department Requester: PR list with status badges and filters — FUNCTIONAL
- [x] **3.9** — Department Requester (acting as DH): "Endorse" button on PurchaseRequisitionsPage.jsx for pending_dh_endorsement PRs — BUILT (route guarded by role:department_requester,hope,system_admin)
- [x] **3.10** — Budget Officer: CertificationPage.jsx PR tab — ALREADY BUILT in Phase 2 (certify/return actions)
- [x] **3.11** — BAC Secretariat: PurchaseRequisitionsPage.jsx — FUNCTIONAL (accept with mode assignment, blockchain hash display)
- [x] **3.12** — E2E lifecycle tested: draft → pending_dh_endorsement → pending_budget_certification → pending_secretariat_review → accepted ✅ (PR-2026-MHO-0001, ₱15,500, SVP mode assigned)

**Exit Criteria:** PR created with line items, linked to approved APP, flows through 3 role handoffs (requester→budget→secretariat), mode assigned by Secretariat. Blockchain event on acceptance.

---

## PHASE 4: VENDOR MANAGEMENT ✅ COMPLETED
> Goal: BAC Secretariat registers vendors. Vendors log in, change temp password, upload eligibility documents. Secretariat pre-screens.

### Backend — ✅ VERIFIED & EXTENDED
- [x] **4.1** — `Vendor` + `VendorDocument` models — VERIFIED (fillable, casts, relationships, hash verification)
- [x] **4.2** — `BidderManagementController`: register vendor (temp password, requires_password_change=true) — VERIFIED
- [x] **4.3** — Document upload with SHA-256 hash — IMPLEMENTED (POST /vendor/documents, stores in vendor-documents/{id}/)
- [x] **4.4** — Pre-screening: `PreScreeningController` — VERIFIED FUNCTIONAL (mark docs Complete/Incomplete/Expired/Defective)
- [x] **4.5** — Hash verification: `VendorDocument.verifyHash()` + physical verification endpoint — VERIFIED
- [x] **4.6** — BlockchainEvent: VENDOR_REGISTERED event via BidderManagementController, PRESCREENING events — VERIFIED
- [x] **4.NEW** — Vendor profile endpoints: GET /vendor/profile (with documents), PUT /vendor/profile (contact+categories) — BUILT

### Frontend — ✅ ALL FUNCTIONAL
- [x] **4.7** — BAC Secretariat: BiddersPage.jsx — FUNCTIONAL (register form, list, verification modal). Fixed endpoint mismatch (/vendors→/bidders)
- [x] **4.8** — Vendor: forced password change on first login — VERIFIED (requires_password_change flag, limited-scope token)
- [x] **4.9** — Vendor: VendorProfilePage.jsx — BUILT (profile view/edit, document upload, document status table, summary cards)
- [x] **4.10** — BAC Secretariat: PreScreeningPage.jsx — FUNCTIONAL (document checklist per vendor)
- [x] **4.11** — Vendor: VendorOpportunitiesPage.jsx — FUNCTIONAL (browse open invitations with ABC, mode, deadline)

### E2E Test Results (2026-04-13)
- Secretariat registers vendor via POST /bidders → Vendor ID=1, temp password generated ✅
- Vendor logs in → forced password change → new full-access token issued ✅
- GET /vendor/profile → returns business info + documents ✅
- PUT /vendor/profile → updates contact person, email, address, categories ✅
- POST /vendor/documents → uploads PhilGEPS certificate (SHA-256 hashed, status=pending) ✅
- GET /bidders → secretariat sees updated vendor with new contact/categories ✅

**Exit Criteria:** ✅ MET. Secretariat registers vendor, vendor logs in and uploads docs, profile editable, documents tracked with hash.

---

## PHASE 5: INVITATION / ADVERTISEMENT (Competitive Bidding + SVP) ✅ COMPLETED
> Goal: Secretariat creates ITB (Competitive Bidding) or RFQ (SVP). Chairperson approves ITB. Vendors see opportunities.

### Backend
- [x] **5.1** — Verify `Invitation` + `RfqInvitation` models
- [x] **5.2** — Verify `InvitationController`: create ITB, create RFQ, submit for approval, approve, post, send RFQ
- [x] **5.3** — Implement RA 12009 date validation (minimum advertisement periods per SRS)
- [x] **5.4** — Implement PDF generation for ITB and RFQ documents (DomPDF)
- [x] **5.5** — BlockchainEvent: ITB_APPROVED, ITB_POSTED, RFQ_SENT

### Frontend
- [x] **5.6** — BAC Secretariat: "Create ITB" page (SRS 4.4.1) with date constraints
- [x] **5.7** — BAC Secretariat: "Create RFQ" page (SRS 4.4.2) with vendor selector (min 3)
- [x] **5.8** — BAC Chairperson: "ITBs for Approval" queue — REWRITTEN as approval page with expandable cards
- [x] **5.9** — BAC Secretariat: "Posting Checklist" (PhilGEPS, website, bulletin board checkboxes)
- [x] **5.10** — Vendor: "Procurement Opportunities" page shows relevant open ITBs/RFQs
- [x] **5.11** — Vendor: "Submit Quotation" form for SVP

**Exit Criteria:** ✅ ITB created → Chairperson approves → posted. RFQ sent to ≥3 vendors. Return flow with remarks verified.

---

## PHASE 6: BID OPENING SESSION
> Goal: Secretariat opens bid opening session. BAC members confirm quorum. Eligibility checked. Bid prices recorded. Abstract generated.

### Backend
- [x] **6.1** — Verify `BidOpening` + `BidOpeningAttendance` + `BidEligibilityResult` + `BidPrice` models
- [x] **6.2** — Verify `BidOpeningController`: start session, confirm attendance, update eligibility, record bid price, generate abstract, close session, declare failure
- [x] **6.3** — Enforce quorum: session cannot start without ≥3 BAC members confirmed
- [x] **6.4** — Auto-generate Abstract of Bids As Read (PDF)
- [x] **6.5** — BlockchainEvent: BID_OPENING_SESSION_STARTED, BID_OPENING_COMPLETED, FAILURE_OF_BIDDING_DECLARED

### Frontend
- [x] **6.6** — BAC Secretariat: "Start Bid Opening Session" page
- [x] **6.7** — BAC Member: "Confirm Attendance" button (quorum panel)
- [x] **6.8** — Secretariat: eligibility checklist per bidder (Pass/Fail per document)
- [x] **6.9** — Secretariat: bid price entry for eligible bidders
- [x] **6.10** — Abstract of Bids As Read preview + PDF generation
- [x] **6.11** — "Close Session" with confirmation dialog → locks all entries
- [x] **6.12** — Failure of Bidding declaration workflow

**Exit Criteria:** ✅ Full bid opening session conductable through UI. Quorum enforced. Eligibility checked. Prices recorded. Abstract generated. Session locked on close. Blockchain events.

---

## PHASE 7: BID EVALUATION
> Goal: BAC/TWG evaluates eligible bids technically and financially. Rankings computed. Evaluation report generated.

### Backend
- [x] **7.1** — Verify `Evaluation` + `EvaluationSummary` models
- [x] **7.2** — Verify `EvaluationController`: index, submit evaluation, get summary, generate abstract, submit to chair, approve, declare failure
- [x] **7.2a** — `GET /evaluations` index endpoint added (2026-04-14 audit fix) — returns evaluation summaries + pending bid openings
- [x] **7.3** — Auto-rank bidders by calculated price (ascending for goods/works)
- [x] **7.4** — Generate Abstract of Bids As Calculated (PDF)
- [x] **7.5** — BlockchainEvent: EVALUATION_COMPLETED

### Frontend
- [x] **7.6** — BAC Member/TWG: "Evaluation Form" — technical compliance checklist per bidder
- [x] **7.7** — Financial evaluation: calculated price entry with arithmetic correction field
- [x] **7.8** — Auto-ranked bidder table (system-computed, not manually overridable)
- [x] **7.9** — BAC Chairperson: "Approve Evaluation Report" action
- [x] **7.10** — Evaluator completion tracker: "X of Y evaluators completed"

**Exit Criteria:** ✅ All evaluators complete tech+financial evaluation. System auto-ranks. Chairperson approves. Blockchain event recorded.

---

## PHASE 8: POST-QUALIFICATION
> Goal: Rank 1 LCB invited for post-qual. Vendor uploads docs within 5-day window. TWG evaluates. BAC resolution issued.

### Backend
- [x] **8.1** — Verify `PostQualification` model and controller
- [x] **8.2** — Implement: initiate post-qual → send invitation to Rank 1
- [x] **8.3** — Implement: 5-calendar-day deadline computation from acknowledgment
- [x] **8.4** — Implement: vendor document upload with hash + deadline enforcement
- [x] **8.5** — Implement: TWG evaluation (legal/technical/financial checklists)
- [x] **8.6** — Implement: BAC Resolution generator (Declare LCRB / Failed / Next Rank)
- [x] **8.7** — Implement: rank advancement if vendor fails (auto-invite Rank 2)
- [x] **8.8** — BlockchainEvent: POST_QUAL_INVITATION_SENT, POST_QUAL_DOCUMENTS_SUBMITTED, POST_QUAL_EVALUATED, BAC_RESOLUTION_LCRB_DECLARED

### Frontend
- [x] **8.9** — BAC Secretariat: "Initiate Post-Qualification" page with deadline countdown
- [x] **8.10** — Vendor: "Post-Qualification Documents" upload page with completeness meter
- [x] **8.11** — TWG: "Post-Qualification Evaluation" form (3-category checklist)
- [x] **8.12** — BAC: "BAC Resolution" page with voting, quorum check, signature workflow
- [x] **8.13** — Route to HOPE approval queue

**Exit Criteria:** ✅ MET. Post-qual invitation sent. Vendor uploads within deadline. TWG evaluates. BAC resolution declares LCRB. Resolution routed to HOPE. Rank advancement works on failure.

---

## PHASE 9: AWARD
> Goal: HOPE approves BAC resolution. NOA generated and issued. Vendor acknowledges. Performance security tracked.

### Backend
- [x] **9.1** — Verify `Award` model and `AwardController` — Award model has status constants (DRAFT/ISSUED/ACKNOWLEDGED/NTP_ISSUED/CANCELLED/RE_AWARD)
- [x] **9.1a** — `AwardService` created (2026-04-14 audit fix) — business logic extracted from controller into transactional service
- [x] **9.1b** — `StoreAwardRequest` FormRequest created (2026-04-14 audit fix) — validates performance_security_percentage
- [x] **9.2** — HOPE approval of BAC Resolution
- [x] **9.3** — Auto-generate NOA from GPPB template (DomPDF) — simulated path (PDF template deferred to Phase 15)
- [x] **9.4** — NOA issuance and vendor notification
- [x] **9.5** — Vendor acknowledgment tracking (3-day deadline)
- [x] **9.6** — Performance security deadline tracker (10 days)
- [x] **9.7** — Award cancellation workflow
- [x] **9.8** — BlockchainEvent: HOPE_RESOLUTION_ACTION, NOA_ISSUED, NOA_ACKNOWLEDGED, AWARD_CANCELLED

### Frontend
- [x] **9.9** — HOPE: "Approve BAC Resolution" page with full procurement record view
- [x] **9.10** — BAC Secretariat: Award tracking dashboard (NOA status, deadlines, perf security)
- [x] **9.11** — HOPE: "Sign & Issue NOA" + "Cancel Award" actions in AwardManagementPage
- [x] **9.12** — Vendor: "Acknowledge NOA" page with deadline countdown and acknowledgment button
- [x] **9.13** — Secretariat: acknowledgment + performance security tracking dashboard

**Exit Criteria:** ✅ MET. HOPE approves resolution → signs NOA → vendor acknowledges → 3-day + 10-day deadlines tracked. Award cancellation functional. Blockchain events recorded.

---

## PHASE 10: CONTRACT MANAGEMENT
> Goal: Contract + NTP generated. Implementation tracked. Amendments, extensions, suspension, termination supported. IAR + invoice processing.

### Backend
- [x] **10.1** — Verify `Contract` + `ContractAmendment` + `ContractExtension` + `ContractSuspension` + `InspectionAcceptanceReport` models — ALL VERIFIED
- [x] **10.1a** — `Contract::generateReference()` added (2026-04-14 audit fix) — sequential CON-{YEAR}-{SEQ} format replacing rand()
- [x] **10.1b** — `StoreContractRequest` FormRequest created (2026-04-14 audit fix) — validates duration_days
- [x] **10.2** — Contract + NTP generation — simulated path (DomPDF deferred to Phase 15)
- [x] **10.3** — Contract status tracking: Active/Suspended/Completed/Terminated — DONE
- [x] **10.4** — Amendment, extension, suspension, termination workflows — DONE (requestAmendment, approveAmendment, requestExtension, approveExtension, suspendContract, resumeContract, terminateContract)
- [x] **10.5** — IAR creation and acceptance flow — DONE (InspectionAcceptanceReportController: store, accept, reject)
- [x] **10.6** — Invoice three-way match (Invoice vs Contract vs IAR) — DONE (InvoiceController: validate with 3-way match)
- [x] **10.7** — BlockchainEvent: CONTRACT_SIGNED, CONTRACT_SUSPENDED, CONTRACT_RESUMED, CONTRACT_TERMINATED, AMENDMENT_APPROVED, EXTENSION_APPROVED, IAR_CREATED, IAR_ACCEPTED, INVOICE_SUBMITTED, INVOICE_VALIDATED, INVOICE_PAID

### Frontend
- [x] **10.8** — Contract Dashboard (SRS 4.10.1): filterable list, status badges, progress bars — ContractsPage.jsx (BAC Secretariat)
- [x] **10.9** — Contract actions (amend, extend, suspend, terminate) — routes wired in api.php
- [x] **10.10** — Department Requester: InspectionsPage.jsx — REBUILT (IAR creation form, items inspector, summary cards, table)
- [x] **10.11** — Finance Officer: InvoicesPage.jsx — REBUILT (three-way match validation, reject, mark paid)
- [x] **10.12** — Vendor: VendorContractsPage.jsx — REBUILT (contract list + submit invoice modal + invoice history)

**Exit Criteria:** ✅ MET. Full contract lifecycle manageable. IAR and invoice processing working. All blockchain events recorded. AwardController recordLocalEvent→recordEvent fixed (5 calls).

---

## PHASE 11: ALTERNATIVE PROCUREMENT MODES (Simplified)
> Goal: Support the remaining 9 modes with justification + HOPE approval + record keeping.

- [x] **11.1** — Direct Acquisition: simplified form (≤₱200K, supplier quotation date, selected supplier)
- [x] **11.2** — Repeat Order: link to original contract, auto-validate 3 conditions (active/completed, within 6 months, same items + price compliance)
- [x] **11.3** — Negotiated Procurement: justification with ground selection (9 grounds), link to 2 failed biddings or emergency declaration
- [x] **11.4** — Direct Contracting: exclusivity proof (4 bases) + HOPE approval
- [x] **11.5** — Limited Source Bidding: shortlist justification + ≥2 shortlisted suppliers + HOPE approval
- [x] **11.6** — Direct Sales: selling agency + price comparison basis
- [x] **11.7** — Competitive Dialogue: deferred (rare mode, not in RA 9184 core)
- [x] **11.8** — Unsolicited Offer with Bid Matching: deferred (rare mode)
- [x] **11.9** — Direct Procurement for STI: STI classification (5 types) + technical endorsement

**Built:** AlternativeModeValidator service (per-mode validation per RA 9184), InvitationBuilder mode-specific forms (7 modes), HOPE AlternativeModeApprovalsPage, mode_specific_data JSON migration, InvitationService integration.

**Exit Criteria:** ✅ MET. Each mode has: justification form in InvitationBuilder, HOPE approval gate via InvitationService, blockchain event (ALTERNATIVE_MODE_RECORDED), and record keeping via mode_specific_data JSON column. Competitive Dialogue and Unsolicited Offer deferred as rare modes.

---

## PHASE 12: NOTIFICATIONS & DEADLINE MONITORING
> Goal: Email notifications for critical events. Background job for deadline tracking.

- [x] **12.1** — Build Laravel Mail classes for critical notifications (ProcurementNotificationMail, DeadlineWarningMail + Blade templates)
- [x] **12.2** — Build in-app notification system (NotificationController CRUD API + NotificationService dispatch service)
- [x] **12.3** — Build frontend notification bell component (NotificationBell in GenericLayout top bar, 30s polling, dropdown with mark-read)
- [x] **12.4** — Build Laravel Scheduled Command for deadline monitoring (procureseal:monitor-deadlines, runs every 6 hours)
- [x] **12.5** — Deadline alerts at 75%, 90%, 100% for: bid submission, post-qual submission, NOA acknowledgment, performance security, contract signing, contract completion
- [x] **12.6** — Vendor document expiry tracking (30-day warning window, auto-marks expired)

**Built:** 2 Mailable classes + 2 Blade templates, NotificationController (5 endpoints), NotificationService (notify/notifyMany/sendDeadlineWarning), NotificationBell component in shared layout, MonitorDeadlines artisan command with cache-based threshold deduplication.

**Exit Criteria:** ✅ MET. Critical events triggerable via NotificationService. Deadline job runs every 6 hours and sends in-app + email alerts at 75%/90%/100%. Bell icon shows unread count with dropdown.

---

## PHASE 13: REPORTS, AUDIT, & OBSERVER ACCESS
> Goal: Audit trail viewable. Reports generated. COA/GPPB observer read-only portal functional.

- [x] **13.1** — Audit Logs page: filterable by user, action, entity, date range
- [x] **13.2** — Blockchain Event viewer: chain integrity verification
- [x] **13.3** — Observer dashboard: read-only procurement register with all records
- [x] **13.4** — Internal Auditor dashboard: flagged transactions, risk indicators
- [x] **13.5** — Reports: procurement by mode, by department, by status, by timeline compliance
- [x] **13.6** — HOPE Performance Dashboard: savings analysis, active procurement summary

**Exit Criteria:** All audit/observer/report features functional for COA, GPPB, Internal Auditor, and HOPE roles.

---

## PHASE 14: SECURITY HARDENING & TESTING
> Goal: System secured against OWASP Top 10. Core workflows tested.

- [ ] **14.1** — CSRF protection verification
- [ ] **14.2** — Rate limiting on auth endpoints (already configured — verify)
- [ ] **14.3** — Input validation on all API endpoints (Laravel Form Requests)
- [ ] **14.4** — File upload validation (type, size, malware scan placeholder)
- [ ] **14.5** — Permission enforcement verification: attempt cross-role API access → confirm 403
- [ ] **14.6** — XSS prevention audit on frontend inputs
- [ ] **14.7** — Write Feature tests for critical flows: login, APP lifecycle, PR lifecycle, bid opening, award
- [ ] **14.8** — Write Unit tests for services: mode recommendation, deadline computation, hash verification

**Exit Criteria:** No OWASP Top 10 vulnerabilities. Critical flows have automated test coverage. Cross-role access blocked at API level.

---

## PHASE 15: DEPLOYMENT PREP & DOCUMENTATION
> Goal: System deployable. Documentation complete for capstone defense.

- [ ] **15.1** — Create database seeder with realistic demo data (sample APP, PRs, vendors, bids)
- [ ] **15.2** — Build deployment guide (Laragon → production server)
- [ ] **15.3** — Prepare capstone defense demo script (end-to-end competitive bidding scenario)
- [ ] **15.4** — Final system walkthrough: all 12 roles, all major workflows
- [ ] **15.5** — User manual PDF generation

**Exit Criteria:** System is demo-ready. Defense materials prepared. Clean database seed available.

---

## COMPLETION TRACKER

| Phase | Name | Status | Completion Date |
|-------|------|--------|----------------|
| 0 | Environment & Foundation | ✅ Completed | 2026-04-13 |
| 1 | Shared UI Foundation | ✅ Pre-Built | 2026-04-13 |
| 2 | APP Module | ✅ Completed | 2026-04-13 |
| 3 | PR Module | ✅ Completed | 2026-04-13 |
| 4 | Vendor Management | ✅ Completed | 2026-04-13 |
| 5 | Invitation / Advertisement | ✅ Completed | 2026-04-13 |
| 6 | Bid Opening Session | ✅ Completed | 2026-04-13 |
| 7 | Bid Evaluation | ✅ Completed | 2026-04-13 |
| 8 | Post-Qualification | ✅ Completed | 2026-04-13 |
| 9 | Award | ✅ Completed | 2026-04-13 |
| 10 | Contract Management | ✅ Completed | 2026-04-13 |
| 11 | Alternative Modes | ✅ Completed | 2026-04-13 |
| 12 | Notifications & Deadlines | ✅ Completed | 2026-04-13 |
| 13 | Reports & Audit | ✅ Completed | ReportController (8 endpoints), Observer 4 pages, Auditor 4 pages, HOPE Dashboard+Reports rewritten with live API |
| 14 | Security & Testing | ⬜ Not Started | — |
| 15 | Deployment & Documentation | ⬜ Not Started | — |

---

## AUDIT FIXES LOG (2026-04-14)

| # | Issue | Fix Applied | Files Changed |
|---|-------|-------------|---------------|
| 1 | Award enum case mismatch (lowercase vs UPPERCASE) | Added status constants to Award model; confirmed migration 142334 already applied | `app/Models/Award.php` |
| 2 | Contract reference uses `rand()` — collision risk | Added `Contract::generateReference()` with sequential numbering (CON-{YEAR}-{SEQ}); updated ContractController | `app/Models/Contract.php`, `app/Http/Controllers/BAC/ContractController.php` |
| 3 | No evaluations index endpoint | Added `index()` to EvaluationController + `GET /evaluations` route | `app/Http/Controllers/BAC/EvaluationController.php`, `routes/api.php` |
| 4 | No AwardService — business logic scattered in controller | Created `AwardService` with transactional methods; refactored `AwardController` to delegate | `app/Services/AwardService.php`, `app/Http/Controllers/BAC/AwardController.php` |
| 5 | Missing Form Requests for Phases 6–10 | Created 5 FormRequests: `StoreAwardRequest`, `StoreContractRequest`, `PostQualificationEvaluateRequest`, `UpdateVendorRequest`, `StoreBidPriceRequest` | `app/Http/Requests/BAC/` (5 new files) |
| 6 | VendorMessagesPage was static placeholder | Replaced with real page pulling from `/notifications` API (mark read, filter, unread count) | `capstone-frontend/src/roles/vendor/pages/VendorMessagesPage.jsx` |
| 7 | PaymentsPage was static placeholder | Replaced with real page pulling from `/invoices` API (filter by status, totals) | `capstone-frontend/src/roles/finance_officer/pages/PaymentsPage.jsx` |
| 8 | Plan claimed "Department Head" role that doesn't exist | Clarified in plan: DH endorsement handled by `department_requester` role, not a separate role | `SystemFinalImplementationPlan.md` |
| 9 | Phases 6/7 items unchecked but tracker said complete | Fixed checkboxes to match actual completion status | `SystemFinalImplementationPlan.md` |
