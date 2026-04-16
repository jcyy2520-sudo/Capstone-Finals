# ProcureSeal — RA 9184/12009 Compliance Fix Plan

## Last Updated: 2026-04-14

---

## PURPOSE

This plan addresses 6 verified compliance gaps found during the codebase audit. These are **not rewrites** — they are targeted additions and hardening of existing modules. Each fix is scoped to minimal changes with clear exit criteria.

**Scope:** Backend models, migrations, controllers, services, routes, and corresponding frontend pages.
**Approach:** Step-by-step, one fix at a time, with user approval before each implementation.

---

## FIX 1: PRE-PROCUREMENT CONFERENCE (New Entity)

**Gap:** RA 9184 IRR Rule V requires a Pre-Procurement Conference before advertisement. Currently, `PreScreeningPage.jsx` exists but only handles vendor document screening — it does NOT model the conference where BAC, TWG, and End-user validate ABC, technical specs, and bidding documents.

**What exists:** `PreScreeningPage.jsx` (vendor doc screening) — this stays; it's a different step.

### Backend

| # | Task | Details |
|---|------|---------|
| 1.1 | Migration: `create_pre_procurement_conferences_table` | Fields: `id`, `purchase_requisition_id` (FK), `invitation_id` (FK, nullable — created after conference), `conference_date`, `venue`, `agenda` (text), `attendees` (JSON — array of `{user_id, role, present}`) |
| | | `abc_validated` (bool), `specs_validated` (bool), `bidding_docs_validated` (bool), `minutes` (text), `minutes_document_path` (nullable) |
| | | `outcome` (enum: approved, deferred, cancelled), `remarks` (text, nullable) |
| | | `conducted_by` (FK users), `status` (draft / scheduled / conducted / approved), `created_at`, `updated_at` |
| 1.2 | Model: `PreProcurementConference` | Relationships: `belongsTo PurchaseRequisition`, `belongsTo Invitation`, `belongsTo User (conducted_by)`. Fillable + casts. |
| 1.3 | Controller: `PreProcurementConferenceController` | Methods: `index`, `store` (create from accepted PR), `show`, `conduct` (mark conducted + record minutes/attendees/validations), `approve` (BAC Chairperson confirms output) |
| 1.4 | Service logic | Enforce: Invitation CANNOT be created unless linked PR has an approved PreProcurementConference. Add check in `InvitationController::store()` or `InvitationService`. |
| 1.5 | Routes | `GET/POST /pre-procurement-conferences`, `GET /pre-procurement-conferences/{id}`, `POST /{id}/conduct`, `POST /{id}/approve`. Role guards: `bac_secretariat` (create/conduct), `bac_chairperson` (approve). |
| 1.6 | BlockchainEvent | New constant: `PRE_PROCUREMENT_CONFERENCE_APPROVED`. Record on approval. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 1.7 | BAC Secretariat: `PreProcurementConferencePage.jsx` | List conferences (per PR), create conference form (date, venue, agenda), conduct form (attendees checklist, ABC/specs/docs validation toggles, minutes textarea, upload minutes doc) |
| 1.8 | BAC Chairperson: Add conference approval to existing flow | Add "Pre-Procurement Conferences" item on chairperson sidebar, approval queue showing pending conferences |
| 1.9 | TWG Member: Conference visibility | Read-only view of conferences they attended |
| 1.10 | Gate Invitation creation | In `InvitationBuilder.jsx`, show warning/block if PR has no approved conference. Fetch conference status when PR is selected. |

### Flow Integration

```
PR accepted → Secretariat creates Pre-Procurement Conference → Schedules + Conducts → 
Chairperson approves → THEN Secretariat can create Invitation/ITB
```

**Exit Criteria:** Cannot create Invitation without approved Pre-Procurement Conference for the linked PR. Conference records attendees, validates ABC/specs/docs, stores minutes. Blockchain event recorded.

---

## FIX 2: EVALUATOR ROLE ENFORCEMENT (TWG vs BAC Separation)

**Gap:** `Evaluation` model has `evaluator_id` but no `evaluator_role` field. Both TWG and BAC members submit through the same route (`POST /evaluations/{bidOpening}/submit`) with role guard `role:bac_member,twg_member`. The backend doesn't store WHICH role the evaluator is acting as, making audit separation impossible.

**What exists:** TWG enforcement in `generateAbstract()` (checks if ≥1 TWG evaluator submitted) — this is good but insufficient.

### Backend

| # | Task | Details |
|---|------|---------|
| 2.1 | Migration: `add_evaluator_role_to_evaluations` | Add `evaluator_role` (string, nullable) to `evaluations` table. Values: `twg_member` or `bac_member`. |
| 2.2 | Update `EvaluationController::submit()` | Auto-set `evaluator_role` from `$request->user()->role->name`. Reject if role is neither `twg_member` nor `bac_member`. |
| 2.3 | Update `generateAbstract()` | Use `evaluator_role` column instead of joining through `evaluator.role` relationship (cleaner query). |
| 2.4 | Update `summary()` response | Group evaluations by `evaluator_role` so frontend can display TWG vs BAC evaluations separately. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 2.5 | TWG `EvaluationsPage.jsx` | Show only TWG-submitted evaluations. Label clearly as "Technical Evaluation (TWG)". |
| 2.6 | BAC Member `EvaluationsPage.jsx` | Show only BAC-submitted evaluations. Label clearly as "BAC Member Evaluation". |
| 2.7 | BAC Secretariat `EvaluationsPage.jsx` | Show both groups separated: "TWG Evaluations" section + "BAC Member Evaluations" section. |
| 2.8 | BAC Chairperson `EvaluationsPage.jsx` | Review screen shows TWG summary + BAC summary before approval. |

**Exit Criteria:** Every evaluation record stores which role submitted it. Frontend displays TWG and BAC evaluations separately. `generateAbstract` uses the stored role.

---

## FIX 3: BID SUBMISSION DEADLINE ENFORCEMENT (Hard Lock)

**Gap:** `BidSubmission` model exists. `Invitation` has `submission_deadline` (datetime). But **no controller or route** exists for bid submissions — the model is orphaned. There's no API endpoint for vendors to submit bids, and no deadline enforcement at the backend level.

**What exists:** `BidSubmission` model (fields: `invitation_id`, `vendor_id`, `bid_amount`, `documents`, `status`). Vendor frontend pages (`VendorMyBidsPage`, `VendorOpportunityDetailsPage`).

### Backend

| # | Task | Details |
|---|------|---------|
| 3.1 | Migration: `add_fields_to_bid_submissions` | Add: `submitted_at` (datetime), `is_late` (bool, default false), `document_hash` (string, nullable — SHA-256 of submitted documents for integrity). |
| 3.2 | Controller: `BidSubmissionController` | Methods: `index` (list by invitation), `store` (vendor submits bid), `show`, `myBids` (vendor's own). |
| 3.3 | `store()` — Deadline enforcement | Hard reject if `now() > invitation->submission_deadline`. Return 403 with clear message: "Submission deadline has passed." No exceptions. |
| 3.4 | `store()` — Invitation status check | Only allow submission if invitation status is `posted` or `sent`. |
| 3.5 | `store()` — Duplicate check | One submission per vendor per invitation. Allow update if status is still `submitted` (not yet opened). |
| 3.6 | `store()` — Document hash | Compute SHA-256 of submitted documents JSON and store. |
| 3.7 | Routes | `GET /bid-submissions?invitation_id=X`, `POST /bid-submissions`, `GET /bid-submissions/{id}`, `GET /vendor/my-bids`. Vendor role guard on store. |
| 3.8 | BlockchainEvent | New constant: `BID_SUBMITTED`. Record on submission. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 3.9 | Vendor `VendorOpportunityDetailsPage.jsx` | Add "Submit Bid" form: bid amount, document uploads (technical envelope, financial envelope). Show countdown to deadline. Disable form after deadline. |
| 3.10 | Vendor `VendorMyBidsPage.jsx` | Wire to real `/vendor/my-bids` endpoint. Show submission status, timestamp, document hash. |
| 3.11 | BAC Secretariat `BidOpeningsPage.jsx` | During bid opening, pull submitted bids from `bid_submissions` table instead of manual entry where applicable. |

**Exit Criteria:** Vendors submit bids through API with hard deadline cutoff. Late submissions get 403. Submissions have SHA-256 hash. Blockchain event recorded. Bid opening can reference submitted bids.

---

## FIX 4: PRE-BID CONFERENCE (Formalized Entity)

**Gap:** Pre-Bid Conference exists only as a date field (`pre_bid_conference_date`) on `Invitation`. No attendees, no minutes, no queries tracking. Per RA 9184 IRR Rule VII §22, the Pre-Bid Conference is a formal event where prospective bidders raise clarifications and the BAC issues supplemental bid bulletins.

**What exists:** `invitation.pre_bid_conference_date` (date field), `InvitationBuilder.jsx` enforces IRR timeline (12-day minimum posting if pre-bid required).

### Backend

| # | Task | Details |
|---|------|---------|
| 4.1 | Migration: `create_pre_bid_conferences_table` | Fields: `id`, `invitation_id` (FK), `conference_date` (datetime), `venue`, `attendees` (JSON — `{vendor_id, representative_name, present}`), `minutes` (text) |
| | | `queries_raised` (JSON — array of `{query, raised_by_vendor_id, bac_response, response_date}`), `supplemental_bid_bulletins` (JSON, nullable — array of bulletin references) |
| | | `status` (scheduled / conducted / minutes_finalized), `conducted_by` (FK users), `created_at`, `updated_at` |
| 4.2 | Model: `PreBidConference` | Relationships: `belongsTo Invitation`, attendees/queries as JSON casts. |
| 4.3 | Controller: `PreBidConferenceController` | Methods: `show` (by invitation), `store` (auto-created when invitation has pre_bid_conference_date), `conduct` (record attendees + queries), `finalizeMinutes` (lock minutes). |
| 4.4 | Routes | `GET /invitations/{invitation}/pre-bid-conference`, `POST /invitations/{invitation}/pre-bid-conference/conduct`, `POST /invitations/{invitation}/pre-bid-conference/finalize`. Role: `bac_secretariat`. |
| 4.5 | Business rule | If `invitation.pre_bid_conference_date` is set, bid opening cannot proceed unless pre-bid conference status is `minutes_finalized`. Add check in `BidOpeningController::store()`. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 4.6 | BAC Secretariat: Pre-Bid Conference section in `InvitationsPage.jsx` | When invitation has `pre_bid_conference_date`, show conference management panel: record attendees (vendor checklist), add queries + BAC responses, finalize minutes. |
| 4.7 | Vendor: Pre-Bid Conference info in `VendorOpportunityDetailsPage.jsx` | Show pre-bid conference date, allow vendor to indicate intent to attend. After conference, show published minutes/queries/responses. |

**Exit Criteria:** Pre-bid conferences tracked as formal records with attendees, queries, and minutes. Bid opening blocked if conference minutes not finalized. Vendors can see conference outcomes.

---

## FIX 5: DOCUMENT VERSIONING SYSTEM

**Gap:** Documents (APP, PR, ITB, Abstracts, Resolutions) are stored as file paths without version tracking. Edits overwrite previous versions. No immutable document registry exists.

**What exists:** `BlockchainEvent` hashes documents on state changes (provides some immutability via audit trail). `AuditLog` captures old/new values. But no dedicated document versioning.

### Backend

| # | Task | Details |
|---|------|---------|
| 5.1 | Migration: `create_document_registry_table` | Fields: `id`, `entity_type` (string — e.g., `App\Models\AppEntry`), `entity_id`, `document_type` (string — e.g., `pr_form`, `itb`, `abstract_as_read`, `abstract_as_calculated`, `resolution`, `noa`, `contract`, `minutes`) |
| | | `version` (int, starts at 1), `file_path`, `file_hash` (SHA-256), `file_size` (int, bytes), `mime_type` |
| | | `uploaded_by` (FK users), `remarks` (nullable), `is_current` (bool, default true) |
| | | `created_at` (immutable — never updated) |
| 5.2 | Model: `DocumentVersion` | Relationships: `morphTo entity`, `belongsTo User (uploaded_by)`. Key method: `static registerVersion(entity, type, path, uploadedBy)` — auto-increments version, marks previous as `is_current=false`, computes hash. |
| 5.3 | Service: `DocumentRegistryService` | Methods: `register(entity, documentType, filePath, userId, remarks)`, `getVersions(entity, documentType)`, `getCurrentVersion(entity, documentType)`, `verifyIntegrity(documentVersion)` (re-compute hash and compare). |
| 5.4 | Integration points | Call `DocumentRegistryService::register()` in: `InvitationController` (ITB/RFQ PDF generation), `BidOpeningController` (abstract as read), `EvaluationController` (abstract as calculated), `PostQualificationController` (resolution document), `AwardController` (NOA), `ContractController` (contract doc). |
| 5.5 | Routes | `GET /documents?entity_type=X&entity_id=Y` (list all versions), `GET /documents/{id}/verify` (integrity check). Permission: `permission:blockchain,view` or entity-level access. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 5.6 | Shared component: `DocumentVersionHistory.jsx` | Reusable panel showing: version list (v1, v2...), upload date, uploader, hash (truncated), "Current" badge on latest. Click to download any version. |
| 5.7 | Integration | Embed `DocumentVersionHistory` in: Secretariat's invitation detail, bid opening detail, evaluation detail, award detail, contract detail. Also in Observer's `RecordsPage`. |
| 5.8 | Auditor: Document integrity check | On `BlockchainPage.jsx` or separate tab — verify document hashes against stored hashes. Flag mismatches. |

**Exit Criteria:** Every generated document (PDF) is registered with version number and SHA-256 hash. Previous versions preserved (never overwritten). Integrity verifiable. Document history viewable per entity.

---

## FIX 6: SECRETARIAT ROLE REBALANCING

**Gap:** Secretariat currently makes decisions that should be BAC-level (e.g., accepting PRs, assigning procurement mode). Per RA 9184, Secretariat is administrative support — they prepare, they don't decide.

**What exists:** Secretariat performs: PR acceptance + mode assignment, invitation creation + posting, bid opening session management, evaluation orchestration.

### Backend

| # | Task | Details |
|---|------|---------|
| 6.1 | PR mode assignment | Change `PurchaseRequisitionController::accept()`: Secretariat can still accept PR, but mode assignment should require a `recommendation` field (Secretariat recommends) + a separate `confirmMode` action by `bac_chairperson`. |
| 6.2 | Migration: `add_mode_recommendation_to_purchase_requisitions` | Add: `recommended_mode` (string, nullable), `recommended_mode_justification` (text, nullable), `mode_confirmed_by` (FK users, nullable), `mode_confirmed_at` (datetime, nullable). |
| 6.3 | New status | Add `pending_mode_confirmation` status to PR flow: `accepted → pending_mode_confirmation → mode_confirmed`. Only after mode is confirmed can Invitation be created. |
| 6.4 | Route: `POST /purchase-requisitions/{pr}/confirm-mode` | Role guard: `bac_chairperson`. Confirms or changes the recommended mode. |

### Frontend

| # | Task | Details |
|---|------|---------|
| 6.5 | BAC Secretariat `PurchaseRequisitionsPage.jsx` | On accept: add "Recommended Mode" dropdown + justification field. Status changes to `pending_mode_confirmation`. |
| 6.6 | BAC Chairperson: Mode confirmation queue | New section or page: list PRs with `pending_mode_confirmation`. Show recommendation + justification. Confirm or override mode. |

**Exit Criteria:** Secretariat recommends mode; Chairperson confirms. This preserves the collegial decision principle without adding unnecessary overhead.

---

## IMPLEMENTATION ORDER

| Priority | Fix | Effort | Dependencies |
|----------|-----|--------|-------------|
| 1 | Fix 3: Bid Submission Deadline | Small | None — model already exists, just needs controller + routes |
| 2 | Fix 2: Evaluator Role Enforcement | Small | None — single migration + minor controller changes |
| 3 | Fix 1: Pre-Procurement Conference | Medium | Must be done before Fix 4 (flow dependency) |
| 4 | Fix 4: Pre-Bid Conference | Medium | Depends on invitation module (already built) |
| 5 | Fix 6: Secretariat Rebalancing | Medium | Touches PR flow — do after Fix 1 |
| 6 | Fix 5: Document Versioning | Medium | Can be done anytime but best after other fixes (to version their outputs too) |

**Total new files:** ~6 migrations, ~4 models, ~3 controllers, ~1 service, ~3 frontend pages/components
**Total modified files:** ~8 backend files, ~6 frontend files

---

## WHAT THIS PLAN DOES NOT COVER

- **Distributed blockchain** — The simulated chain is academically sound. Making it distributed is out of scope for a capstone.
- **Sealed/encrypted bid envelopes** — Physical sealing is not digitally simulatable in a meaningful way. The SHA-256 hash on submission + deadline lock achieves the same integrity goal.
- **Supplemental APP after approval** — Edge case that would complicate the APP flow significantly for minimal capstone value.
- **Full committee voting diffs** — BacResolution already has multi-signature quorum. Adding per-item vote tallying (approve/abstain/dissent) is possible but overkill for the current scope.

---

## COMPLETION TRACKER

| Fix # | Name | Status | Completion Date |
|-------|------|--------|----------------|
| 1 | Pre-Procurement Conference | ⬜ Not Started | — |
| 2 | Evaluator Role Enforcement | ⬜ Not Started | — |
| 3 | Bid Submission Deadline | ⬜ Not Started | — |
| 4 | Pre-Bid Conference | ⬜ Not Started | — |
| 5 | Document Versioning | 🟡 In Progress (5.7 complete) | — |
| 6 | Secretariat Rebalancing | ⬜ Not Started | — |
