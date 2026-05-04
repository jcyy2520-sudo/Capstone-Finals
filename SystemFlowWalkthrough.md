# ProcureSeal System Flow Walkthrough

Last updated: 2026-05-01

## 1. Walkthrough Purpose

This walkthrough describes the corrected end-to-end procurement flow for the ProcureSeal capstone. It is written as an operational narrative that can be used for documentation, testing, and capstone defense.

This version corrects the earlier issues in the workflow:

- BAC recommends award; HOPE performs final award approval.
- The IAC generates and signs the IAR.
- The PO is created after award and contract perfection, before delivery and payment.
- Observers are read-only and never approve anything.
- One responsive bid is not automatic failure of bidding.

## 2. Workflow Actors

The procurement flow uses the following operational actors:

1. Department Requester / End-User
2. Department Head
3. Budget Officer
4. Procurement Officer / Procurement Unit
5. BAC Chairperson
6. BAC Members
7. BAC Secretariat
8. TWG
9. HOPE
10. Vendor / Supplier
11. Inspection and Acceptance Committee (IAC)
12. Finance Officer
13. Internal Auditor
14. COA / GPPB Observer

Implementation note: if the demo retains a smaller authentication model, the system must still enforce these authorities through assignment rules and action-level permissions. Department Requester, Department Head, BAC, HOPE, IAC, and Finance must remain separate control points.

## 3. End-to-End Competitive Bidding Walkthrough

### Phase 1: Annual Procurement Plan (APP)

Step 1 - Department Requester

The Department Requester encodes the APP requirement based on departmental planning input. The record includes the project title, description, ABC, quarter, fund source reference, justification, and preliminary specifications.

Status after this step: APP_PENDING_DEPT_HEAD
Next task owner: Department Head

Step 2 - Department Head

The Department Head reviews the requirement for necessity, completeness, and priority. If the record is incomplete, it is returned with remarks. If acceptable, it is endorsed.

Status after this step: APP_PENDING_BUDGET_CERT or APP_RETURNED
Next task owner: Budget Officer or Department Requester

Step 3 - Budget Officer

The Budget Officer certifies the funding source and confirms the requirement fits within the budget ceiling.

Status after this step: APP_PENDING_PROCUREMENT_CONSOLIDATION
Next task owner: Procurement Officer / BAC Secretariat

Step 4 - Procurement Officer / BAC Secretariat

The endorsed APP entry is consolidated into the LGU APP together with other approved departmental entries.

Status after this step: APP_PENDING_HOPE_APPROVAL
Next task owner: HOPE

Step 5 - HOPE

HOPE reviews the consolidated APP and approves or returns it. Once approved, the APP entry becomes the official planning source for later requisitions.

Status after this step: APP_APPROVED or APP_RETURNED
Next task owner: Department Requesters
Blockchain checkpoint: APP_APPROVED

Rule: no PR can be processed unless it is linked to an APP item with status APP_APPROVED.

### Phase 2: Purchase Requisition (PR)

Step 6 - Department Requester

The Department Requester creates a PR linked to an approved APP item. The PR contains the requested items, estimated quantities, estimated unit cost, purpose, required date, and technical specifications.

Status after this step: PR_PENDING_DEPT_HEAD
Next task owner: Department Head

Step 7 - Department Head

The Department Head endorses the PR if it is valid and necessary, or returns it with remarks if correction is needed.

Status after this step: PR_PENDING_BUDGET_CERT or PR_RETURNED
Next task owner: Budget Officer or Department Requester

Step 8 - Budget Officer

The Budget Officer certifies fund availability and records a budget reservation marker.

Status after this step: PR_PENDING_HOPE_APPROVAL or PR_PENDING_PROCUREMENT_REVIEW
Next task owner: HOPE or Procurement Officer / BAC Secretariat

Step 9 - HOPE, if routed by rule

If the PR falls under a value threshold or policy rule that requires executive approval, HOPE approves or returns it.

Status after this step: PR_PENDING_PROCUREMENT_REVIEW or PR_RETURNED
Next task owner: Procurement Officer / BAC Secretariat or Department Requester

Step 10 - Procurement Officer / BAC Secretariat

The PR is reviewed for completeness, APP linkage, and readiness for procurement processing.

Status after this step: PR_APPROVED
Next task owner: BAC Secretariat / TWG
Blockchain checkpoint: PR_APPROVED

### Phase 3: Procurement Planning and Mode Selection

Step 11 - Procurement Officer / BAC Secretariat

The procurement docket is opened, a reference number is assigned, and the procurement strategy is prepared.

Status after this step: PROCUREMENT_PLANNING_IN_PROGRESS
Next task owner: TWG

Step 12 - TWG

The TWG refines the technical specifications, scope, schedule, and evaluation requirements.

Status after this step: BIDDING_DOCS_DRAFT
Next task owner: BAC

Step 13 - BAC Chairperson and BAC Members

BAC reviews the proposed mode of procurement and the draft procurement documents. Competitive bidding remains the default route. If an alternative modality is proposed, BAC records the justification and routes it for required approval.

Status after this step: MODE_RECOMMENDED or BIDDING_DOCS_FOR_RELEASE
Next task owner: HOPE or BAC Secretariat

Step 14 - HOPE, if required for alternative modality

HOPE approves or returns the proposed alternative mode with a written justification record.

Status after this step: MODE_APPROVED
Next task owner: BAC Secretariat

### Phase 4: Invitation to Bid and Advertisement

Step 15 - BAC Secretariat

The BAC Secretariat prepares the ITB, bidding schedule, and posting package using the approved PR and final bidding documents.

Status after this step: ITB_DRAFT
Next task owner: BAC

Step 16 - BAC Chairperson and BAC Members

BAC approves release of the ITB and the final bidding documents.

Status after this step: ITB_APPROVED
Next task owner: BAC Secretariat

Step 17 - BAC Secretariat

The ITB is posted through the required publication and posting channels. The system records the posting references and dates.

Status after this step: ITB_POSTED
Next task owner: Vendors
Blockchain checkpoint: ITB_POSTED

Step 18 - BAC Secretariat, BAC, and Observers

If required, the pre-bid conference is conducted. Clarifications and supplemental bid bulletins are recorded.

Status after this step: PRE_BID_COMPLETED or BID_SUBMISSION_OPEN
Next task owner: Vendors

Step 19 - Vendors

Interested suppliers submit bids before the deadline. The system records timestamps and document hashes.

Status after this step: BID_SUBMISSION_CLOSED
Next task owner: BAC

### Phase 5: Bid Opening

Step 20 - BAC Secretariat

The bid opening session is opened in the system. Attendance is recorded and quorum is checked using configured BAC voting membership.

Status after this step: BID_OPENING_IN_PROGRESS
Next task owner: BAC Chairperson and BAC Members

Step 21 - BAC Chairperson and BAC Members

BAC opens the bids at the prescribed time and reads the required bid information into the record. Observers are recorded as attendees only.

Status after this step: BIDS_OPENED
Next task owner: BAC and TWG

Step 22 - BAC Secretariat

The Secretariat generates the Abstract of Bids as Read and the bid opening minutes, then locks the opening record.

Status after this step: ABSTRACT_AS_READ_FINALIZED
Next task owner: BAC and TWG
Blockchain checkpoint: BID_OPENING_COMPLETED

Step 23 - BAC Chairperson

The opening session is closed and the procurement is routed to evaluation.

Status after this step: EVALUATION_PENDING
Next task owner: TWG and BAC Members

Rule: one responsive bid is not automatic failure of bidding. If the lone bid is compliant and within the ABC, the process can continue.

### Phase 6: Evaluation

Step 24 - TWG and designated BAC evaluators

The bids are evaluated for technical compliance, arithmetic accuracy, and financial responsiveness.

Status after this step: EVALUATION_IN_PROGRESS
Next task owner: BAC

Step 25 - System and BAC evaluators

The system ranks the compliant bids. For goods and works, the leading bid is tagged as the Lowest Calculated Bid.

Status after this step: LCB_DECLARED or HRB_DECLARED
Next task owner: BAC

Step 26 - BAC Chairperson and BAC Members

BAC deliberates on the evaluation report and adopts the evaluation result as a BAC action.

Status after this step: EVALUATION_COMPLETED
Next task owner: BAC Secretariat
Blockchain checkpoint: EVALUATION_COMPLETED

Step 27 - BAC Secretariat

The leading bidder is notified and the procurement is scheduled for post-qualification.

Status after this step: POSTQUAL_PENDING
Next task owner: Vendor and TWG

### Phase 7: Post-Qualification

Step 28 - Leading Vendor

The leading bidder submits updated post-qualification documents and makes itself available for verification.

Status after this step: POSTQUAL_IN_PROGRESS
Next task owner: TWG

Step 29 - TWG

The TWG verifies the bidder's legal, technical, and financial compliance and prepares the post-qualification report.

Status after this step: POSTQUAL_REPORTED
Next task owner: BAC

Step 30 - BAC Chairperson and BAC Members

BAC deliberates on the TWG findings and adopts a BAC Resolution recommending award to the Lowest Calculated and Responsive Bid, or disqualifying the bidder and moving to the next ranked bidder.

Status after this step: LCRB_DECLARED, POSTQUAL_FAILED, or FAILURE_OF_BIDDING
Next task owner: HOPE or BAC Secretariat
Blockchain checkpoint: BAC_RESOLUTION_FINALIZED

Step 31 - BAC Secretariat

The complete procurement package and BAC recommendation are routed to HOPE.

Status after this step: AWARD_FOR_HOPE_APPROVAL
Next task owner: HOPE

### Phase 8: Award

Step 32 - HOPE

HOPE reviews the BAC recommendation and either approves it or returns it on lawful documented grounds.

Status after this step: NOA_ISSUED or AWARD_RETURNED
Next task owner: Vendor or BAC

Step 33 - HOPE

Once the recommendation is approved, HOPE signs and issues the NOA.

Status after this step: NOA_ISSUED
Next task owner: Vendor
Blockchain checkpoint: NOA_ISSUED

Step 34 - Vendor

The winning bidder acknowledges the award and submits the required performance security within the prescribed period.

Status after this step: PERFORMANCE_SECURITY_SUBMITTED or AWARD_DEFAULT
Next task owner: Procurement Officer / BAC Secretariat

### Phase 9: Contract and Implementation

Step 35 - Procurement Officer / BAC Secretariat

The performance security is verified and the contract package is prepared.

Status after this step: CONTRACT_PENDING_SIGNATURE
Next task owner: Vendor and HOPE

Step 36 - Vendor and HOPE

The contract is signed. This is the point at which the contract is perfected.

Status after this step: CONTRACT_SIGNED
Next task owner: Procurement Officer / Unit
Blockchain checkpoint: CONTRACT_SIGNED

Step 37 - Procurement Officer / Unit

For goods procurement, the PO is created based on the approved award and contract terms. This document becomes part of later payment controls.

Status after this step: PO_CREATED
Next task owner: HOPE or authorized signatory, then Vendor

Step 38 - HOPE

The NTP is issued after contract approval.

Status after this step: NTP_ISSUED
Next task owner: Vendor

Step 39 - Vendor

Delivery or implementation starts under the contract, PO, and NTP.

Status after this step: CONTRACT_ACTIVE
Next task owner: Department Requester, Procurement Officer, and IAC

### Phase 10: Delivery, Inspection, and Acceptance

Step 40 - Vendor

The supplier delivers the goods or completes the service milestone and submits delivery records.

Status after this step: DELIVERY_RECEIVED
Next task owner: Department Requester and IAC

Step 41 - Department Requester

The end-user confirms operational receipt only. This is not the final acceptance step.

Status after this step: INSPECTION_PENDING
Next task owner: IAC

Step 42 - IAC

The IAC inspects the delivery against the PO, contract, and technical specifications. If compliant, the IAC prepares and signs the IAR. If not compliant, the delivery is rejected or partially accepted.

Status after this step: IAR_COMPLETED, DELIVERY_ACCEPTED, or DELIVERY_REJECTED
Next task owner: Procurement Officer / Unit or Vendor
Blockchain checkpoint: IAR_COMPLETED

Step 43 - Procurement Officer / Unit

Accepted delivery records are completed and forwarded to Finance together with the PO and IAR.

Status after this step: PAYMENT_VERIFICATION_PENDING or PAYMENT_PENDING_INVOICE
Next task owner: Finance Officer or Vendor

### Phase 11: Payment Processing

Step 44 - Vendor

The supplier submits the invoice or billing statement linked to the accepted delivery and PO.

Status after this step: INVOICE_SUBMITTED
Next task owner: Finance Officer

Step 45 - Finance Officer

Finance performs three-way matching using PO versus invoice versus IAR, then checks deductions, penalties, and completeness of support records.

Status after this step: PAYMENT_VERIFICATION_IN_PROGRESS, PAYMENT_HOLD, or PAYMENT_APPROVED
Next task owner: Finance Officer or responsible office

Step 46 - Finance Officer

Once the billing package is valid, Finance prepares the disbursement and records the payment decision.

Status after this step: PAYMENT_APPROVED
Next task owner: Finance release

Step 47 - Finance Officer

Payment is released and recorded as completed.

Status after this step: PAYMENT_COMPLETED
Next task owner: End of workflow
Blockchain checkpoint: PAYMENT_RECORDED

## 4. Alternate Flow: Small Value Procurement (SVP)

SVP should remain configuration-driven based on current procurement rules rather than fixed to a hard-coded threshold.

Step 1 - Procurement Officer / BAC Secretariat

The RFQ package is prepared and qualified suppliers are identified.

Status after this step: RFQ_DRAFT
Next task owner: BAC

Step 2 - BAC

BAC reviews the RFQ package and records the reason for using the alternative modality.

Status after this step: RFQ_FOR_RELEASE
Next task owner: BAC Secretariat

Step 3 - BAC Secretariat

The RFQ is sent to the required number of qualified suppliers and proof of invitation is recorded.

Status after this step: RFQ_SENT
Next task owner: Vendors

Step 4 - Vendors

Suppliers submit quotations within the deadline.

Status after this step: QUOTATIONS_RECEIVED
Next task owner: BAC and TWG

Step 5 - BAC and TWG

Quotations are evaluated for responsiveness and price. The abstract of quotations is prepared.

Status after this step: ABSTRACT_OF_QUOTATIONS_FINALIZED
Next task owner: HOPE

Step 6 - HOPE

HOPE approves the award. The flow then continues through NOA, contract or PO, delivery, IAC inspection, and payment.

Status after this step: NOA_ISSUED or AWARD_RETURNED
Next task owner: Vendor or BAC

## 5. Exception Flows

### Failure of Bidding

Failure of bidding may be declared if:

- no bids are received
- all bids are non-responsive
- all bidders fail post-qualification
- other lawful grounds are met under policy

Required handling:

- BAC issues a BAC Resolution declaring failure of bidding.
- HOPE is notified or asked to act as required by policy.
- The procurement is routed to rebidding or to a lawful alternative modality workflow.

### Re-Award

If the winning bidder defaults after the NOA by failing to submit performance security or refusing to sign the contract:

- the system records AWARD_DEFAULT
- BAC records the default through a new resolution
- the procurement may be routed to the next ranked responsive bidder if still lawful
- otherwise the procurement returns to rebidding or failure-of-bidding handling

## 6. Oversight and Audit Access

- Internal Auditor has read-only access to full procurement records, workflow history, document versions, and exception flags.
- COA / GPPB Observer has read-only access to procurement records and can be listed as an observer in BAC proceedings.
- Neither oversight role can create, edit, vote on, or approve procurement transactions.

## 7. Blockchain Checkpoints Summary

The practical blockchain checkpoints for the capstone are:

1. APP_APPROVED
2. PR_APPROVED
3. ITB_POSTED
4. BID_OPENING_COMPLETED
5. EVALUATION_COMPLETED
6. BAC_RESOLUTION_FINALIZED
7. NOA_ISSUED
8. CONTRACT_SIGNED
9. IAR_COMPLETED
10. PAYMENT_RECORDED

The application stores the actual files off-chain and records SHA-256 hashes on-chain for tamper detection and independent verification.