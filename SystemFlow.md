# ProcureSeal System Flow Model

Last updated: 2026-05-01

## 1. Purpose

This document is the concise system flow reference for the ProcureSeal capstone. It aligns the role model, status ownership, and phase handoffs with the corrected LGU procurement workflow.

This file is intentionally shorter than the walkthrough. Use it as the control matrix and source of truth for implementation decisions.

## 2. Current System Role Coverage Audit

The current codebase does not yet fully cover the corrected procurement flow.

Current seeded roles in code: 12

1. system_admin
2. hope
3. bac_chairperson
4. bac_member
5. bac_secretariat
6. twg_member
7. department_requester
8. budget_officer
9. finance_officer
10. vendor
11. observer
12. internal_auditor

### 2.1 Coverage Matrix

| Corrected control role | Current codebase coverage | Coverage result | Required action |
| --- | --- | --- | --- |
| System Administrator | Present as system_admin | Covered | Keep as technical admin only |
| HOPE | Present as hope | Covered | Keep |
| BAC Chairperson | Present as bac_chairperson | Covered | Keep |
| BAC Members | Present as bac_member | Covered | Keep |
| BAC Secretariat | Present as bac_secretariat | Covered but too broad | Narrow to BAC administration, posting, routing, and records |
| TWG | Present as twg_member | Covered | Keep |
| Department Requester | Present as department_requester | Partial | Restrict to APP, PR, specs, and delivery receipt observation only |
| Department Head | Missing | Missing | Add as separate role and approval surface |
| Procurement Officer / Procurement Unit | Partially absorbed by bac_secretariat | Partial | Split PO, contract package, and delivery routing authority |
| Budget Officer | Present as budget_officer | Covered | Keep |
| Finance Officer | Present as finance_officer | Covered | Keep |
| Vendor / Supplier | Present as vendor | Covered | Keep |
| Inspection and Acceptance Committee (IAC) | Missing | Missing | Add as separate role and IAR owner |
| COA / GPPB Observer | Present as observer | Partial | Tighten to read-only only |
| Internal Auditor | Present as internal_auditor | Covered | Keep |

### 2.2 Concrete Gaps Already Visible in Code

- department_requester is still modeled as a request originator plus inspection and acceptance actor.
- department_head is not a real role in the current seeded auth model.
- IAC is not a real role in the current seeded auth model.
- procurement_officer is not a real role in the current seeded auth model.
- supply_officer is referenced in route guards even though it is not a seeded role.
- observer is not yet strictly read-only because create actions still exist in the permission map.

## 3. Recommended Target Role Set

### 3.1 Canonical Role Set

The corrected procurement flow requires the following canonical role set if every control point is represented as a distinct login:

1. system_admin
2. hope
3. bac_chairperson
4. bac_member
5. bac_secretariat
6. twg_member
7. procurement_officer
8. department_requester
9. department_head
10. budget_officer
11. finance_officer
12. vendor
13. inspection_acceptance_committee
14. observer
15. internal_auditor

### 3.2 Transitional Build Option

If the project needs a lower-risk transition, Procurement Officer may remain a controlled permission domain under BAC Secretariat in the first implementation pass. Even in that transitional state:

- Department Head must still be a separate workflow authority.
- IAC must still be a separate workflow authority.
- Department Requester must lose inspection acceptance authority.
- supply_officer must be removed from all route guards.

That transitional build results in 14 roles instead of 15.

## 4. Corrected Procurement Flow Summary

### Phase 1: APP

| Step | Responsible role | Action | Status after action | Next role |
| --- | --- | --- | --- | --- |
| 1 | Department Requester | Create APP entry | APP_PENDING_DEPT_HEAD | Department Head |
| 2 | Department Head | Endorse or return APP entry | APP_PENDING_BUDGET_CERT or APP_RETURNED | Budget Officer or Department Requester |
| 3 | Budget Officer | Certify funding basis | APP_PENDING_PROCUREMENT_CONSOLIDATION | Procurement Officer / BAC Secretariat |
| 4 | Procurement Officer / BAC Secretariat | Consolidate APP entries | APP_PENDING_HOPE_APPROVAL | HOPE |
| 5 | HOPE | Approve or return APP | APP_APPROVED or APP_RETURNED | Department Requester |

### Phase 2: PR

| Step | Responsible role | Action | Status after action | Next role |
| --- | --- | --- | --- | --- |
| 1 | Department Requester | Create PR from approved APP | PR_PENDING_DEPT_HEAD | Department Head |
| 2 | Department Head | Endorse or return PR | PR_PENDING_BUDGET_CERT or PR_RETURNED | Budget Officer or Department Requester |
| 3 | Budget Officer | Certify funds and reserve budget | PR_PENDING_HOPE_APPROVAL or PR_PENDING_PROCUREMENT_REVIEW | HOPE or Procurement Officer / BAC Secretariat |
| 4 | HOPE, if routed | Approve or return PR | PR_PENDING_PROCUREMENT_REVIEW or PR_RETURNED | Procurement Officer / BAC Secretariat or Department Requester |
| 5 | Procurement Officer / BAC Secretariat | Validate and accept procurement request | PR_APPROVED | BAC Secretariat / TWG |

### Phase 3: Procurement Planning and Mode Selection

| Step | Responsible role | Action | Status after action | Next role |
| --- | --- | --- | --- | --- |
| 1 | Procurement Officer / BAC Secretariat | Open docket and prepare strategy | PROCUREMENT_PLANNING_IN_PROGRESS | TWG |
| 2 | TWG | Finalize specs and criteria | BIDDING_DOCS_DRAFT | BAC |
| 3 | BAC Chairperson and BAC Members | Confirm procurement mode and release path | MODE_RECOMMENDED or BIDDING_DOCS_FOR_RELEASE | HOPE or BAC Secretariat |
| 4 | HOPE, if alternative mode is routed | Approve alternative modality | MODE_APPROVED | BAC Secretariat |

### Phase 4 to Phase 8: Bidding to Award

| Phase | Controlling roles | Main output |
| --- | --- | --- |
| ITB / Advertisement | BAC Secretariat, BAC Chairperson, BAC Members | ITB_APPROVED, ITB_POSTED |
| Bid Opening | BAC Secretariat, BAC Chairperson, BAC Members, Observers | BIDS_OPENED, ABSTRACT_AS_READ_FINALIZED |
| Evaluation | TWG, BAC Members, BAC Chairperson | EVALUATION_COMPLETED |
| Post-Qualification | TWG, BAC, BAC Secretariat | LCRB_DECLARED or POSTQUAL_FAILED |
| Award | HOPE | NOA_ISSUED |

Key control rule: BAC recommends award. HOPE performs final award approval.

### Phase 9 to Phase 11: Contract, Delivery, Inspection, and Payment

| Phase | Controlling roles | Main output |
| --- | --- | --- |
| Contract and PO | Procurement Officer / Unit, HOPE, Vendor | CONTRACT_SIGNED, PO_CREATED, NTP_ISSUED |
| Delivery receipt | Vendor, Department Requester | DELIVERY_RECEIVED |
| Inspection and acceptance | IAC | IAR_COMPLETED, DELIVERY_ACCEPTED, or DELIVERY_REJECTED |
| Payment | Finance Officer | PAYMENT_COMPLETED |

Key control rule: the Department Requester may confirm receipt, but only the IAC may complete the IAR.

## 5. Status Ownership Model

### 5.1 Planning Statuses

- APP_PENDING_DEPT_HEAD: owned by Department Head queue
- APP_PENDING_BUDGET_CERT: owned by Budget Officer queue
- APP_PENDING_PROCUREMENT_CONSOLIDATION: owned by Procurement Officer / BAC Secretariat queue
- APP_PENDING_HOPE_APPROVAL: owned by HOPE queue
- PR_PENDING_DEPT_HEAD: owned by Department Head queue
- PR_PENDING_BUDGET_CERT: owned by Budget Officer queue
- PR_PENDING_HOPE_APPROVAL: owned by HOPE queue when routed
- PR_PENDING_PROCUREMENT_REVIEW: owned by Procurement Officer / BAC Secretariat queue

### 5.2 Bidding Statuses

- ITB_DRAFT, ITB_POSTED: owned by BAC Secretariat queue
- BID_OPENING_IN_PROGRESS: owned by BAC Secretariat and BAC queue
- EVALUATION_IN_PROGRESS: owned by TWG and BAC Member queue
- POSTQUAL_IN_PROGRESS: owned by TWG queue
- AWARD_FOR_HOPE_APPROVAL: owned by HOPE queue

### 5.3 Delivery and Payment Statuses

- CONTRACT_PENDING_SIGNATURE: owned by Procurement Officer / BAC Secretariat queue
- PO_CREATED: owned by Procurement Officer / Unit queue
- INSPECTION_PENDING: owned by IAC queue
- PAYMENT_VERIFICATION_PENDING: owned by Finance Officer queue
- PAYMENT_HOLD: owned by Finance Officer with correction routed to the responsible office or vendor

## 6. Non-Negotiable Control Rules

- No PR without an approved APP entry.
- No self-endorsement by the same person acting as Requester and Department Head.
- No alternative modality without stored justification and the required approval trail.
- No final award by BAC.
- No IAR creation or approval by Department Requester.
- No payment without PO versus invoice versus IAR matching.
- No write permissions for Observer or Internal Auditor.

## 7. Implementation Decision for the Next Code Pass

The next implementation step should use this priority order:

1. Add Department Head and IAC as real workflow roles.
2. Remove requester inspection ownership.
3. Replace the ghost supply_officer route guard.
4. Split Procurement Officer authority from BAC Secretariat, at minimum as a distinct permission domain.
5. Normalize route guards, dashboard queues, and state ownership to the corrected status model.