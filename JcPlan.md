Corrected LGU Procurement Workflow

This is the version I would defend for an LGU-aligned capstone. The key corrections to the current draft are these:

BAC recommends award; HOPE makes the final award decision.
The IAC, not the Department Requester, generates and signs the IAR.
The PO belongs after award and contract perfection, before delivery and payment.
A single valid bid is not automatically a failure of bidding.
BAC quorum should be based on the configured BAC membership, not hard-coded to 3.
Small Value Procurement thresholds should be configurable from current GPPB issuances, not hard-coded.
1. System Roles

Role	Responsibilities	System permissions	Can approve	Cannot approve
HOPE	Final approving authority of the procuring entity; approves APP, award, and contract execution actions routed to him or her	View all procurements, approve or return records, issue NOA, sign contract, issue NTP, view full audit trail	APP final approval, PR if LGU policy requires, BAC recommendation for award, NOA, contract, NTP	Technical evaluation, BAC voting, IAR, payment verification
BAC Chairperson	Presides over BAC proceedings and signs BAC outputs as chair after BAC action	Manage BAC calendars, validate quorum, sign BAC resolutions and minutes as chair	Release of BAC-approved bidding documents, BAC resolutions, evaluation and post-qualification resolutions as BAC chair	Final award, contract approval, payment approval
BAC Members	Participate in bid opening, evaluation, post-qualification deliberation, and BAC voting	Access BAC workspaces, review bids, vote on BAC resolutions	BAC resolutions collectively	NOA, contract, NTP, payment, IAR
BAC Secretariat	Administrative support to BAC; posting, notices, minutes, records, routing, supplier registry support	Create procurement docket, post ITB or RFQ, record attendance, upload minutes, route documents, maintain vendor records	Administrative completeness checks only	Award decisions, technical findings, IAR, payment
TWG	Technical support to BAC; prepares specs or TOR, assists evaluation, verifies documents during post-qualification	Draft specs, submit technical reports, perform verifications, record findings	Technical recommendation only	BAC resolutions, final award, payment
Procurement Officer / Procurement Unit	Procurement processing, contract package preparation, PO preparation, delivery coordination, records control	Create procurement plans, prepare contract and PO package, track delivery and contract milestones	Administrative release of PO if delegated by LGU rules	BAC resolutions, final award, IAR, payment approval
Department Requester / End-User	Originates requirement, drafts APP input and PR, defines specifications, confirms operational need	Create APP line items, create PR, upload specs, confirm unit receipt of delivered items	None	Endorse own PR, award, inspect alone, sign IAR alone, pay
Department Head	Reviews and endorses the department’s need and priority	Approve or return APP inputs and PRs from own office	Departmental endorsement only	BAC outputs, final award, IAR alone, payment
Budget Officer	Validates allotment and fund availability and places budget reservation or certification	Review APP and PR funding, certify availability, flag insufficiency	Budget certification	Bid evaluation, award, inspection, payment release
Finance Officer	Verifies invoice package, performs three-way match, computes deductions, records disbursement	Review PO, IAR, invoice, taxes, penalties, payment records	Payment processing and release under finance controls	Award, BAC actions, IAR creation
Vendor / Supplier	Maintains profile, submits bids or quotations, submits performance security, signs contract, delivers, invoices	Upload bids, documents, quotations, invoice, acknowledge notices	Only its own acknowledgments and attestations	Any government approval
Inspection and Acceptance Committee (IAC)	Inspects deliveries and services, checks compliance against PO or contract, prepares and signs IAR	Schedule inspection, record findings, accept or reject items, generate IAR	Inspection acceptance only	Award, BAC actions, payment release
Internal Auditor	Monitors compliance, exceptions, and integrity of records	Read-only access to all records, exception dashboards, export audit reports	None	Edit or approve transactions
COA / GPPB Observer	Observes designated BAC activities for transparency	Read-only access to records, attendance logs, public and controlled procurement views	None	Vote, edit, approve, award
Recommended role model: Department Requester and Department Head should be separate system roles. If the same person must act in both capacities in a small office, the system should flag a segregation-of-duties exception and force an independent higher approver before BAC processing continues.

2. Full Procurement Workflow

Phase 1: Annual Procurement Plan (APP)

Department Requester: Encodes department procurement requirements derived from PPMP inputs, including item description, ABC, quarter, justification, and preliminary specifications. Next status: APP_PENDING_DEPT_HEAD. Next task owner: Department Head.
Department Head: Reviews necessity, priority, and completeness of the department submission. If incomplete, returns it with remarks. If acceptable, endorses it. Next status: APP_PENDING_BUDGET_CERT or APP_RETURNED. Next task owner: Budget Officer or Department Requester.
Budget Officer: Certifies that the planned requirement is within approved budget ceilings and identifies the proper fund source. Next status: APP_PENDING_PROCUREMENT_CONSOLIDATION. Next task owner: Procurement Officer or BAC Secretariat.
Procurement Officer or BAC Secretariat: Consolidates endorsed departmental entries into the LGU APP, validates procurement categories, and prepares the annual procurement schedule. Next status: APP_PENDING_HOPE_APPROVAL. Next task owner: HOPE.
HOPE: Reviews and approves the consolidated APP. Approved APP entries are locked and become the only valid source for later PR creation. Next status: APP_APPROVED. Next task owner: Department Requesters.
Phase 2: Purchase Requisition (PR)

Department Requester: Creates a PR linked to an approved APP item, enters item details, quantity, specifications, required date, and purpose. The system checks that the request does not exceed the APP balance. Next status: PR_PENDING_DEPT_HEAD. Next task owner: Department Head.
Department Head: Endorses the PR if justified and aligned with department operations; otherwise returns it for correction. Next status: PR_PENDING_BUDGET_CERT or PR_RETURNED. Next task owner: Budget Officer or Department Requester.
Budget Officer: Certifies fund availability and creates a budget reservation or obligation marker. Next status: PR_PENDING_HOPE_APPROVAL if required by LGU policy or threshold, otherwise PR_PENDING_PROCUREMENT_REVIEW. Next task owner: HOPE or Procurement Officer / BAC Secretariat.
HOPE, if routed: Approves higher-value, sensitive, or specially delegated PRs, or returns them with reason. Next status: PR_PENDING_PROCUREMENT_REVIEW or PR_RETURNED. Next task owner: Procurement Officer / BAC Secretariat or Department Requester.
Procurement Officer or BAC Secretariat: Performs completeness and APP-link validation and formally accepts the request for procurement processing. Next status: PR_APPROVED. Next task owner: BAC Secretariat / TWG.
Phase 3: Procurement Planning and Mode Selection

Procurement Officer or BAC Secretariat: Opens the procurement docket, assigns reference numbers, and prepares the proposed procurement strategy based on ABC, category, and timing. Next status: PROCUREMENT_PLANNING_IN_PROGRESS. Next task owner: TWG.
TWG: Refines specifications, scope, eligibility requirements, evaluation criteria, delivery schedule, and draft bidding documents or RFQ package. Next status: BIDDING_DOCS_DRAFT. Next task owner: BAC.
BAC Chairperson and BAC Members: Review the proposed mode of procurement and the draft procurement documents. For competitive bidding, BAC authorizes release of the bidding documents. For alternative modalities, BAC records the justification. Next status: MODE_RECOMMENDED or BIDDING_DOCS_FOR_RELEASE. Next task owner: HOPE if alternative method needs approval, otherwise BAC Secretariat.
HOPE, if alternative modality is used and routed by rule: Approves the use of the alternative method with written justification. Next status: MODE_APPROVED. Next task owner: BAC Secretariat.
Phase 4: Bidding Process (Competitive Bidding)

BAC Secretariat: Prepares the Invitation to Bid, bid schedule, and posting package from the approved PR and bidding documents. Next status: ITB_DRAFT. Next task owner: BAC.
BAC Chairperson and BAC Members: Approve the release and posting of the ITB and final bidding documents as a BAC action. Next status: ITB_APPROVED. Next task owner: BAC Secretariat.
BAC Secretariat: Posts the ITB through required publication and posting channels and records the posting references. Next status: ITB_POSTED. Next task owner: Vendors.
BAC Chairperson, BAC Members, BAC Secretariat, and Observers: Conduct the pre-bid conference when required and issue supplemental or bid bulletins as needed. Next status: PRE_BID_COMPLETED or BID_SUBMISSION_OPEN. Next task owner: Vendors.
Vendors: Submit bids before the deadline. In a web implementation, the system records upload time, hash, and sealed submission. If the LGU still uses physical originals, receipt of the envelope is logged as well. Next status: BID_SUBMISSION_CLOSED at deadline. Next task owner: BAC.
Phase 5: Bid Opening

BAC Secretariat: Opens the bid opening session in the system, records attendees and observers, and confirms that BAC quorum is met based on configured membership. Next status: BID_OPENING_IN_PROGRESS. Next task owner: BAC Chairperson and BAC Members.
BAC Chairperson and BAC Members, with BAC Secretariat as recorder: Open bids at the prescribed time and read out required bid information. Observers remain read-only and are recorded only as attendees. Next status: BIDS_OPENED. Next task owner: BAC and TWG.
BAC Secretariat: Generates the Abstract of Bids as Read and the session minutes and locks the opening record. Next status: ABSTRACT_AS_READ_FINALIZED. Next task owner: BAC and TWG.
BAC Chairperson: Closes the opening session and routes the procurement to evaluation. Next status: EVALUATION_PENDING. Next task owner: TWG and BAC Members.
Important correction: one valid bid is not, by itself, a failure of bidding. If the single bid is responsive and within the ABC, it can continue to evaluation and post-qualification.

Phase 6: Evaluation

TWG and designated BAC evaluators: Perform detailed evaluation based on the bidding documents, checking technical compliance, arithmetic corrections, and financial responsiveness. Next status: EVALUATION_IN_PROGRESS. Next task owner: BAC.
System and BAC evaluators: Rank compliant bids. For goods and works, the system identifies the Lowest Calculated Bid. For consulting services, use the Highest Rated Bid logic instead. Next status: LCB_DECLARED or HRB_DECLARED. Next task owner: BAC.
BAC Chairperson and BAC Members: Deliberate on the evaluation report and adopt the BAC resolution reflecting the LCB or HRB result. Next status: EVALUATION_COMPLETED. Next task owner: BAC Secretariat.
BAC Secretariat: Notifies the leading bidder and schedules post-qualification. Next status: POSTQUAL_PENDING. Next task owner: Vendor and TWG.
Phase 7: Post-Qualification

Leading Vendor: Submits updated legal, technical, and financial documents required for post-qualification and makes itself available for verification. Next status: POSTQUAL_IN_PROGRESS. Next task owner: TWG.
TWG: Verifies authenticity, legal standing, technical capability, financial capacity, and any required site or office validation. Next status: POSTQUAL_REPORTED. Next task owner: BAC.
BAC Chairperson and BAC Members: Deliberate on the TWG report and issue a BAC Resolution recommending award to the Lowest Calculated and Responsive Bid if passed, or disqualifying the bidder and moving to the next ranked bidder if failed. Next status: LCRB_DECLARED, POSTQUAL_FAILED, or FAILURE_OF_BIDDING. Next task owner: HOPE if passed, or BAC Secretariat for next bidder or rebid if failed.
BAC Secretariat: Routes the full procurement record and BAC recommendation to HOPE. Next status: AWARD_FOR_HOPE_APPROVAL. Next task owner: HOPE.
Phase 8: Award (Notice of Award)

HOPE: Reviews the BAC recommendation and either approves it or returns it on lawful and documented grounds. Next status: NOA_ISSUED or AWARD_RETURNED. Next task owner: Vendor or BAC.
HOPE: Issues and signs the Notice of Award once the recommendation is approved. Next status: NOA_ISSUED. Next task owner: Vendor.
Vendor: Acknowledges the award and submits the required performance security within the prescribed period. Next status: PERFORMANCE_SECURITY_SUBMITTED or AWARD_DEFAULT. Next task owner: Procurement Officer / BAC Secretariat.
Phase 9: Contract and Implementation

Procurement Officer or BAC Secretariat: Verifies the performance security and prepares the contract package. Next status: CONTRACT_PENDING_SIGNATURE. Next task owner: Vendor and HOPE.
Vendor and HOPE: Sign the contract. This is the point at which the contract is perfected. Next status: CONTRACT_SIGNED. Next task owner: Procurement Officer / Unit.
Procurement Officer / Unit: Creates the Purchase Order for goods procurement based on the awarded line items and approved contract terms. This is the correct stage for PO creation because the supplier, quantities, and prices are already fixed. The PO becomes one of the core payment-control documents. Next status: PO_CREATED. Next task owner: HOPE or authorized signatory under LGU rules, then Vendor.
HOPE: Issues and signs the Notice to Proceed after contract approval. Next status: NTP_ISSUED. Next task owner: Vendor.
Vendor: Starts delivery or implementation in accordance with the contract, PO, and NTP. Next status: CONTRACT_ACTIVE. Next task owner: Department Requester, Procurement Officer, and IAC for monitoring.
Note: For works or consulting, the contract or job order serves as the equivalent control document. If your capstone is goods-focused, keep the PO mandatory because it is essential to three-way matching.

Phase 10: Delivery, Inspection, and Acceptance

Vendor: Delivers goods or completes the service milestone and submits delivery documents. Next status: DELIVERY_RECEIVED. Next task owner: Department Requester and IAC.
Department Requester: Confirms that delivery reached the end-user unit and records operational observations, but does not perform final acceptance alone. Next status: INSPECTION_PENDING. Next task owner: IAC.
IAC: Conducts formal inspection against the PO, contract, and technical specifications, records accepted and rejected quantities, and generates and signs the IAR. This is the official acceptance step. Next status: IAR_COMPLETED, DELIVERY_ACCEPTED, or DELIVERY_REJECTED. Next task owner: Procurement Officer / Unit or Vendor if correction is needed.
Procurement Officer / Unit: If accepted, completes receiving records and forwards the PO, IAR, and delivery documents to Finance for payment processing. Next status: PAYMENT_VERIFICATION_PENDING or PAYMENT_PENDING_INVOICE. Next task owner: Finance Officer or Vendor if invoice is still missing.
Phase 11: Payment Processing

Vendor: Submits the invoice or billing statement linked to the accepted delivery and PO. Next status: INVOICE_SUBMITTED. Next task owner: Finance Officer.
Finance Officer: Performs three-way matching using PO versus Invoice versus IAR and checks taxes, deductions, and supporting records. Next status: PAYMENT_VERIFICATION_IN_PROGRESS, PAYMENT_HOLD, or PAYMENT_APPROVED. Next task owner: Finance Officer or the responsible office for correction.
Finance Officer: Prepares the disbursement and records the payment decision under the LGU’s finance controls. Next status: PAYMENT_APPROVED. Next task owner: Finance release.
Finance Officer: Releases payment and records the completed disbursement in the system. Next status: PAYMENT_COMPLETED. Next task owner: End of workflow.
3. Status Flow Design

Planning and APP

APP_DRAFT: Department input is still being prepared. Moves to APP_PENDING_DEPT_HEAD when submitted.
APP_PENDING_DEPT_HEAD: Waiting for department endorsement. Moves to APP_PENDING_BUDGET_CERT or APP_RETURNED.
APP_PENDING_BUDGET_CERT: Waiting for budget certification. Moves to APP_PENDING_PROCUREMENT_CONSOLIDATION or APP_RETURNED.
APP_PENDING_PROCUREMENT_CONSOLIDATION: Waiting for consolidation into the municipal APP. Moves to APP_PENDING_HOPE_APPROVAL.
APP_PENDING_HOPE_APPROVAL: Waiting for HOPE final approval. Moves to APP_APPROVED or APP_RETURNED.
APP_APPROVED: Approved and locked; valid source for PR creation.
APP_RETURNED: Sent back for correction.
Requisition and planning

PR_DRAFT: PR is being prepared by the requesting unit. Moves to PR_PENDING_DEPT_HEAD.
PR_PENDING_DEPT_HEAD: Waiting for department endorsement. Moves to PR_PENDING_BUDGET_CERT or PR_RETURNED.
PR_PENDING_BUDGET_CERT: Waiting for fund certification. Moves to PR_PENDING_HOPE_APPROVAL or PR_PENDING_PROCUREMENT_REVIEW.
PR_PENDING_HOPE_APPROVAL: Waiting for HOPE, if routed by rule. Moves to PR_PENDING_PROCUREMENT_REVIEW or PR_RETURNED.
PR_PENDING_PROCUREMENT_REVIEW: Waiting for procurement completeness check. Moves to PR_APPROVED or PR_RETURNED.
PR_APPROVED: Accepted for procurement action.
PR_RETURNED: Sent back for correction.
PROCUREMENT_PLANNING_IN_PROGRESS: Procurement strategy and schedule are being prepared.
BIDDING_DOCS_DRAFT: Specs, criteria, and bid documents are being finalized.
MODE_RECOMMENDED: BAC has recommended procurement mode or alternative modality.
MODE_APPROVED: Alternative modality, if any, has been approved.
Competitive bidding

ITB_DRAFT: Draft invitation is being prepared.
ITB_APPROVED: BAC has approved release of ITB and bidding documents.
ITB_POSTED: Official posting has been completed.
PRE_BID_COMPLETED: Pre-bid conference and bid bulletins, if any, have been closed.
BID_SUBMISSION_OPEN: Suppliers may submit bids.
BID_SUBMISSION_CLOSED: Deadline passed; no further bid submissions allowed.
BID_OPENING_IN_PROGRESS: BAC is conducting the opening session.
BIDS_OPENED: Bids have been publicly opened.
ABSTRACT_AS_READ_FINALIZED: Opening minutes and abstract have been locked.
EVALUATION_PENDING: Procurement is queued for evaluation.
EVALUATION_IN_PROGRESS: Detailed bid evaluation is ongoing.
LCB_DECLARED: Lowest Calculated Bid identified for goods or works.
HRB_DECLARED: Highest Rated Bid identified for consulting.
EVALUATION_COMPLETED: BAC evaluation action has been completed.
Post-qualification and award

POSTQUAL_PENDING: Leading bidder is awaiting post-qualification.
POSTQUAL_IN_PROGRESS: TWG verification is ongoing.
POSTQUAL_REPORTED: TWG has submitted findings to BAC.
LCRB_DECLARED: BAC has recommended award to the Lowest Calculated and Responsive Bid.
POSTQUAL_FAILED: Leading bidder failed post-qualification; route to next ranked bidder.
FAILURE_OF_BIDDING: Procurement failed and must be rebid or shifted to a lawful alternative method.
AWARD_FOR_HOPE_APPROVAL: Waiting for HOPE action on BAC recommendation.
NOA_ISSUED: Notice of Award has been issued.
AWARD_RETURNED: HOPE returned the recommendation for lawful correction or clarification.
PERFORMANCE_SECURITY_SUBMITTED: Winning bidder complied with performance security.
AWARD_DEFAULT: Winning bidder failed to comply after award.
Contract, delivery, and payment

CONTRACT_PENDING_SIGNATURE: Contract package is ready for signing.
CONTRACT_SIGNED: Contract is perfected.
PO_CREATED: Purchase Order has been generated for goods procurement.
NTP_ISSUED: Notice to Proceed has been issued.
CONTRACT_ACTIVE: Supplier is now in implementation or delivery stage.
DELIVERY_RECEIVED: Goods or service output has arrived.
INSPECTION_PENDING: Waiting for formal IAC inspection.
IAR_COMPLETED: IAC has finalized the Inspection and Acceptance Report.
DELIVERY_ACCEPTED: Delivery passed inspection and is accepted.
DELIVERY_REJECTED: Delivery failed inspection and must be corrected or replaced.
INVOICE_SUBMITTED: Supplier billing has been received.
PAYMENT_VERIFICATION_PENDING: Supporting records are waiting for finance review.
PAYMENT_VERIFICATION_IN_PROGRESS: Finance is doing three-way matching.
PAYMENT_HOLD: A discrepancy or missing document blocks payment.
PAYMENT_APPROVED: Finance cleared the payment package.
PAYMENT_COMPLETED: Payment has been released and recorded.
4. Blockchain Integration

Use blockchain as an immutable notarization and verification layer, not as the main workflow engine. The application database should still manage statuses, queues, user permissions, and document storage.

Practical design:

Every controlled document version is hashed using SHA-256 at the time of submission, approval, or finalization.
The PDF or file stays off-chain in the main system storage.
The chain stores only compact evidence: procurement ID, event type, document hash, actor role, timestamp, and transaction reference.
Any later file retrieval recomputes the SHA-256 hash and compares it to the recorded hash. A mismatch means the document was altered or replaced after anchoring.
Only major milestone events should be anchored on-chain; do not send every click or minor edit to blockchain.
Major events that should be anchored:

APP approval: Hash the final approved APP snapshot and HOPE approval metadata.
PR approval: Hash the approved PR plus budget certification and any HOPE approval if routed.
ITB posting: Hash the final ITB and posting proof package.
Bid opening: Hash the abstract of bids as read, attendance, quorum record, and minutes.
Evaluation results: Hash the BAC evaluation report and ranked bid results.
BAC Resolution: Hash the signed BAC Resolution recommending award or declaring failure.
NOA issuance: Hash the signed Notice of Award.
Contract signing: Hash the signed contract and, for goods, the released PO package.
IAR completion: Hash the IAR signed by the IAC.
Payment: Hash the payment record, including the matched PO, IAR, and invoice reference set.
Tamper detection logic:

If the current file hash does not match the anchored hash, the system marks the record as HASH_MISMATCH.
Downstream approvals should be blocked for critical documents until the discrepancy is resolved.
Internal Auditor and System Administrator should receive an exception alert.
Observers can see the exception but cannot resolve it.
Fit to your current capstone blockchain layer:

ProcurementRegistry already matches the idea of anchoring milestone events, but it should be extended so the event set includes APP_APPROVED, PR_APPROVED, EVALUATION_COMPLETED, BAC_RESOLUTION_FINALIZED, and IAR_COMPLETED.
BidManager is suitable for sealed bid commitment and controlled bid reveal, which is useful for a web-based bidding prototype.
PaymentTracker is suitable for contract registration and payment milestone recording after award.
5. System Design Insight

RBAC

Every role must have a dedicated dashboard and server-side authorization policy.
Approval buttons must be checked both in the UI and in the backend against role, current status, office scope, and assignment.
System Administrator should exist only as a technical support role and must not be allowed to impersonate procurement approvals.
Approval routing logic

Routing should be status-driven, not page-driven.
The next approver depends on role, procurement mode, amount thresholds, and segregation rules.
Competitive bidding must always follow BAC recommendation before HOPE award action.
Alternative modalities should require a stored justification and HOPE approval whenever current rules require it.
Separation of duties

The same user should not originate and endorse the same PR.
BAC and TWG may evaluate and recommend, but never release payment.
IAC may accept or reject delivery, but never award the contract.
Finance may release payment, but never alter supplier ranking or BAC findings.
Observers and Internal Auditor remain read-only.
Key validations

No PR without an approved APP link.
PR total must not exceed remaining APP allocation.
Budget certification must exist before BAC procurement action.
Posting and submission dates must comply with prescribed timelines.
BAC quorum should be computed from active voting members, not hard-coded.
Only compliant and non-blacklisted vendors can proceed.
No award without completed BAC recommendation.
No delivery acceptance without IAC-generated IAR.
No payment without successful three-way match of PO, Invoice, and IAR.
Audit trail design

Store full operational logs in the main database: who acted, when, old status, new status, remarks, IP, and device context.
Store immutable evidence of critical milestones on blockchain.
Record version history for every document, not just the latest file.
Preserve returned, rejected, and superseded records instead of overwriting them.
6. Optional but Strong Flows

Small Value Procurement

Do not hard-code a threshold in the thesis narrative or system logic. Make the threshold configurable based on current GPPB issuances.
After PR approval, Procurement Officer or BAC Secretariat prepares the RFQ and identifies qualified suppliers.
BAC validates the RFQ package and justification for the alternative modality.
Secretariat sends the RFQ to the required number of suppliers under current rules and records proof of invitation.
Vendors submit quotations.
BAC and TWG evaluate responsiveness and price.
BAC recommends award to HOPE.
HOPE approves award, then the flow continues to NOA, contract or PO, delivery, IAC inspection, and payment.
Failure of Bidding

Failure of bidding may be declared if no bids are received, all bids are non-responsive, all bidders fail post-qualification, all bids exceed the ABC when the rules require rejection, or the process otherwise collapses under lawful grounds.
One compliant bid alone is not automatic failure of bidding.
BAC issues a BAC Resolution declaring failure of bidding and routes it to HOPE.
The system then opens either a rebidding workflow or an approved alternative modality workflow.
Re-award Process

If the winning bidder fails to submit performance security, refuses to sign the contract, or otherwise defaults after NOA, the system marks the case as AWARD_DEFAULT.
BAC issues a resolution recording the default and recommending award to the next ranked responsive bidder if still allowed by the procurement rules and bid validity.
HOPE approves the re-award and issues a new NOA.
If re-award is no longer lawful or practical, the system routes the case to rebidding or failure-of-bidding handling.