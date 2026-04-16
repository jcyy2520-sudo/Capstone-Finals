ProcureSeal System Flow Walkthrough

This document describes the full system flow from start to finish, including all user accounts involved at each step. Written in plain text for easy reading and testing.


ACCOUNTS IN THE SYSTEM

All seeded accounts use the same default password: ProcureSeal@2025

1. System Administrator
   Name: System Administrator
   Email: admin@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: system_admin
   Dashboard path: /admin
   Department: Information Technology Office
   Designation: MIS Head
   Purpose: Manages all users, creates accounts for all roles, monitors blockchain audit logs, system configuration.

2. HOPE (Head of Procuring Entity / Mayor)
   Name: Hon. Juan Dela Cruz
   Email: hope@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: hope
   Dashboard path: /hope
   Department: Office of the Mayor
   Designation: Municipal Mayor
   Purpose: Final approving authority for almost all major procurement decisions.

3. BAC Chairperson
   Name: Pedro Reyes
   Email: bacchair@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: bac_chairperson
   Dashboard path: /chairperson
   Department: General Services Office
   Designation: BAC Chairperson
   Purpose: Leads the Bids and Awards Committee, signs off on ITBs, evaluation reports, and BAC resolutions.

4. BAC Members (minimum 3 for quorum)
   Member 1
     Name: Ana Lopez
     Email: bac1@procureseal.gov.ph
     Password: ProcureSeal@2025
   Member 2
     Name: Jose Garcia
     Email: bac2@procureseal.gov.ph
     Password: ProcureSeal@2025
   Member 3
     Name: Elena Cruz
     Email: bac3@procureseal.gov.ph
     Password: ProcureSeal@2025
   Role: bac_member
   Dashboard path: /bac-member
   Designation: BAC Member
   Purpose: Performs technical and financial bid evaluation, confirms attendance for bid opening quorum.

5. BAC Secretariat
   Name: Maria Santos
   Email: secretariat@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: bac_secretariat
   Dashboard path: /secretariat
   Department: General Services Office
   Designation: BAC Secretariat Head
   Purpose: Administrative backbone of procurement. Creates ITBs, RFQs, manages vendor accounts, facilitates bid opening sessions, routes documents.

6. TWG Member (Technical Working Group)
   Name: Lorna Bautista
   Email: twg@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: twg_member
   Dashboard path: /twg
   Department: Municipal Engineering Office
   Designation: TWG Member - Engineering
   Purpose: Performs post-qualification evaluation, reviews technical compliance, recommends pass or fail to BAC.

7. Department Requester
   Name: Roberto Aquino
   Email: requester@procureseal.gov.phz
   Password: ProcureSeal@2025
   Role: department_requester
   Dashboard path: /requester
   Department: Municipal Health Office
   Designation: Department Head - MHO
   Purpose: Creates Annual Procurement Plan entries and Purchase Requisitions for their department.

8. Budget Officer
   Name: Ricardo Mendoza
   Email: budget@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: budget_officer
   Dashboard path: /budget
   Department: Municipal Budget Office
   Designation: Municipal Budget Officer
   Purpose: Certifies fund availability for APP entries and Purchase Requisitions.

9. Finance Officer
   Name: Carmen Villanueva
   Email: finance@procureseal.gov.ph
   Password: ProcureSeal@2025
   Role: finance_officer
   Dashboard path: /finance
   Department: Municipal Treasurer Office
   Designation: Municipal Treasurer
   Purpose: Processes vendor invoices and performs three-way matching against PO and IAR before payment.

10. Vendor or Supplier
    Note: Vendor accounts are created by the BAC Secretariat. The vendor receives a temporary password and must change it on first login.
    Role: vendor
    Dashboard path: /vendor
    Purpose: Registers in the system, uploads eligibility documents, submits bids or quotations, acknowledges awards, submits invoices.

11. COA / GPPB Observer
    Name: Gloria Ramos
    Email: observer@procureseal.gov.ph
    Password: ProcureSeal@2025
    Role: observer
    Dashboard path: /observer
    Designation: COA Observer
    Purpose: Read-only access to procurement records for transparency and audit oversight.

12. Internal Auditor
    Name: Fernando Tan
    Email: auditor@procureseal.gov.ph
    Password: ProcureSeal@2025
    Role: internal_auditor
    Dashboard path: /auditor
    Designation: Internal Auditor
    Purpose: Reviews procurement records, compliance checks, and blockchain audit trail access.


HOW ACCOUNTS ARE CREATED

The System Administrator creates all internal accounts (roles 1 through 9, 11, and 12).
Vendor accounts are created specifically by the BAC Secretariat after physically evaluating the vendor offline.
No self-registration is allowed for any role.

When a new account is created, the user receives a temporary password.
On first login, the system forces a mandatory password change before any other action is allowed.


FULL SYSTEM FLOW: START TO END

The flow below follows Competitive Bidding with Small Value Procurement as an alternate path shown at the end. This is the most complete route.


PHASE 1: ANNUAL PROCUREMENT PLAN

Step 1 - Account used: Department Requester

The Department Requester logs in at /requester.
They navigate to the APP section and create a new APP entry.
They fill in the project title, description, budget amount (ABC), procurement category (Goods, Services, Works, or Consulting), target quarters, and justification.
The system recommends a procurement mode based on the ABC amount entered.
The Requester saves the entry as a draft. The system auto-saves every 2 minutes.
When ready, the Requester submits the entry.

Status after this step: APP_PENDING_CONSOLIDATION
A notification is sent to: BAC Secretariat

Step 2 - Account used: BAC Secretariat

The BAC Secretariat logs in at /secretariat.
They review the submitted APP entry for completeness.
If the entry is incomplete, the Secretariat returns it with remarks. Status becomes APP_RETURNED and the Requester is notified to fix it.
If the entry is complete, the Secretariat accepts it and consolidates it with other submissions.

Status after this step: APP_PENDING_BUDGET_CERT
A notification is sent to: Budget Officer

Step 3 - Account used: Budget Officer

The Budget Officer logs in at /budget.
They review the APP entry and confirm fund source, account code, and available amount.
They certify the entry.

Status after this step: APP_PENDING_HOPE_APPROVAL
A notification is sent to: HOPE

Step 4 - Account used: HOPE

HOPE logs in at /hope.
They review the full APP entry including budget certification.
HOPE approves or returns the entry.
If approved, the APP entry is locked and immutable.
It is published to the public transparency dashboard.
A blockchain record is created: APP_APPROVED.

Status after this step: APP_APPROVED (locked)

No Purchase Requisition can be created unless it is linked to an APP entry with status APP_APPROVED.


PHASE 2: PURCHASE REQUISITION

Step 5 - Account used: Department Requester

The Requester logs in and navigates to the PR section.
They create a new PR and link it to an approved APP entry.
They fill in line items with description, unit of measure, quantity, and estimated unit cost.
The system automatically computes the total cost.
The system shows the remaining ABC in real time. The PR total must not exceed this amount.
The Requester fills in the purpose, technical specifications, required date, and urgency level.
The Requester submits the PR.

Status after this step: PR_PENDING_DH_ENDORSEMENT
A notification is sent to: Department Head (this role acts through the Department Requester or a separate head account depending on setup)

Step 6 - Account used: Department Head (or senior Requester)

The Department Head endorses the PR.

Status after this step: PR_PENDING_BUDGET_CERT
A notification is sent to: Budget Officer

Step 7 - Account used: Budget Officer

The Budget Officer certifies the funds.
A soft budget reservation is created in the Budget Register.

Status after this step: PR_PENDING_SECRETARIAT_REVIEW
A notification is sent to: BAC Secretariat

Step 8 - Account used: BAC Secretariat

The BAC Secretariat reviews the PR and confirms it aligns with the approved APP entry.
The Secretariat assigns a procurement mode. The system suggests one based on ABC but the Secretariat can select an alternative mode with justification.
If an alternative mode is selected, a HOPE approval task is created before the process can continue.
Once mode is assigned and approved if required, the PR is accepted.

Status after this step: PR_ACCEPTED
A blockchain record is created: PR_ACCEPTED
The PR cannot be modified after this point.


PHASE 3: VENDOR ACCOUNT CREATION (done by BAC Secretariat before or during advertisement phase)

Step 9 - Account used: BAC Secretariat

The Secretariat navigates to vendor management.
They enter the vendor's business name, business type, DTI/SEC/CDA number, PhilGEPS number, TIN, address, contact person, email, and procurement categories.
The system automatically checks the GPPB blacklist by business name and TIN. If a match is found, the account is flagged as BLACKLISTED and blocked.
If no blacklist match, the account is created with status ACTIVE.
The system generates a username and a temporary password.
The Secretariat physically hands or sends the credentials to the vendor.

Step 10 - Account used: Vendor

The Vendor logs in at /vendor with their temporary credentials.
The system detects the temporary password flag and shows the mandatory password change screen.
The Vendor sets a new password and then lands on the Vendor Dashboard.

Step 11 - Account used: Vendor

The Vendor navigates to document management.
They upload all required eligibility documents: DTI or SEC or CDA registration, Mayor's Permit, Tax Clearance, PhilGEPS Certificate, Audited Financial Statements, and others based on procurement category.
Each uploaded file must be PDF and not larger than 25 MB.
The system computes a SHA-256 hash per file at the time of upload.
A blockchain record is created per file: VENDOR_DOCUMENT_UPLOADED.

Step 12 - Account used: BAC Secretariat

The Secretariat pre-screens each uploaded document.
For each document they mark it as Complete, Incomplete, Expired, or Defective.
If not Complete, a remark is required.
The Secretariat can click Hash Verification to check if the current file hash matches the blockchain-recorded hash. A mismatch triggers a critical alert to the BAC Chairperson and System Administrator.
The Secretariat records an overall pre-screening result.
A blockchain record is created: PRESCREENING_COMPLETED.

Note: Pre-screening is advisory only. Formal eligibility is determined on bid opening day when the vendor presents original physical documents.


PHASE 4: INVITATION TO BID (Competitive Bidding Path)

Step 13 - Account used: BAC Secretariat

The Secretariat creates a new Invitation to Bid linked to the accepted PR.
The system auto-fills procurement details from the PR.
The Secretariat enters: bid document cost, eligibility check date, pre-bid conference date (mandatory if ABC is 1,000,000 or more), bid submission deadline, bid opening date and time, venue, contact person.
The system enforces minimum advertisement periods based on category and amount.
The system blocks non-working days and Philippine public holidays from being selected as required dates.

Status after this step: ITB_DRAFT

Step 14 - Account used: BAC Secretariat

The Secretariat submits the ITB for Chairperson approval.

Status after this step: ITB_PENDING_CHAIRPERSON_APPROVAL
A notification is sent to: BAC Chairperson

Step 15 - Account used: BAC Chairperson

The BAC Chairperson logs in at /chairperson.
They review the ITB and approve it.

Status after this step: ITB_APPROVED
A blockchain record is created: ITB_APPROVED

Step 16 - Account used: BAC Secretariat

The Secretariat posts the ITB to three required channels.
Channel 1: PhilGEPS (Secretariat enters the PhilGEPS reference number after manually posting on the PhilGEPS website).
Channel 2: LGU Public Portal (system auto-generates a public announcement page).
Channel 3: Physical Bulletin Board (system generates a printable PDF for posting).
All three channels must be confirmed before the status changes.

Status after this step: ITB_POSTED
A blockchain record is created: ITB_POSTED
All registered vendors in the matching procurement category receive a notification.
The advertisement countdown timer begins.

Step 17 - System automated action

The system locks bid submissions until the minimum advertisement period fully elapses.
Vendors receive reminders 3 days and 1 day before the submission deadline.
Once the period elapses, status changes to ITB_OPEN_FOR_BIDS automatically.

Step 18 - Account used: Vendor

Vendors who choose to bid submit their bid documents via the Vendor Portal before the submission deadline.
Physical sealed envelopes with financial bids are submitted in person on bid opening day.


PHASE 5: BID OPENING SESSION

Step 19 - Account used: BAC Secretariat, BAC Members, BAC Chairperson, Observers

The BAC Secretariat opens the Bid Opening Session in the system.
Before the session can start, each BAC Member must click Confirm Attendance individually.
The system requires a minimum of 3 BAC Members to confirm for quorum.
The Start button remains disabled until quorum is reached.
Observers such as COA and GPPB are recorded by name.
Bidder attendance is recorded as Present or Absent.
A blockchain record is created: BID_OPENING_SESSION_STARTED.

Step 20 - Account used: BAC Secretariat

The Secretariat performs the Eligibility Check using submitted physical documents from each present bidder.
For each bidder and for each required document, the Secretariat marks Pass or Fail.
A Fail requires a specific reason to be entered.
Overall eligibility per bidder is computed as Pass only if all documents passed.
If only 1 or fewer bidders remain eligible, the system prompts to declare Failure of Bidding.

Step 21 - Account used: BAC Secretariat

For each eligible bidder, the Secretariat opens the physical sealed financial bid envelope.
The Secretariat enters the bid price as read from the envelope.
The system formats the amount in Philippine Pesos in real time.

Step 22 - Account used: BAC Secretariat

The system auto-generates the Abstract of Bids As Read from the entered prices.
The Secretariat previews the document and then closes the session.
All entries are locked after the session closes. No edits are possible.
The system generates the Session Minutes automatically.
A blockchain record is created: BID_OPENING_COMPLETED.


PHASE 6: BID EVALUATION

Step 23 - Account used: BAC Members and TWG Members

Each BAC evaluator logs in and performs Technical Evaluation for each eligible bidder.
Per technical specification item, the evaluator marks Compliant or Non-Compliant.
Non-Compliant requires specific remarks.
Overall assessment per bidder is Responsive or Non-Responsive.
The system tracks how many evaluators have completed evaluation out of the total required.

Step 24 - Account used: BAC Members

For each technically Responsive bidder, BAC Members perform Financial Evaluation.
They enter the Bid Price As Calculated and note any arithmetic corrections.
The system auto-ranks bidders in ascending order of Calculated Price for goods and works.
Manual ranking override is not allowed.
The system generates the Abstract of Bids As Calculated.

Step 25 - Account used: BAC Chairperson

The BAC Chairperson reviews the evaluation results.
The system identifies the Rank 1 bidder as the Lowest Calculated Bid.
The Chairperson signs the BAC Evaluation Report.
A blockchain record is created: EVALUATION_COMPLETED.

Status after this step: EVALUATION_APPROVED


PHASE 7: POST-QUALIFICATION

Step 26 - Account used: BAC Secretariat

The Secretariat issues the Post-Qualification Invitation to the Rank 1 bidder via the system.
The system records the sent timestamp. The legal 5-calendar-day window begins.
Deadline countdown badges are shown in the system.
Warning banners appear at Day 3 and Day 4.
A blockchain record is created: POST_QUAL_INVITATION_SENT.

Step 27 - Account used: Vendor (Rank 1 bidder)

The Vendor logs in and navigates to the post-qualification section.
They upload all required documents within the 5-calendar-day window.
Documents include updated registrations, permits, tax clearance, financial statements, NFCC computation, sworn statement, and others depending on category.
Each uploaded file hash is recorded on the blockchain.
The Vendor checks the Final Submission Attestation checkbox and submits.
After final submission, the upload interface switches to read-only mode.
Late uploads are automatically rejected and logged.
A blockchain record is created: POST_QUAL_DOCUMENTS_SUBMITTED.

Step 28 - Account used: TWG Member

The TWG Member logs in at /twg.
They evaluate the submitted documents in three categories: Legal Compliance, Technical Compliance, and Financial Capacity.
For each checklist item they mark Pass or Fail. Fail requires justification.
The system verifies each file hash against the blockchain record. A mismatch blocks the Pass recommendation and triggers a critical alert.
The TWG Member generates the Post-Qualification Report with an overall recommendation of Pass or Fail.
A blockchain record is created: POST_QUAL_EVALUATED.

Step 29 - Account used: BAC Chairperson

The BAC Chairperson reviews the TWG Report.
They generate a BAC Resolution using the built-in resolution generator.
The Resolution declares either LCRB (if TWG recommends Pass) or Failed Post-Qualification (if TWG recommends Fail).
Each BAC Member casts their vote: Approve, Disapprove, or Abstain.
Quorum of BAC signatures is required before the resolution is finalized.
The resolution is then locked. Corrections require a superseding resolution.
A blockchain record is created: BAC_RESOLUTION_LCRB_DECLARED or BAC_RESOLUTION_POSTQUAL_FAILED.

If the vendor fails: the system moves to Rank 2 and repeats Steps 26 to 29 for that vendor.
If all ranked bidders fail, Failure of Bidding is declared.

Step 30 - Account used: BAC Secretariat

The Secretariat routes the BAC Resolution to HOPE.
A notification is sent to: HOPE with the complete procurement record package.

Status after this step: PENDING_HOPE_APPROVAL


PHASE 8: AWARD

Step 31 - Account used: HOPE

HOPE logs in at /hope.
They review the complete procurement record: PR, ITB, Bid Opening results, Evaluation, Post-Qualification, and BAC Resolution.
HOPE approves or returns the resolution.
If returned, specific grounds are required and blockchain-recorded.
A blockchain record is created: HOPE_RESOLUTION_ACTION.

Step 32 - Account used: HOPE

HOPE clicks to generate the Notice of Award (NOA).
The NOA is auto-populated using the GPPB template with: winning bidder legal name and address, contract amount, performance security requirement, performance security deadline (10 calendar days from receipt), contract signing deadline (10 calendar days from receipt), and HOPE name and designation.
HOPE clicks Sign and Issue NOA. A confirmation dialog appears.
The NOA is issued.

Status after this step: NOA_ISSUED
A blockchain record is created: NOA_ISSUED.

Step 33 - Account used: Vendor (winning bidder)

The Vendor receives the NOA on their portal and via email.
The Vendor clicks Acknowledge Receipt within 3 calendar days.
The system tracks transmission timestamp and acknowledgment status.
At Day 2 with no acknowledgment, an alert goes to the Secretariat.
At Day 3 with no acknowledgment, an escalation goes to HOPE.
A blockchain record is created: NOA_ACKNOWLEDGED.

Step 34 - System automated action

The system creates a deadline tracker for performance security submission (10 calendar days).
Alerts fire at Day 7 (warning), Day 9 (urgent), and Day 10 (breach).
On breach, an alert goes to the Secretariat and HOPE, and a re-award workflow is initiated.


PHASE 9: CONTRACT MANAGEMENT

Step 35 - Account used: BAC Secretariat and HOPE

The system auto-generates the Contract and Notice to Proceed (NTP) from GPPB templates using all procurement record data.
HOPE digitally signs both documents in the system.
Physical wet signatures are still applied on the original paper documents.
Signed documents are uploaded to the system with blockchain-recorded hashes.
A blockchain record is created: CONTRACT_SIGNED and NTP_ISSUED.

Step 36 - Account used: BAC Secretariat

The NTP is issued to the Vendor via the system and email.
The NTP date becomes Day 1 of the contract implementation period.
The system begins tracking the contract duration countdown.
Contract milestone dates are auto-computed from the NTP date.
The Contract Dashboard becomes active for this contract.

Step 37 - Ongoing monitoring: Accounts used: BAC Secretariat, HOPE, Department Requester, Finance Officer

The Contract Dashboard shows real-time status: Active, Suspended, Completed, or Terminated.
Implementation progress is shown as elapsed days versus total contract duration.
Alerts fire at 3 days before each milestone and again if the milestone date passes without completion recorded.
BAC Secretariat and HOPE can see all contracts.
Department Requester can see only their own contracts.
Finance Officer can see all contracts.

Step 38 - Account used: Department Requester (when delivery is made)

The Vendor delivers goods or completes the service.
The Department Requester creates an Inspection and Acceptance Report (IAR).
The IAR includes a per-item checklist for quantity, condition, and compliance with specifications.
The inspection team completes the checklist and the Department Head confirms acceptance.
The IAR is signed and the status becomes DELIVERY_ACCEPTED.
A blockchain record is created: IAR_COMPLETED.

Step 39 - Account used: Vendor

The Vendor logs in and submits an invoice through the Vendor Portal, linking it to the specific delivery.

Step 40 - Account used: Finance Officer

The Finance Officer logs in at /finance.
They perform a three-way match: Invoice vs. Purchase Order vs. Inspection and Acceptance Report.
All three records must match before payment is certified.
Payment confirmation is recorded in the system.
A blockchain record is created: PAYMENT_RECORDED.

This is the end of the standard procurement lifecycle.


ALTERNATE PATH: SMALL VALUE PROCUREMENT

If the PR has an ABC of 2,000,000 or less (and above 200,000), the BAC Secretariat may assign Small Value Procurement mode instead of Competitive Bidding. The flow then differs starting at Phase 4.

Step 13 alternate - Account used: BAC Secretariat

Instead of an ITB, the Secretariat creates a Request for Quotation (RFQ).
The system auto-fills details from the PR.
The Secretariat sets the quotation submission deadline (minimum 3 business days), delivery schedule, delivery location, and payment terms.
The Secretariat selects at least 3 vendors from the registry. The system filters by procurement category and excludes suspended or blacklisted vendors. All selected vendors must have non-expired eligibility documents.

Step 14 alternate - Account used: BAC Secretariat

The Secretariat sends the RFQ.
The system sends an in-system notification and email to each selected vendor.
The system tracks per-vendor status: Sent, Viewed, Quotation Submitted, No Response.
A blockchain record is created: RFQ_SENT.

Step 15 alternate - Account used: Vendor

Each invited vendor logs in and submits their quotation via the Vendor Portal before the deadline.
The system records submission timestamp, quoted price, and compliance notes.
A 24-hour reminder is sent to non-responsive vendors before the deadline.

Step 16 alternate - Account used: BAC Secretariat

After the deadline, the Secretariat evaluates quotations.
The system ranks by lowest price.
The Secretariat generates the Abstract of Quotations.
The BAC Chairperson approves the abstract.

From this point, the process continues to the Award Phase (Phase 8), starting at Step 31, but using the RFQ and Abstract of Quotations instead of the Bid Opening and Evaluation reports.


OBSERVER AND AUDITOR ACCESS

The COA / GPPB Observer and Internal Auditor accounts have read-only access.
They can view all procurement records, blockchain audit logs, and documents across all active procurements.
They cannot create, edit, or approve any record.
They are listed as attendees in bid opening session minutes when present.


SYSTEM ADMIN ACTIONS

The System Administrator does not participate in the procurement workflow.
Their actions include: creating and deactivating user accounts, assigning roles, managing departments, viewing the full blockchain audit trail, and configuring system settings.
They receive alerts when document hash mismatches occur during hash verification checks.


END OF WALKTHROUGH
