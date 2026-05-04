# ProcureSeal Final Procurement Workflow and Implementation Baseline

Last updated: 2026-05-01

## 1. Purpose

This document defines the corrected procurement workflow baseline for the capstone project "Blockchain-Based Procurement and Bidding Management System for the Municipal Bids and Awards Committee."

The workflow is designed for LGU practice and aligns with the control principles commonly enforced under RA 9184 procurement operations. Amount thresholds, posting periods, and alternative modality rules must remain system-configurable so the application can follow the latest GPPB issuances and any updated IRR requirements.

This document replaces earlier drafts that incorrectly blended BAC authority, HOPE authority, end-user inspection authority, and payment controls.

## 2. Core Corrections Applied

- BAC recommends award; HOPE performs final award approval and signs the NOA, contract, and NTP.
- The IAC, not the Department Requester, generates and signs the IAR.
- The PO is created after award and contract perfection, before delivery and payment matching.
- One valid bid is not automatic failure of bidding.
- BAC quorum must be based on configured voting membership, not a hard-coded number.
- Observers and auditors are strictly read-only.
- Alternative procurement modes require recorded justification and approval routing based on policy.

## 3. Role Model and Authorization Baseline

### 3.1 Procurement and Approval Roles

| Role | Responsibilities | System permissions | Can approve | Cannot approve |
| --- | --- | --- | --- | --- |
| HOPE | Final approving authority of the procuring entity; acts on routed APP, award, and contract actions | View all procurement records; approve or return routed items; sign NOA, contract, and NTP; view complete audit trail | APP final approval, PR if routed by LGU rule, award approval, NOA, contract, NTP | BAC voting, technical evaluation, IAR preparation, payment verification |
| BAC Chairperson | Presides over BAC proceedings and signs BAC outputs after BAC action | Manage BAC sessions, validate quorum, sign BAC resolutions and minutes as chair | BAC release of bidding documents, BAC resolutions, evaluation adoption, post-qualification adoption | Final award, payment release, IAR approval |
| BAC Members | Participate in bid opening, evaluation, and BAC deliberation | Review bids, vote on BAC actions, access BAC workspaces | BAC resolutions collectively | Final award, contract signing, IAR, payment approval |
| BAC Secretariat | Provides administrative and records support to BAC | Create procurement docket, post ITB or RFQ, route documents, record attendance, maintain supplier records | Administrative completeness checks only | Award decisions, technical pass or fail determinations, IAR approval, payment release |
| TWG | Provides technical support to BAC during planning, evaluation, and post-qualification | Draft technical requirements, submit technical findings, verify vendor compliance, upload reports | Technical recommendation only | BAC resolutions, final award, payment approval |
| Procurement Officer / Procurement Unit | Handles procurement processing, record packaging, PO preparation, and implementation tracking | Prepare contract package, create PO, monitor delivery milestones, route records | Administrative release of PO if delegated by LGU rule | BAC resolution, final award, IAR approval, payment approval |
| Department Requester / End-User | Originates need, drafts APP and PR, defines specifications, confirms operational receipt | Create APP entries, create PRs, upload specifications, confirm unit receipt observations | None | Endorse own request, inspect alone, sign IAR alone, award, pay |
| Department Head | Reviews and endorses departmental need and priority | Approve or return APP and PR submissions from the department | Departmental endorsement only | BAC actions, final award, payment release, sole inspection authority |
| Budget Officer | Confirms funds, budget ceilings, and budget reservation or certification | Review APP and PR funding, certify or return budget items, flag insufficiency | Budget certification | Bid evaluation, award, inspection, payment release |
| Finance Officer | Verifies payment records and performs three-way matching | Review PO, IAR, invoice, deductions, and payment records | Payment processing and release under finance controls | BAC actions, award, IAR generation |
| Vendor / Supplier | Maintains profile, submits bids or quotations, complies with award and billing requirements | Upload bids, documents, quotations, invoices, acknowledgments | Only vendor acknowledgments and attestations | Any government approval |
| Inspection and Acceptance Committee (IAC) | Inspects delivery or service output and prepares the IAR | Record inspection findings, accept or reject delivery, generate IAR | Inspection acceptance only | Award, BAC actions, payment release |

### 3.2 Oversight Roles

| Role | Responsibilities | System permissions | Can approve | Cannot approve |
| --- | --- | --- | --- | --- |
| Internal Auditor | Reviews compliance, exceptions, and integrity of records | Read-only access to full record set, exceptions dashboard, and audit exports | None | Edit, vote, or approve transactions |
| COA / GPPB Observer | Observes procurement activities for transparency | Read-only access to procurement records, attendance logs, and posted documents | None | Vote, edit, or approve transactions |

### 3.3 Implementation Rules for Role Separation

- Department Requester and Department Head should be separate workflow authorities.
- If a small-office setup forces the same person to hold both positions, the system must block self-endorsement and route the record to an independent higher approver.
- Procurement Officer may be modeled as a distinct role or as a restricted permission set under BAC Secretariat, but PO creation must remain a separate action permission.
- IAC must be implemented as a distinct committee assignment with its own approval surface; the Department Requester cannot finalize acceptance alone.

### 3.4 Current System Role Coverage Audit

The live codebase currently seeds 12 roles only:

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

This does not fully cover the corrected control model.

| Corrected control role | Current code coverage | Coverage result | Required action |
| --- | --- | --- | --- |
| System Administrator | Present as system_admin | Covered | Keep as technical admin only |
| HOPE | Present as hope | Covered | Keep |
| BAC Chairperson | Present as bac_chairperson | Covered | Keep |
| BAC Members | Present as bac_member | Covered | Keep |
| BAC Secretariat | Present as bac_secretariat | Covered but too broad | Remove non-BAC operational control points where needed |
| TWG | Present as twg_member | Covered | Keep |
| Department Requester | Present as department_requester | Partial | Restrict to APP, PR, specs, and delivery receipt observation |
| Department Head | Missing | Missing | Add as separate role |
| Procurement Officer / Procurement Unit | Partially absorbed by bac_secretariat | Partial | Split PO, contract package, and delivery routing authority |
| Budget Officer | Present as budget_officer | Covered | Keep |
| Finance Officer | Present as finance_officer | Covered | Keep |
| Vendor | Present as vendor | Covered | Keep |
| Inspection and Acceptance Committee (IAC) | Missing | Missing | Add as separate role |
| Observer | Present as observer | Partial | Tighten to read-only only |
| Internal Auditor | Present as internal_auditor | Covered | Keep |

Concrete mismatches already visible in the current build:

- department_requester still owns inspection creation and acceptance-related surfaces.
- department_head is not a real seeded auth role.
- IAC is not a real seeded auth role.
- procurement_officer is not a real seeded auth role.
- supply_officer is referenced in route guards but is not a real role.
- observer still has create permissions in the current role map.

### 3.5 Recommended Role Decision for the Build

Canonical target role set: 15 roles including system_admin, department_head, procurement_officer, and inspection_acceptance_committee.

If a lower-risk transition is needed, the minimum acceptable transitional model is 14 roles, where Procurement Officer remains a controlled permission domain under BAC Secretariat. That transition is only acceptable if all of the following are enforced:

- Department Head is still added as a real workflow authority.
- IAC is still added as a real workflow authority.
- Department Requester loses all inspection acceptance authority.
- supply_officer is removed from all route guards.
- PO creation remains isolated from BAC recommendation and HOPE award approval.

## 4. Full Procurement Workflow

### Phase 1: Annual Procurement Plan (APP)

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Department Requester | Encodes the APP requirement based on PPMP input, including project description, ABC, quarter, justification, and preliminary specifications | APP_PENDING_DEPT_HEAD | Department Head |
| 2 | Department Head | Reviews the departmental requirement for necessity, completeness, and priority; may return with remarks | APP_PENDING_BUDGET_CERT or APP_RETURNED | Budget Officer or Department Requester |
| 3 | Budget Officer | Certifies fund source and confirms the item fits within budget ceilings | APP_PENDING_PROCUREMENT_CONSOLIDATION | Procurement Officer / BAC Secretariat |
| 4 | Procurement Officer / BAC Secretariat | Consolidates endorsed entries into the LGU APP and prepares the annual schedule | APP_PENDING_HOPE_APPROVAL | HOPE |
| 5 | HOPE | Approves or returns the consolidated APP; approved entries become locked sources for later PR creation | APP_APPROVED or APP_RETURNED | Department Requesters |

### Phase 2: Purchase Requisition (PR)

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Department Requester | Creates a PR linked to an approved APP item and enters quantities, estimated costs, purpose, and required date | PR_PENDING_DEPT_HEAD | Department Head |
| 2 | Department Head | Endorses or returns the PR based on departmental necessity and completeness | PR_PENDING_BUDGET_CERT or PR_RETURNED | Budget Officer or Department Requester |
| 3 | Budget Officer | Certifies fund availability and creates a budget reservation marker | PR_PENDING_HOPE_APPROVAL or PR_PENDING_PROCUREMENT_REVIEW | HOPE or Procurement Officer / BAC Secretariat |
| 4 | HOPE, if routed by rule | Approves or returns higher-value, sensitive, or specially routed PRs | PR_PENDING_PROCUREMENT_REVIEW or PR_RETURNED | Procurement Officer / BAC Secretariat or Department Requester |
| 5 | Procurement Officer / BAC Secretariat | Validates APP linkage, completeness, and readiness for procurement processing | PR_APPROVED | BAC Secretariat / TWG |

### Phase 3: Procurement Planning and Mode Selection

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Procurement Officer / BAC Secretariat | Opens the procurement docket, assigns the reference number, and prepares the proposed procurement strategy | PROCUREMENT_PLANNING_IN_PROGRESS | TWG |
| 2 | TWG | Refines specifications, scope, eligibility requirements, evaluation criteria, and schedule | BIDDING_DOCS_DRAFT | BAC |
| 3 | BAC Chairperson and BAC Members | Review the proposed procurement mode and draft documents; authorize competitive bidding release or record alternative modality justification | MODE_RECOMMENDED or BIDDING_DOCS_FOR_RELEASE | HOPE or BAC Secretariat |
| 4 | HOPE, if required for alternative modality | Approves the use of the alternative procurement method with written justification | MODE_APPROVED | BAC Secretariat |

Notes:

- Competitive bidding remains the default path.
- Alternative modalities must store justification, legal basis, and approval history.
- Threshold values must be configuration-driven.

### Phase 4: Bidding Process (Competitive Bidding)

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | BAC Secretariat | Prepares the ITB, bid schedule, and posting package from the approved PR and bidding documents | ITB_DRAFT | BAC |
| 2 | BAC Chairperson and BAC Members | Approve release of the ITB and final bidding documents as a BAC action | ITB_APPROVED | BAC Secretariat |
| 3 | BAC Secretariat | Posts the ITB through required channels and records the posting references | ITB_POSTED | Vendors |
| 4 | BAC Chairperson, BAC Members, BAC Secretariat, Observers | Conduct the pre-bid conference when required and issue supplemental or bid bulletins as needed | PRE_BID_COMPLETED or BID_SUBMISSION_OPEN | Vendors |
| 5 | Vendors | Submit bids before the deadline; the system records upload, timestamp, and document hash | BID_SUBMISSION_CLOSED | BAC |

### Phase 5: Bid Opening

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | BAC Secretariat | Opens the bid opening session, records attendees and observers, and verifies BAC quorum from configured voting membership | BID_OPENING_IN_PROGRESS | BAC Chairperson and BAC Members |
| 2 | BAC Chairperson and BAC Members, with BAC Secretariat as recorder | Open bids at the prescribed time and publicly read required bid information | BIDS_OPENED | BAC and TWG |
| 3 | BAC Secretariat | Generates the Abstract of Bids as Read and the opening minutes, then locks the opening record | ABSTRACT_AS_READ_FINALIZED | BAC and TWG |
| 4 | BAC Chairperson | Closes the session and routes the procurement to evaluation | EVALUATION_PENDING | TWG and BAC Members |

Important rule: one valid bid is not automatic failure of bidding. If the bid is responsive and within the ABC, the procurement may proceed to evaluation and post-qualification.

### Phase 6: Evaluation

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | TWG and designated BAC evaluators | Perform detailed technical and financial evaluation, including arithmetic corrections where applicable | EVALUATION_IN_PROGRESS | BAC |
| 2 | System and BAC evaluators | Rank compliant bids; for goods and works, identify the Lowest Calculated Bid | LCB_DECLARED or HRB_DECLARED | BAC |
| 3 | BAC Chairperson and BAC Members | Deliberate on the evaluation report and adopt the BAC action on the results | EVALUATION_COMPLETED | BAC Secretariat |
| 4 | BAC Secretariat | Notifies the leading bidder and schedules post-qualification | POSTQUAL_PENDING | Vendor and TWG |

### Phase 7: Post-Qualification

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Leading Vendor | Submits updated legal, technical, and financial documents required for post-qualification | POSTQUAL_IN_PROGRESS | TWG |
| 2 | TWG | Verifies authenticity, legal standing, technical capability, financial capacity, and any required site validation | POSTQUAL_REPORTED | BAC |
| 3 | BAC Chairperson and BAC Members | Issue the BAC Resolution recommending award to the Lowest Calculated and Responsive Bid, or disqualify the bidder and move to the next ranked bidder | LCRB_DECLARED, POSTQUAL_FAILED, or FAILURE_OF_BIDDING | HOPE or BAC Secretariat |
| 4 | BAC Secretariat | Routes the complete procurement package and BAC recommendation to HOPE | AWARD_FOR_HOPE_APPROVAL | HOPE |

### Phase 8: Award (Notice of Award)

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | HOPE | Reviews the BAC recommendation and either approves it or returns it on documented lawful grounds | NOA_ISSUED or AWARD_RETURNED | Vendor or BAC |
| 2 | HOPE | Issues and signs the NOA after approving the recommendation | NOA_ISSUED | Vendor |
| 3 | Vendor | Acknowledges the award and submits the required performance security within the prescribed period | PERFORMANCE_SECURITY_SUBMITTED or AWARD_DEFAULT | Procurement Officer / BAC Secretariat |

### Phase 9: Contract and Implementation

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Procurement Officer / BAC Secretariat | Verifies the performance security and prepares the contract package | CONTRACT_PENDING_SIGNATURE | Vendor and HOPE |
| 2 | Vendor and HOPE | Sign the contract; this is the point of contract perfection | CONTRACT_SIGNED | Procurement Officer / Unit |
| 3 | Procurement Officer / Unit | Creates the PO for goods procurement based on the approved award and contract terms | PO_CREATED | HOPE or authorized signatory, then Vendor |
| 4 | HOPE | Issues and signs the NTP after contract approval | NTP_ISSUED | Vendor |
| 5 | Vendor | Starts delivery or implementation under the contract, PO, and NTP | CONTRACT_ACTIVE | Department Requester, Procurement Officer, and IAC |

Notes:

- For works or consulting, the contract or job order is the equivalent control document.
- For goods procurement, the PO is mandatory because it is required for later three-way matching.

### Phase 10: Delivery, Inspection, and Acceptance

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Vendor | Delivers goods or completes the service milestone and submits delivery documents | DELIVERY_RECEIVED | Department Requester and IAC |
| 2 | Department Requester | Confirms that the delivery reached the end-user unit and records operational observations only | INSPECTION_PENDING | IAC |
| 3 | IAC | Conducts formal inspection against the PO, contract, and technical specifications and generates the signed IAR | IAR_COMPLETED, DELIVERY_ACCEPTED, or DELIVERY_REJECTED | Procurement Officer / Unit or Vendor |
| 4 | Procurement Officer / Unit | Completes receiving records and forwards the PO, IAR, and delivery records for billing and payment review | PAYMENT_VERIFICATION_PENDING or PAYMENT_PENDING_INVOICE | Finance Officer or Vendor |

### Phase 11: Payment Processing

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Vendor | Submits the invoice or billing statement linked to the accepted delivery and PO | INVOICE_SUBMITTED | Finance Officer |
| 2 | Finance Officer | Performs three-way matching using PO versus invoice versus IAR and checks deductions and support records | PAYMENT_VERIFICATION_IN_PROGRESS, PAYMENT_HOLD, or PAYMENT_APPROVED | Finance Officer or responsible office |
| 3 | Finance Officer | Prepares the disbursement and records the payment decision under LGU finance controls | PAYMENT_APPROVED | Finance release |
| 4 | Finance Officer | Releases payment and records the completed disbursement | PAYMENT_COMPLETED | End of workflow |

## 5. Status Flow Design

### 5.1 APP and PR Statuses

- APP_DRAFT: Initial APP entry under preparation.
- APP_PENDING_DEPT_HEAD: Waiting for departmental endorsement.
- APP_PENDING_BUDGET_CERT: Waiting for budget certification.
- APP_PENDING_PROCUREMENT_CONSOLIDATION: Waiting for APP consolidation.
- APP_PENDING_HOPE_APPROVAL: Waiting for final approval by HOPE.
- APP_APPROVED: Approved and locked; valid source for PR creation.
- APP_RETURNED: Returned for correction.
- PR_DRAFT: Initial PR under preparation.
- PR_PENDING_DEPT_HEAD: Waiting for departmental endorsement.
- PR_PENDING_BUDGET_CERT: Waiting for budget certification.
- PR_PENDING_HOPE_APPROVAL: Waiting for HOPE action if routed by rule.
- PR_PENDING_PROCUREMENT_REVIEW: Waiting for procurement validation.
- PR_APPROVED: Validated and accepted for procurement processing.
- PR_RETURNED: Returned for correction.

### 5.2 Planning, Bidding, and Evaluation Statuses

- PROCUREMENT_PLANNING_IN_PROGRESS: Procurement strategy and schedule are being prepared.
- BIDDING_DOCS_DRAFT: Specifications, criteria, and draft procurement documents are being finalized.
- MODE_RECOMMENDED: BAC has recorded the proposed procurement mode.
- MODE_APPROVED: Alternative modality approval, if required, is complete.
- BIDDING_DOCS_FOR_RELEASE: Competitive bidding documents are ready for release.
- ITB_DRAFT: Invitation package is under preparation.
- ITB_APPROVED: BAC approved release of the ITB.
- ITB_POSTED: Required posting has been completed.
- PRE_BID_COMPLETED: Pre-bid conference and bulletins have been closed.
- BID_SUBMISSION_OPEN: Bid receipt is open.
- BID_SUBMISSION_CLOSED: Bid deadline has passed.
- BID_OPENING_IN_PROGRESS: BAC is conducting bid opening.
- BIDS_OPENED: Bids have been opened and read.
- ABSTRACT_AS_READ_FINALIZED: Opening record has been locked.
- EVALUATION_PENDING: Procurement is queued for evaluation.
- EVALUATION_IN_PROGRESS: Evaluation is ongoing.
- LCB_DECLARED: Lowest Calculated Bid identified for goods or works.
- HRB_DECLARED: Highest Rated Bid identified for consulting.
- EVALUATION_COMPLETED: BAC evaluation action completed.

### 5.3 Post-Qualification, Award, and Contract Statuses

- POSTQUAL_PENDING: Leading bidder is awaiting post-qualification.
- POSTQUAL_IN_PROGRESS: TWG verification is ongoing.
- POSTQUAL_REPORTED: TWG report has been submitted to BAC.
- LCRB_DECLARED: BAC has recommended award to the Lowest Calculated and Responsive Bid.
- POSTQUAL_FAILED: Leading bidder failed post-qualification.
- FAILURE_OF_BIDDING: Procurement failed and must move to rebid or lawful alternative processing.
- AWARD_FOR_HOPE_APPROVAL: BAC recommendation is pending HOPE action.
- AWARD_RETURNED: HOPE returned the recommendation for lawful correction or clarification.
- NOA_ISSUED: Notice of Award issued.
- PERFORMANCE_SECURITY_SUBMITTED: Winning bidder complied with the performance security requirement.
- AWARD_DEFAULT: Winning bidder defaulted after award.
- CONTRACT_PENDING_SIGNATURE: Contract package is ready for signature.
- CONTRACT_SIGNED: Contract is perfected.
- PO_CREATED: PO has been generated for goods procurement.
- NTP_ISSUED: Notice to Proceed issued.
- CONTRACT_ACTIVE: Implementation or delivery is in progress.

### 5.4 Delivery and Payment Statuses

- DELIVERY_RECEIVED: Goods or service output has arrived.
- INSPECTION_PENDING: Delivery is waiting for IAC inspection.
- IAR_COMPLETED: IAC completed the IAR.
- DELIVERY_ACCEPTED: Delivery passed inspection.
- DELIVERY_REJECTED: Delivery failed inspection and requires correction or replacement.
- PAYMENT_PENDING_INVOICE: Delivery is accepted but supplier invoice is not yet complete.
- INVOICE_SUBMITTED: Supplier billing received.
- PAYMENT_VERIFICATION_PENDING: Payment documents are queued for finance review.
- PAYMENT_VERIFICATION_IN_PROGRESS: Finance is performing document matching and validation.
- PAYMENT_HOLD: Finance found a discrepancy or missing requirement.
- PAYMENT_APPROVED: Finance cleared the payment package.
- PAYMENT_COMPLETED: Payment released and recorded.

## 6. Blockchain Integration

Blockchain should be used as an immutable notarization and tamper-detection layer, not as the main workflow engine. The application database remains the system of record for statuses, routing, permissions, notifications, and document storage.

### 6.1 Practical Design

- Each controlled document version is hashed using SHA-256 at the time of submission, approval, or finalization.
- The actual file remains off-chain in application storage.
- The blockchain stores compact evidence only: procurement ID, event type, document hash, actor role, timestamp, and transaction reference.
- On later retrieval, the system recalculates the SHA-256 hash and compares it against the anchored value.
- A mismatch means the file was altered or replaced after anchoring.

### 6.2 Major Events That Must Be Anchored

- APP approval
- PR approval
- ITB posting
- Bid opening completion
- Evaluation report completion
- BAC Resolution finalization
- NOA issuance
- Contract signing
- PO release for goods procurement
- IAR completion
- Payment recording

### 6.3 Tamper Detection Rules

- If the current document hash does not match the anchored hash, the system marks the record as HASH_MISMATCH.
- Downstream approvals must be blocked for critical documents until the discrepancy is resolved.
- Internal Auditor and System Administrator receive an exception alert.
- Observers can view the exception but cannot resolve it.

### 6.4 Fit to the Current Capstone Blockchain Layer

- ProcurementRegistry should anchor milestone events such as APP_APPROVED, PR_APPROVED, ITB_POSTED, BID_OPENING_COMPLETED, EVALUATION_COMPLETED, BAC_RESOLUTION_FINALIZED, NOA_ISSUED, CONTRACT_SIGNED, IAR_COMPLETED, and PAYMENT_RECORDED.
- BidManager is suitable for bid commitment and reveal handling during electronic bidding.
- PaymentTracker is suitable for recording contract payment milestones after award.

## 7. System Design Controls

### 7.1 Role-Based Access Control (RBAC)

- Every role must have a dedicated permission boundary at the API and UI levels.
- Approval buttons must be checked against role, current status, office scope, and assignment.
- System Administrator must not impersonate procurement approvals.

### 7.2 Approval Routing Logic

- Routing must be status-driven, not page-driven.
- The next approver depends on role, amount threshold, procurement mode, and segregation rules.
- Competitive bidding must always pass through BAC recommendation before HOPE award action.
- Alternative modalities must store justification and approval history.

### 7.3 Separation of Duties

- The same user must not originate and endorse the same PR.
- BAC and TWG may evaluate and recommend, but never release payment.
- IAC may inspect and accept or reject delivery, but never award the contract.
- Finance may release payment, but never alter supplier ranking or BAC findings.
- Observers and Internal Auditor remain read-only.

### 7.4 Key Validations

- No PR without an approved APP link.
- PR total must not exceed the remaining APP allocation.
- Budget certification must exist before procurement processing continues.
- Posting and submission dates must comply with configured legal timelines.
- BAC quorum must be computed from active voting membership.
- Only compliant and non-blacklisted vendors may proceed.
- No award without a completed BAC recommendation.
- No delivery acceptance without an IAC-generated IAR.
- No payment without successful three-way matching of PO, invoice, and IAR.

### 7.5 Audit Trail Design

- Store full operational logs in the application database, including actor, timestamp, prior status, new status, remarks, IP, and device context.
- Store immutable evidence of major milestones on blockchain.
- Preserve document version history instead of overwriting files.
- Preserve returned, rejected, and superseded records for audit review.

## 8. Alternative and Exception Flows

### 8.1 Small Value Procurement (SVP)

SVP must remain configuration-driven rather than hard-coded to a single threshold.

| Step | Responsible role | Action performed | Next status | Next task owner |
| --- | --- | --- | --- | --- |
| 1 | Procurement Officer / BAC Secretariat | Prepares the RFQ package and identifies qualified suppliers | RFQ_DRAFT | BAC |
| 2 | BAC | Reviews the RFQ package and records the basis for the alternative modality | RFQ_FOR_RELEASE | BAC Secretariat |
| 3 | BAC Secretariat | Sends the RFQ to the required number of suppliers and records proof of invitation | RFQ_SENT | Vendors |
| 4 | Vendors | Submit quotations within the deadline | QUOTATIONS_RECEIVED | BAC and TWG |
| 5 | BAC and TWG | Evaluate responsiveness and price and prepare the abstract of quotations | ABSTRACT_OF_QUOTATIONS_FINALIZED | HOPE |
| 6 | HOPE | Approves award, after which the flow continues to NOA, contract or PO, delivery, IAC inspection, and payment | NOA_ISSUED or AWARD_RETURNED | Vendor or BAC |

### 8.2 Failure of Bidding

Failure of bidding may be declared when no bids are received, all bids are non-responsive, all bidders fail post-qualification, or other lawful grounds are met. One responsive bid alone is not failure of bidding.

Required handling:

- BAC issues a BAC Resolution declaring failure of bidding.
- The case is routed to HOPE for notation or approval as required by policy.
- The system opens a rebidding workflow or a lawful alternative modality workflow.

### 8.3 Re-Award Process

If the winning bidder fails to submit performance security, refuses to sign the contract, or otherwise defaults after the NOA:

- The system marks the procurement as AWARD_DEFAULT.
- BAC issues a resolution recording the default and recommending award to the next ranked responsive bidder if still lawful.
- HOPE approves the re-award and issues a new NOA.
- If re-award is no longer lawful, the system routes the case to rebidding or failure-of-bidding handling.

## 9. Capstone Implementation Baseline

The capstone build is not complete unless all of the following are enforced in code and workflow configuration:

- Distinct approval surfaces for Department Head endorsement, BAC action, HOPE action, IAC acceptance, and Finance payment processing.
- A status engine that blocks invalid transitions.
- Template-backed generation of ITB, BAC Resolution, NOA, contract, PO, NTP, and IAR records.
- Blockchain anchoring for milestone approvals and document finalization.
- Three-way matching that uses PO, invoice, and IAR before payment release.
- Read-only observer and audit access.

If the current demo retains a 12-role authentication model, it must still implement the missing real-world authorities through assignment rules and action-level permissions rather than by allowing a single user to self-approve multiple control points.

## 10. Implementation Plan: Role and Permission Remediation

### 10.1 Immediate Role Work

The next code pass should implement these role changes first:

1. Add Department Head as a real role with its own dashboard, route tree, and endorsement queue.
2. Add Inspection and Acceptance Committee as a real role with its own inspection queue and IAR authority.
3. Add Procurement Officer as a separate role, or at minimum introduce a dedicated procurement_unit permission domain under BAC Secretariat.
4. Remove the ghost supply_officer role reference and replace it with IAC or the correct operational role.
5. Remove create, edit, approve, and acceptance permissions from Department Requester for inspections.
6. Remove write permissions from Observer.

### 10.2 Backend Role Model Changes

The backend must be updated in this order:

1. Add new role constants to the Role model.
2. Update RoleSeeder with the corrected permission map.
3. Update demo or default user seeders to create Department Head and IAC accounts.
4. Update any workspace resolver or dashboard summary controller to recognize the new roles.
5. Update middleware usage so every protected route uses the corrected role or permission boundary.

### 10.3 Frontend Role Surface Changes

The frontend must be updated in this order:

1. Add a Department Head sidebar, routes file, dashboard page, and endorsement pages.
2. Add an IAC sidebar, routes file, dashboard page, and inspection pages.
3. Remove the inspection page from the Department Requester role.
4. If Procurement Officer becomes a separate login, add its route tree and queue pages for contract package and PO processing.
5. Update role-based redirects and dashboard links so new users land on the correct workspace.

## 11. Implementation Plan: Backend Enums and State Ownership

Section 5 of this document is the canonical enum source for workflow statuses.

The current codebase uses mixed legacy state names and case conventions. The next implementation pass should normalize services, controllers, queues, and dashboards to the canonical status set already defined in this document.

### 11.1 Status Normalization Priorities

1. Normalize APP states to APP_DRAFT, APP_PENDING_DEPT_HEAD, APP_PENDING_BUDGET_CERT, APP_PENDING_PROCUREMENT_CONSOLIDATION, APP_PENDING_HOPE_APPROVAL, APP_APPROVED, and APP_RETURNED.
2. Normalize PR states to PR_DRAFT, PR_PENDING_DEPT_HEAD, PR_PENDING_BUDGET_CERT, PR_PENDING_HOPE_APPROVAL, PR_PENDING_PROCUREMENT_REVIEW, PR_APPROVED, and PR_RETURNED.
3. Normalize bidding and evaluation states to the status model in Section 5.2.
4. Normalize post-qualification, award, contract, inspection, and payment states to the status model in Sections 5.3 and 5.4.
5. Remove mixed uppercase and lowercase status conventions from controller logic and queue counters.

### 11.2 State Ownership Rules

- Department Head owns APP_PENDING_DEPT_HEAD and PR_PENDING_DEPT_HEAD.
- Budget Officer owns APP_PENDING_BUDGET_CERT and PR_PENDING_BUDGET_CERT.
- Procurement Officer or BAC Secretariat owns APP_PENDING_PROCUREMENT_CONSOLIDATION and PR_PENDING_PROCUREMENT_REVIEW.
- BAC Secretariat owns ITB_DRAFT and ITB_POSTED operations.
- BAC and TWG own the evaluation and post-qualification working states.
- HOPE owns AWARD_FOR_HOPE_APPROVAL and other executive approval queues.
- IAC owns INSPECTION_PENDING and IAR_COMPLETED actions.
- Finance Officer owns PAYMENT_VERIFICATION_PENDING, PAYMENT_HOLD, and PAYMENT_APPROVED.

## 12. Implementation Plan: Approval Policies and Route Guards

### 12.1 Target Approval Boundaries

| Workflow action | Correct target role |
| --- | --- |
| APP creation | Department Requester |
| APP endorsement | Department Head |
| APP budget certification | Budget Officer |
| APP consolidation | Procurement Officer / BAC Secretariat |
| APP final approval | HOPE |
| PR creation | Department Requester |
| PR endorsement | Department Head |
| PR budget certification | Budget Officer |
| PR procurement review | Procurement Officer / BAC Secretariat |
| Alternative mode approval | HOPE |
| ITB release approval | BAC Chairperson and BAC action |
| Bid opening | BAC Secretariat with BAC quorum |
| Evaluation inputs | BAC Members and TWG |
| BAC Resolution finalization | BAC Chairperson and BAC Members |
| Final award approval | HOPE |
| Contract signing | HOPE and Vendor |
| PO creation | Procurement Officer / Unit |
| IAR creation and acceptance | IAC |
| Payment validation and release | Finance Officer |

### 12.2 Known Route Guard Mismatches to Correct First

The following current route or permission patterns are inconsistent with the corrected flow and must be fixed before deeper refactoring:

1. PR endorsement is still routed through department_requester instead of Department Head.
2. Contract inspection creation is still routed through department_requester instead of IAC.
3. IAR accept and reject routes reference supply_officer even though that role does not exist.
4. Invitation approval currently allows HOPE even though BAC should own release of bidding documents; HOPE should act on alternative mode approval and final award, not on ordinary BAC release actions.
5. Observer permissions must be read-only only.

### 12.3 Guarding Principle

Every approval button must be protected twice:

1. frontend role-aware rendering
2. backend middleware or policy enforcement based on role, status, and assignment

## 13. Implementation Plan: Dashboard Task Queues

The dashboard model must reflect the corrected ownership of pending work.

| Role | Required queue contents |
| --- | --- |
| Department Requester | APP drafts and returns, PR drafts and returns, delivery receipt notices only |
| Department Head | APP endorsements and PR endorsements |
| BAC Secretariat | APP consolidation, PR procurement review, invitation posting, bidder registry, bid session setup |
| Procurement Officer / Unit | Contract package preparation, PO creation, delivery routing, contract implementation tracking |
| BAC Chairperson | ITB release approvals, resolution actions, BAC oversight queues |
| BAC Members | Bid opening participation, evaluation inputs, post-qualification inputs, BAC voting queue |
| TWG | Technical evaluation and post-qualification verification queue |
| Budget Officer | APP and PR certification queue |
| HOPE | APP approval, alternative mode approvals, BAC recommendation approvals, NOA, contract, and NTP actions |
| IAC | Pending inspections, accepted deliveries, rejected deliveries, IAR finalization |
| Finance Officer | Pending invoices, payment holds, validated payment queue |
| Vendor | Open invitations, bid or quotation tasks, award acknowledgments, invoice submissions |
| Observer | Read-only analytics and record views only |
| Internal Auditor | Read-only risk, audit, and blockchain exception views only |

Current mismatch to remove: the requester workspace still presents inspections as if the requester were the inspecting and accepting authority.

## 14. Immediate Code Corrections Already Identified

The following issues are already confirmed in the live codebase and should be treated as first-pass cleanup items during implementation:

1. RoleSeeder currently describes Department Requester as the head of the requesting department and grants inspection create, edit, and approve permissions.
2. InspectionAcceptanceReportController currently describes IAR creation as a requester or end-user action and stores the inspection under the requester's identity.
3. Contract inspection routes currently allow department_requester to create IAR records.
4. Inspection accept and reject routes currently reference supply_officer even though that role is not seeded.
5. The Department Requester frontend still includes a dedicated Inspections page.
6. Workspace summaries still tell the requester to close the loop on inspections.
7. Observer permissions still include create operations and therefore are not truly read-only.

This plan is now the source of truth for the next implementation pass.