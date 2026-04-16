REPUBLIC OF THE PHILIPPINES
LAGUNA STATE POLYTECHNIC UNIVERSITY
College of Computer Studies
PROCURESEAL
BLOCKCHAIN-BASED PROCUREMENT MANAGEMENT SYSTEM
Under Republic Act No. 12009 (Government Procurement Reform Act)

Software Requirements Specification & System Design Document
Version 1.0  |  Academic Year 2025–2026

Submitted in Partial Fulfillment of the Requirements for the Degree of
Bachelor of Science in Information Technology

Prepared by the Capstone Development Team
Academic Year 2025–2026

Make sure the folders and files structures are well-organized and follows the MVC architecture. If possible, each roles has their own folder and files structure.


SECTION 1: SYSTEM OVERVIEW
a
1.1 System Name and Identity
Attribute	Details
System Name	ProcureSeal
Full Title	Blockchain-Based Procurement Management System (BPMS)
Version	1.0.0
Governing Law	Republic Act No. 12009 — Government Procurement Reform Act (GPRA) and its Implementing Rules and Regulations (IRR)
Regulatory Body	Government Procurement Policy Board (GPPB)
Platform	Web-Based (React + laravel) with Blockchain Audit Layer
Target Deployment	Local Government Units (LGUs), Municipal Government Offices
Document Type	Software Requirements Specification (SRS) / System Design Document (SDD)

1.2 Executive Summary
ProcureSeal is a government-grade, blockchain-integrated web application designed to digitize, streamline, and enforce compliance throughout the entire public procurement lifecycle of a local government unit (LGU). The system covers all eleven (11) procurement modes prescribed under Republic Act No. 12009, from the creation of the Annual Procurement Plan (APP) through contract management and payment.
Unlike generic e-procurement tools, ProcureSeal is purpose-built for Philippine government procurement law. Every workflow, approval gate, document template, and audit mechanism within the system is grounded in RA 12009, its IRR, and GPPB-prescribed standards. The blockchain component ensures that every significant procurement event — bid openings, evaluation results, award decisions, contract executions — is permanently recorded in an immutable distributed ledger, making tampering or retroactive alteration technically impossible.

1.3 Problem Statement
Municipal procurement offices in the Philippines face a consistent set of institutional challenges that increase audit risk, delay project implementation, and reduce public trust in government spending:
•Manual, paper-based document tracking creates opportunities for document loss, tampering, and post-hoc alteration of procurement records.
•No centralized system exists for tracking the status of multiple procurements simultaneously, causing delays to go undetected until they become critical.
•Approval workflows are informal or untracked, making it impossible to determine who approved a decision and when.
•Bidder eligibility verification is inconsistent — different BAC members may apply different standards to the same set of submitted documents.
•Communication between the BAC Secretariat, requesting departments, vendors, and approving officials relies heavily on verbal coordination, email, and physical document routing, all of which create gaps in the audit trail.
•COA auditors and GPPB observers have no real-time access to procurement data; audit preparation is reactive, labor-intensive, and error-prone.
•No automated enforcement of legal deadlines exists — procurement officers must manually track timelines under RA 12009 and its IRR.

1.4 System Purpose and Objectives
Primary Purpose
To provide a unified, secure, and legally compliant digital platform through which all phases of government procurement — from Annual Procurement Plan preparation to Contract Management — are executed, tracked, documented, and audited with full transparency and immutable record-keeping.
Specific Objectives
1.Digitize all eleven (11) procurement modes under RA 12009 with mode-specific workflows, document templates, and approval routing.
2.Enforce mandatory legal timelines through automated deadline tracking, escalation alerts, and status dashboards visible to all authorized stakeholders.
3.Establish a role-based access control (RBAC) architecture that precisely mirrors the organizational structure of a Philippine LGU procurement office.
4.Integrate a permissioned blockchain ledger (Hyperledger Fabric) to create an immutable, tamper-evident record of all significant procurement events.
5.Automate document generation for Invitations to Bid, Abstracts of Bids, Notices of Award, Notices to Proceed, Purchase Orders, and other GPPB-prescribed templates.
6.Provide a vendor-facing portal for bidder registration, document submission (pre-screening), bid submission, and communication with the BAC Secretariat.
7.Generate management reports, audit trails, and performance dashboards for HOPE, BAC members, Finance Officers, and COA observers.

1.5 Scope of the System
In-Scope
•All eleven (11) modes of procurement under RA 12009 and its IRR
•Annual Procurement Plan (APP) preparation and management
•Purchase Requisition (PR) creation, routing, and approval
•Bidder registration, document pre-screening, and eligibility evaluation
•Invitation/Advertisement management (public posting and targeted invitations)
•Bid opening, abstract generation, evaluation, and post-qualification
•Award processing: Notice of Award (NOA), Notice to Proceed (NTP), Purchase Order (PO)
•Contract management: implementation monitoring, amendments, extensions, suspension, termination
•Blockchain audit trail for all critical procurement events
•Role-based dashboards, notifications, and report generation
•COA observer and GPPB observer read-only access portal
Out-of-Scope
•Actual financial disbursement or online payment processing
•Integration with GSIS, SSS, PhilHealth payroll systems
•Physical delivery tracking (barcode/RFID scanning)
•Full PhilGEPS API real-time integration (manual PhilGEPS reference input is in-scope)

1.6 Target Users
Role	Organizational Position	Primary System Interaction
System Administrator	IT Office / MIS Head	System configuration, user management, master data setup
HOPE (Head of Procuring Entity)	Mayor / Municipal Administrator	Final approvals, override authority, system-wide visibility
BAC Chairperson	Designated BAC Chair	BAC operations oversight, signing authority, resolution uploads
BAC Member	BAC Committee Members (min. 3)	Eligibility evaluation, bid evaluation voting, quorum confirmation
BAC Secretariat	Designated Secretariat Staff	Document processing, posting, scheduling, communication
TWG Member (Technical Working Group)	Technical Evaluators	Technical specification review, post-qualification evaluation
Department Requester	Head of Requesting Department / Unit	Purchase requisition creation, inspection and acceptance
Approving Authority (Budget Officer)	Municipal Budget Officer	Budget certification, fund availability confirmation
Finance Officer	Municipal Treasurer / Accountant	Invoice processing, payment records, financial reports
Vendor / Supplier	External Registered Supplier	Registration, document upload, bid submission, communication
COA Observer / GPPB Observer	External Oversight Bodies	Read-only access to procurement records and audit trail
Internal Auditor	Internal Audit Unit	Risk-based audit access, flagged transaction review

1.7 Key System Features
Feature Category	Feature Name	Description
Compliance Engine	RA 12009 Workflow Enforcement	Every procurement mode has a pre-coded, legally compliant step sequence that cannot be bypassed
Compliance Engine	Automated Deadline Tracking	System tracks all legal timeframes under RA 12009 IRR; sends alerts at 75%, 90%, and 100% elapsed
Compliance Engine	Quorum Enforcement	BAC decisions require minimum digital confirmations before proceeding
Blockchain Audit	Immutable Event Ledger	Hyperledger Fabric records hash of all critical events with timestamp, actor, and document reference
Blockchain Audit	Document Fingerprinting	SHA-256 hash of uploaded documents stored on-chain to detect post-upload tampering
Document Management	Auto-Template Generation	GPPB-prescribed documents (NOA, NTP, PO, Abstract of Bids) auto-populated from system data
Document Management	Version Control	All document revisions tracked with author, timestamp, and reason for change
Bidder Management	Online Pre-Screening Portal	Bidders upload documents; BAC Secretariat pre-reviews before bid opening day
Bidder Management	Blacklist/Debarment Check	System flags bidders against GPPB debarment list before registration approval
Multi-Mode Support	11 Procurement Mode Workflows	Separate, mode-specific process flows for all RA 12009 procurement types
Communication	Real-Time Notifications	In-app and email alerts for pending actions, approaching deadlines, and status changes
Reporting	Procurement Dashboard	Real-time monitoring of all active procurements with status, timeline, and risk indicators
Access Control	Role-Based Access (RBAC)	Granular permission matrix controlling what each role can view, create, edit, approve, or delete
Security	Two-Factor Authentication	OTP-based 2FA for all internal users; stronger authentication for HOPE and approving officials


SECTION 2: END-TO-END PROCUREMENT PROCESS FLOW

> **LEGAL DISCLAIMER — DIGITAL CONFIRMATION AND SIGNATURE LIMITATIONS:** All in-system confirmations, approvals, and attestations in ProcureSeal are implemented as JWT-verified identity bindings for authentication, traceability, and audit control; these are not legally equivalent electronic signatures under Republic Act No. 8792 and are not intended to replace mandatory wet signatures or duly recognized legal signing procedures. Accordingly, physical signatures on BAC Resolutions, Notice of Award (NOA), Notice to Proceed (NTP), and Contracts remain required under Republic Act No. 12009 and its IRR, while ProcureSeal-generated logs, timestamps, and blockchain audit trails are treated as supporting evidentiary records and not as legal substitutes for formally executed procurement instruments.

2.1 Procurement Lifecycle Overview
The ProcureSeal system implements a sequential, gate-controlled procurement lifecycle consisting of eight (8) major phases. Each phase must be completed and digitally confirmed before the next phase is unlocked. This prevents out-of-order execution and ensures a legally defensible procurement record. The following diagram describes the phases in a linear flow:

PROCUREMENT LIFECYCLE PHASES
PHASE 1: Annual Procurement Plan (APP)  →  PHASE 2: Purchase Requisition (PR)  →  PHASE 3: Bid Notice / Invitation  →  PHASE 4: Opening  →  PHASE 5: Evaluation  →  PHASE 6: Post-Qualification  →  PHASE 7: Award  →  PHASE 8: Contract Management

2.2 Phase 1 — Annual Procurement Plan (APP)
Actors Involved
•Department Heads (Requesters) — submit project requirements for the year
•BAC Secretariat — consolidates departmental inputs into the APP
•Budget Officer — certifies fund availability per project line
•HOPE — approves and signs the final APP
Process Steps
8.Department Heads log into ProcureSeal and create Project Entries indicating: project title, scope/description, estimated cost (Approved Budget for the Contract or ABC), procurement mode, and target implementation quarter.
9.The BAC Secretariat reviews all submitted project entries, checks for completeness, and consolidates them into the draft APP using the GPPB-prescribed APP template auto-generated by the system.
10.The Budget Officer logs in, reviews each line item, and certifies fund availability by clicking 'Certify Budget' per project entry. A budget certification timestamp is recorded on the blockchain.
11.The consolidated draft APP is routed to the HOPE for final review and digital approval. The HOPE may return items for revision with remarks.
12.Upon HOPE approval, the APP is locked in the system as the 'Approved APP.' The system publishes the APP summary to the public-facing procurement transparency dashboard.
13.The Secretariat may process APP Supplemental additions mid-year using the same approval workflow. Each supplemental amendment is versioned and blockchain-recorded.
Inputs
•Department project requirements and budget estimates
•Budget Office certification of fund availability
Outputs
•Approved Annual Procurement Plan (system-locked, blockchain-stamped)
•APP Supplemental (when applicable)
Decision Points
•HOPE Approval / Return for Revision — gates progression of any PR under each APP line item
•Budget Certification — no PR may be created for a project without certified budget

2.3 Phase 2 — Purchase Requisition (PR)
Actors Involved
•Department Requester — creates and submits the PR
•Department Head — reviews and endorses the PR
•Budget Officer — certifies fund availability at PR level
•BAC Secretariat — receives and processes the endorsed PR
Process Steps
14.The Department Requester creates a Purchase Requisition in ProcureSeal. The PR form requires: description of goods/services/works, quantity, unit of measure, estimated unit cost, total estimated cost, reference APP line item, and urgency level.
15.The PR is submitted for Department Head endorsement. The Department Head reviews, attaches supporting justification if needed, and digitally endorses the PR. The PR cannot proceed without this endorsement.
16.The Budget Officer receives the endorsed PR and checks fund availability from the certified budget. The officer inputs the fund source, account code, and confirms availability by digitally certifying the PR.
17.The budget-certified PR is transmitted to the BAC Secretariat queue. The Secretariat reviews the PR for completeness, confirms it aligns with an approved APP entry, and accepts or returns it with remarks.
18.Accepted PRs are formally logged in the system with a unique PR Reference Number. The Secretariat assigns the PR to the appropriate procurement mode based on the ABC.
19.If the ABC is above the SVP threshold (₱2,000,000), the system automatically routes to Competitive Bidding unless a valid justification for an alternative mode is submitted and approved by the HOPE.
PR Status Lifecycle
Status Code	Status Label	Meaning
PR-DRAFT	Draft	Created by requester, not yet submitted
PR-DEPT-REVIEW	For Department Head Endorsement	Awaiting department head digital signature
PR-BUDGET-CERT	For Budget Certification	Endorsed, awaiting fund certification
PR-SEC-REVIEW	For Secretariat Review	Certified, awaiting BAC Secretariat acceptance
PR-ACCEPTED	Accepted	Formally logged, procurement mode assigned
PR-RETURNED	Returned for Revision	Returned at any stage with remarks
PR-CANCELLED	Cancelled	Cancelled by requester or HOPE; reason recorded

2.4 Phase 3 — Bid Notice / Invitation
Actors Involved
•BAC Secretariat — prepares and posts the Invitation to Bid (ITB) or sends RFQs/invitations
•BAC Chairperson — reviews and signs ITB before publication
•HOPE — signs ITB for high-value or complex procurements
•PhilGEPS (external) — platform for mandatory public advertisement
Process Steps by Mode
For Competitive Bidding:
20.Secretariat prepares the Invitation to Bid (ITB) using the system's auto-populated GPPB template. Fields auto-filled from the accepted PR include: project title, ABC, deadline for document purchase, pre-bid conference date (if required), bid opening date and venue, and eligibility requirements.
21.The draft ITB is routed to the BAC Chairperson for review and digital approval.
22.Upon approval, the Secretariat posts the ITB to: (a) PhilGEPS portal [reference number entered manually], (b) the procuring entity's website [system auto-generates a public page], and (c) physical bulletin board [system generates a printable PDF version].
23.The system enforces minimum advertisement periods: 7 days for goods below ₱5M, 14 days for infrastructure below ₱5M, up to 30 days for higher thresholds, per RA 12009 IRR Table.
24.The system automatically tracks the advertisement end date and unlocks the 'Open Bid Submissions' phase only after the minimum period has elapsed.
For Small Value Procurement (SVP):
25.Secretariat generates a Request for Quotation (RFQ) using the system's SVP template. The RFQ specifies: description and quantity, ABC, submission deadline, and evaluation criteria.
26.The system presents the Secretariat with a list of system-registered vendors whose product category matches the RFQ. The Secretariat selects at minimum three (3) vendors to receive the RFQ.
27.The system sends the RFQ via in-system notification and email to selected vendors. Delivery confirmation (read receipt) is logged automatically.
28.Vendors submit their quotations directly through the vendor portal.
For Limited Source Bidding:
29.BAC prepares a shortlist of qualified suppliers based on demonstrated capability. The shortlist requires HOPE approval before invitations are sent.
30.System sends formal invitation letters (generated from GPPB template) only to shortlisted suppliers.
For Direct Contracting, Direct Acquisition, Repeat Order, Negotiated Procurement, Direct Sales, Direct Procurement for STI:
•No public advertisement is required. The BAC directly identifies and engages the single source or limited suppliers. The system records the justification, HOPE approval, and supporting documentation.

2.5 Phase 4 — Bid/Quotation Opening
Actors Involved
•BAC Members (minimum of three for quorum)
•BAC Secretariat — manages the physical process and encodes results
•BAC Chairperson — presides over the opening
•TWG Members — technical observers
•COA/GPPB Observers — independent observers (read-only system access)
•Bidders / Vendors — present during opening; submit physical documents
Process Steps
31.On bid opening day, the BAC Secretariat opens the 'Bid Opening Session' in ProcureSeal. The system requires confirmation of quorum (minimum 3 BAC members must digitally confirm attendance).
32.For Competitive Bidding, the system displays the list of bidders who submitted documents via the pre-screening portal. Each bidder's pre-screened documents are visible to the BAC as a checklist.
33.The BAC Secretariat records the Pass/Fail determination for each bidder's eligibility documents using the on-screen checklist. Reasons for failure are documented per document type (e.g., 'Mayor's Permit: Expired — document date 2024-01-15').
34.For financial bids of eligible bidders, the Secretariat encodes the bid amounts as stated in the physical sealed bid envelopes (bid prices as read). The system generates the 'Abstract of Bids As Read' automatically.
35.If only one eligible bidder remains, or if no bidder passes eligibility, the system records a 'Failure of Bidding' with the specific grounds (as prescribed by RA 12009 IRR). The system prompts the Secretariat to initiate re-bidding or an alternative mode.
36.The bid opening proceedings, including all pass/fail decisions and bid prices, are hashed and recorded on the blockchain with a timestamp, the digital confirmations of attending BAC members, and observer acknowledgments.
37.A postponement of bid opening (if justified) must be documented with: reason for postponement, new opening date, and HOPE approval. The system auto-notifies all registered bidders of the schedule change.

2.6 Phase 5 — Bid Evaluation
Actors Involved
•BAC Members / TWG — conduct technical and financial evaluation
•BAC Secretariat — encodes evaluation results and manages document routing
•BAC Chairperson — signs the evaluation report
Process Steps
38.After bid opening, the BAC enters the Evaluation phase. The system presents the list of eligible bidders with their As-Read bid prices.
39.The BAC (or TWG as applicable) conducts the technical evaluation. For each eligible bidder, evaluators complete a standardized Technical Evaluation Form in the system, rating each requirement as Compliant or Non-Compliant with remarks.
40.The system calculates the Calculated Price for each bidder by applying any applicable corrections or arithmetic adjustments to the As-Read price. The system auto-generates the 'Abstract of Bids As Calculated.'
41.The system ranks eligible bidders from lowest to highest Calculated Price (for goods and infrastructure) or highest-rated (for consulting services using QCBS — Quality-Cost Based Selection).
42.BAC uploads the signed BAC Resolution declaring the Lowest Calculated Bid (LCB). The resolution's document hash is recorded on the blockchain.
43.If a bidder files a Request for Reconsideration (RR) or Protest, the Secretariat logs it in the system. The RR/Protest Facility records: filing date, grounds, documents submitted, and resolution. All protest proceedings are blockchain-stamped.

2.7 Phase 6 — Post-Qualification
Actors Involved
•BAC / TWG — conducts post-qualification evaluation of the Lowest Calculated Bidder (LCB)
•BAC Secretariat — manages document requests and scheduling
•Supplier (Rank 1 LCB) — submits additional post-qualification documents
Process Steps
44.The BAC formally invites the Rank 1 LCB supplier (system generates and sends a Post-Qualification Invitation letter) to submit post-qualification documents within the period prescribed by RA 12009 IRR (typically 5 calendar days).
45.The supplier uploads post-qualification documents via the vendor portal. The system records upload timestamps and document hashes on the blockchain.
46.The BAC/TWG evaluates the post-qualification documents against legal, financial, and technical requirements. Evaluators complete the Post-Qualification Report in the system.
47.If the Rank 1 LCB passes post-qualification, the system marks them as the Lowest Calculated Responsive Bid (LCRB) and routes to the Award phase.
48.If the Rank 1 LCB fails, the BAC moves to Rank 2 and repeats the post-qualification process. All rank movements are recorded in the system with reasons for the ranking change.
49.The BAC uploads the signed BAC Resolution declaring the LCRB and Recommendation for Award. This is the final BAC document before HOPE action.
50.The Merchant Ranking System tracks the performance history of all participating bidders, updating scores based on post-qualification outcomes.
51.Failure of Bidding at post-qualification stage (if all bidders fail) is recorded with grounds and automatically initiates a re-bidding workflow or prompts for alternative mode.

2.8 Phase 7 — Award
Actors Involved
•HOPE — reviews BAC recommendation and issues Notice of Award
•BAC Secretariat — prepares and transmits award documents
•Supplier — receives and acknowledges Notice of Award
•Finance/Legal — prepares contract documents
Process Steps
52.The HOPE reviews the BAC Resolution recommending award. The system presents the complete procurement record (PR, bids, evaluation, post-qualification) for informed decision-making.
53.The HOPE either Approves the award recommendation or Returns it to the BAC with specific grounds. Any HOPE action is digitally signed and blockchain-recorded.
54.Upon HOPE approval, the system auto-generates the Notice of Award (NOA) using the GPPB-prescribed template, populated with: contract name, winning bidder, contract amount, and performance security requirements.
55.The NOA is transmitted to the winning bidder via the vendor portal and email. The system records the transmission timestamp and tracks bidder acknowledgment. The winning bidder must acknowledge receipt within three (3) calendar days per RA 12009 IRR.
56.If the Award is cancelled (e.g., due to HOPE non-approval, supplier non-acceptance, or legal grounds), the system initiates a Re-award Process to the next eligible ranked bidder, with all steps recorded.
57.Upon supplier acknowledgment, the system triggers the Performance Security requirement tracker, alerting the Secretariat of the security submission deadline.

2.9 Phase 8 — Contract Management
Actors Involved
•HOPE — signs the contract and Notice to Proceed (NTP)
•BAC Secretariat — uploads and records all contract documents
•Department Requester — monitors delivery/implementation and signs Inspection and Acceptance Report (IAR)
•Finance Officer — processes invoices and payment
•Supplier — delivers goods/services; submits invoices
Process Steps
58.The system auto-generates the Contract and the Notice to Proceed (NTP) from GPPB templates. The HOPE digitally signs both documents. All signed documents are uploaded to the system with blockchain-recorded hashes.
59.The NTP date marks Day 1 of the contract implementation period. The system begins tracking the contract duration and highlights milestone deadlines on the Contract Dashboard.
60.For amendments (change in scope, cost, or duration), the requesting department files an Amendment Request in the system. The request is routed through BAC review and HOPE approval. All amendments are versioned in the system.
61.For extensions, the supplier or department files a Time Extension Request with supporting justification. The system enforces RA 12009 rules on allowable extension grounds (force majeure, government-caused delays, etc.).
62.For suspension, the HOPE issues a Suspension Order via the system. The implementation clock is paused, and the suspension period is documented.
63.For termination (for cause or convenience), the system initiates a Termination Workflow requiring HOPE authorization, legal review checklist completion, and formal termination notice to the supplier.
64.Upon delivery, the Department Requester creates an Inspection and Acceptance Report (IAR) in the system. The inspection team completes the inspection checklist and the Department Head confirms acceptance.
65.Accepted deliveries trigger the invoice processing workflow. The Finance Officer validates the invoice against the contract, PO, and IAR, then processes payment. Payment confirmation is recorded in the system.


SECTION 3: ROLES & ACCESS CONTROL

3.1 Role-Based Access Control (RBAC) Overview
ProcureSeal implements a granular Role-Based Access Control (RBAC) model in which every system action is tied to a specific permission. Users are assigned one or more roles, and each role grants a defined set of permissions across the system's modules. No user can perform an action not explicitly granted by their role(s). The RBAC model is enforced at both the frontend (UI element visibility) and backend (API middleware) levels.

3.2 Role: System Administrator
Responsibilities
•Full system configuration, maintenance, and user account management
•Setting up master data: organizational units, procurement categories, document templates, fiscal year parameters
•Managing blockchain node configuration and ledger health monitoring
•Audit log review and system health dashboards
•User account creation, role assignment, password resets, and account deactivation
Permissions
Module	View	Create	Edit	Approve	Delete
User Management	✅	✅	✅	✅	✅
Master Data (Categories, Templates)	✅	✅	✅	✅	✅
System Audit Logs	✅	—	—	—	—
Blockchain Ledger Status	✅	—	—	—	—
All Procurement Records (read-only)	✅	—	—	—	—
System Configuration	✅	✅	✅	✅	✅
Notification Templates	✅	✅	✅	—	✅
Reports	✅	✅	—	—	—
Sidebar Menu
•🏠 Dashboard — System health, active users, ledger status
•👥 User Management — Create/Edit/Deactivate accounts; assign roles
•📋 Master Data — Document templates, procurement categories, org units, fiscal year
•⛓️ Blockchain Monitor — Node status, block explorer, hash verification
•📊 Audit Logs — Full system event log with filters
•🔔 Notification Management — Configure alert templates and delivery channels
•⚙️ System Settings — Security policies, 2FA enforcement, session timeout, backup
•📈 System Reports — Usage statistics, performance metrics
Access Restrictions
•Cannot create, modify, or approve procurement transactions (prevents conflict of interest)
•Cannot view bid prices or evaluation scores (procurement confidentiality)
•All Admin actions are recorded in a separate Admin Audit Log on the blockchain

3.3 Role: HOPE (Head of Procuring Entity)
Responsibilities
•Final authority for all significant procurement decisions
•Approves: APP, alternative mode justifications, BAC resolutions, NOA, NTP, Contract, Termination Orders
•Oversees overall procurement program compliance and performance
•May suspend or cancel any procurement upon valid grounds
Permissions
Module	View	Approve/Reject	Cancel/Suspend	Override
Annual Procurement Plan	✅ Full	✅	✅	✅
Purchase Requisitions	✅ Full	✅ (Budget-certified PRs)	✅	—
Alternative Mode Justifications	✅ Full	✅	—	—
BAC Resolutions	✅ Full	✅	—	—
Notice of Award	✅ Full	✅ (Generate & Sign)	✅	—
Notice to Proceed	✅ Full	✅ (Generate & Sign)	✅	—
Contracts	✅ Full	✅ (Sign)	✅	—
All Procurement Records	✅ Full (read)	—	—	—
Performance Reports	✅ Full	—	—	—
Sidebar Menu
•🏠 Dashboard — Active procurements overview, pending approvals count, deadline alerts
•✅ My Approval Queue — Pending items requiring HOPE action (PRs, Resolutions, NOAs, NTPs, Contracts)
•📋 Annual Procurement Plan — View, approve, track APP and supplementals
•📂 All Procurements — Full procurement register with status filters
•📊 Performance Dashboard — Procurement timelines, savings analysis, mode distribution
•⚠️ Compliance Monitor — Overdue items, deadline breach alerts, failure-of-bidding cases
•📈 Reports — Executive summary reports, procurement statistics by mode/department
•🔔 Notifications — System alerts and action items
Access Restrictions
•Cannot directly create PRs, bids, or evaluation documents (maintains separation of duties)
•HOPE approvals are blockchain-recorded with digital signature hash
•Cannot modify bid evaluation scores or post-qualification results

3.4 Role: BAC Chairperson
Responsibilities
•Presides over all BAC meetings and bid openings
•Signs Invitations to Bid, BAC Resolutions, and evaluation reports
•Manages BAC committee calendar and confirms quorum
•Oversees the BAC Secretariat operations
•Approves Failure of Bidding declarations and re-bidding justifications
Sidebar Menu
•🏠 Dashboard — Active biddings, pending BAC resolutions, upcoming opening schedules
•📋 Procurement Register — All procurements assigned to BAC with status tracking
•📑 Bid Openings — Schedule, manage, and record bid opening sessions
•📊 Bid Evaluation — Review evaluation results, sign evaluation reports
•🏅 Post-Qualification — Manage post-qualification scheduling and outcomes
•📄 BAC Resolutions — Create, review, and sign BAC Resolutions (LCB, LCRB, Award Recommendation)
•⚠️ Failure of Bidding — Declare and document failure cases; initiate re-bidding
•📅 BAC Calendar — Meeting schedules, bid opening dates, deadline tracker
•🔔 Notifications — Pending signatures, quorum alerts, deadline warnings
•📈 BAC Reports — Summary of completed procurements, failure rates, timeline compliance

3.5 Role: BAC Member
Responsibilities
•Participates in eligibility checks, bid openings, evaluation sessions, and post-qualification
•Digitally confirms quorum attendance for each BAC session
•Votes on BAC decisions (Pass/Fail, LCRB determination)
•Reviews and co-signs BAC Resolutions
Sidebar Menu
•🏠 Dashboard — Assigned evaluation tasks, upcoming sessions, pending votes
•📑 Bid Openings — View session records, confirm attendance, submit Pass/Fail decisions
•📊 Evaluation Tasks — Technical and financial evaluation forms for assigned procurements
•🏅 Post-Qualification Tasks — Post-qualification evaluation checklists
•📄 BAC Resolutions — View and co-sign resolutions (requires minimum quorum signatures)
•📅 BAC Calendar — Session schedules and upcoming tasks
•🔔 Notifications — Assigned tasks, session reminders
Access Restrictions
•Cannot view bids before the bid opening session is officially started
•Cannot modify another BAC member's evaluation scores
•Cannot approve Resolutions unilaterally — minimum quorum co-signatures required

3.6 Role: BAC Secretariat
Responsibilities
•Central administrative hub of all procurement operations in ProcureSeal
•Processes and routes PRs, prepares and posts invitations, manages bidder documents, schedules openings
•Encodes bid opening results and generates procurement documents
•Sends and receives communication with vendors and other stakeholders
•Maintains all procurement files and audit documentation
Sidebar Menu
•🏠 Dashboard — Task queue, document deadlines, active procurements by phase
•📋 Purchase Requisitions — Receive, review, accept/return PRs; assign procurement mode
•📁 Annual Procurement Plan — Consolidate and manage APP entries
•📢 Invitations & Posting — Create ITBs/RFQs, post advertisements, send targeted invitations
•👤 Bidder Management — Review pre-screened documents, manage bidder registry, run blacklist check
•📑 Bid Opening Management — Setup session, record Pass/Fail, encode bid prices, generate Abstract of Bids
•📊 Evaluation Support — Upload BAC resolutions, manage evaluation document routing
•🏅 Post-Qualification — Send post-qualification invitations, receive and route documents
•📄 Award Documents — Generate NOA, NTP, PO using templates; track transmission and acknowledgment
•📃 Contract Management — Upload contracts, track implementation milestones, process amendments
•✉️ Communications Center — In-system messaging with vendors, departments, and BAC
•📈 Reports — Generate procurement reports, timeline analysis, document status
•🔔 Notifications — All system alerts and task reminders

3.7 Role: Department Requester
Responsibilities
•Creates Purchase Requisitions for departmental needs
•Provides technical specifications and justifications
•Monitors status of submitted PRs
•Conducts inspection and acceptance of delivered goods/services
Sidebar Menu
•🏠 Dashboard — My submitted PRs with status, pending inspection tasks
•📝 Create Purchase Requisition — New PR form
•📋 My PRs — List of all PRs with current status, remarks, and history
•🔍 Track Procurement — View-only access to procurement progress for PRs I submitted
•✅ Inspection & Acceptance — Complete Inspection and Acceptance Reports for deliveries
•🔔 Notifications — PR status updates, inspection task assignments
Access Restrictions
•Can only view procurements linked to their own PRs
•Cannot view bid prices or evaluation details
•Cannot modify a PR once it has been accepted by the Secretariat

3.8 Role: Budget Officer
Responsibilities
•Certifies fund availability for each PR and APP line item
•Manages the budget module and fund source records
•Provides budget data for APP consolidation
Sidebar Menu
•🏠 Dashboard — PRs pending budget certification, certified PRs, budget utilization overview
•📋 PRs for Certification — Queue of PRs awaiting fund certification
•💰 Budget Register — APP-linked budget entries, fund sources, account codes
•📊 Budget Utilization Report — Committed vs. available budget by fund source and department
•🔔 Notifications — New PRs for certification, certification deadline alerts

3.9 Role: Finance Officer
Responsibilities
•Processes invoices after delivery acceptance
•Validates invoices against contracts and PRs (three-way matching)
•Records payment confirmations in the system
•Generates financial reports for procurement spending
Sidebar Menu
•🏠 Dashboard — Invoices pending validation, processed payments summary
•📄 Invoice Processing — Three-way match: Invoice vs. PO vs. IAR; validate and certify for payment
•💳 Payment Records — History of all processed payments linked to procurement
•📊 Financial Reports — Procurement expenditure by mode, department, vendor, and period
•🔔 Notifications — New invoices for processing, payment confirmation alerts

3.10 Role: Vendor / Supplier
Responsibilities
•Registers as a bidder in the system and submits eligibility documents for pre-screening
•Views posted invitations and procurement notices
•Submits bids or quotations through the vendor portal
•Receives and acknowledges Notices of Award
•Submits invoices and delivery documentation
Sidebar Menu
•🏠 Dashboard — Active invitations I can join, my submitted bids, procurement status
•👤 My Profile & Documents — Upload and manage eligibility documents, track expiry dates
•🔍 Procurement Opportunities — Browse open invitations matching my registered categories
•📤 My Bids / Quotations — Submit and view my bid submissions
•📬 My Invitations — Direct invitations from BAC (for SVP, Limited Source, etc.)
•📋 My Active Contracts — View contract details, NTP, milestone schedule
•📄 Submit Invoice — Upload invoices linked to accepted delivery
•✉️ Messages — Communication with BAC Secretariat
•🔔 Notifications — Invitation alerts, bid status updates, award notifications, payment confirmations
Access Restrictions
•Cannot view other vendors' bid prices or documents at any point
•Cannot modify submitted bids after the bid submission deadline
•Can only view their own procurement records and communications

3.11 Role: COA / GPPB Observer
Responsibilities
•Independent oversight and audit of procurement proceedings
•Read-only access to all procurement records, documents, and blockchain audit trail
•May submit observer's report through the system
Sidebar Menu
•🏠 Dashboard — All active procurements overview with status indicators
•📂 Procurement Register — Full access to all procurement records across all modes
•⛓️ Blockchain Audit Trail — View immutable event log, verify document hashes
•📑 Documents — Access to all uploaded procurement documents
•📊 Analytics — Full procurement analytics, timeline compliance, failure rates
•📝 Observer Report — Submit formal observer's report for any procurement
Access Restrictions
•Strictly read-only — cannot create, edit, approve, or delete any record
•Cannot view vendor financial data unrelated to specific procurement


SECTION 4: PAGE-BY-PAGE SYSTEM DESIGN (ULTRA-DETAILED)

4.1 Authentication Pages
4.1.1 Login Page
PURPOSE
Entry point for all internal system users. Provides secure authentication with 2FA enforcement for privileged roles.

Field Name	Type	Required	Validation / Notes
Email Address	Text / Email Input	Yes	Must be a registered system email; format validation applied
Password	Password Input (masked)	Yes	Minimum 12 characters; bcrypt hashed on backend
Remember this device (30 days)	Checkbox	No	Sets persistent session cookie; disabled for HOPE and Admin roles

Buttons & Actions
•🔐 Login — Submits credentials; triggers 2FA if role requires it
•🔁 Forgot Password — Navigates to password reset flow
•📱 Vendor Registration — Navigates to vendor self-registration page

Validation Rules
•Email must match an active account in the system
•Three consecutive failed login attempts lock the account for 30 minutes
•Locked accounts notify the System Administrator via email
•2FA OTP is required for: HOPE, BAC Chairperson, System Administrator, Finance Officer
•OTP is time-sensitive: valid for 5 minutes; single-use
Backend Logic
•POST /api/auth/login — validates credentials against bcrypt hash; checks account status (active/locked)
•On success: generate JWT access token (15-minute expiry) and refresh token (7-day expiry)
•If role requires 2FA: generate OTP, send via email/SMS, redirect to OTP verification page
•Failed attempt counter incremented in Redis cache per email address
•Successful login: previous failed attempt counter reset; session entry created in DB
Data Stored
•Session record: user_id, role, login_timestamp, IP address, device fingerprint
•Audit log entry: action=LOGIN, user_id, timestamp, IP, success/failure indicator
•Failed login attempts: Redis counter with TTL = 30 minutes
User Interactions
•User enters credentials and clicks Login; loading spinner shown during verification
•If 2FA required: OTP input modal appears; user checks email/SMS for OTP code
•On successful login: redirected to role-specific dashboard
•On failure: error message displayed ('Invalid credentials. X attempts remaining.')
•On account lock: error message with account lock notification; Admin email sent
Notifications Triggered
•📧 System Admin — alert email on 3rd failed login attempt (potential brute force)
•📱 User — OTP code via email/SMS when 2FA is triggered
•📧 User — account lock notification email when account is locked

4.1.2 Vendor Self-Registration Page
PURPOSE
Allows new vendors to create a system account and begin uploading their eligibility documents for BAC Secretariat pre-screening. Registration does not automatically grant bidding eligibility — it creates a pending account subject to review.

Field Name	Type	Required	Validation / Notes
Business Name	Text Input	Yes	Must be unique in the system; max 200 characters
Business Type	Dropdown	Yes	Options: Sole Proprietorship, Partnership, Corporation, Joint Venture, Foreign Company
DTI/SEC/CDA Registration Number	Text Input	Yes	Alphanumeric; format varies by business type
PhilGEPS Registration Number	Text Input	Yes	7-digit PhilGEPS reference number; system performs format validation
Tax Identification Number (TIN)	Text Input	Yes	Format: 000-000-000-000; system validates format
Registered Business Address	Text Area	Yes	Complete address including city and ZIP code
Primary Contact Person	Text Input	Yes	Full legal name of authorized representative
Contact Email Address	Email Input	Yes	Used for all system communications; must be verifiable
Contact Mobile Number	Text Input	Yes	Philippine mobile number format: 09XX-XXX-XXXX
Procurement Categories	Multi-select Checklist	Yes	Select all applicable: Goods, Services, Works, Consulting, IT, etc.
Username	Text Input	Yes	Alphanumeric; 6–30 characters; must be unique
Password	Password Input	Yes	Min 12 characters; must include uppercase, lowercase, number, special char
Confirm Password	Password Input	Yes	Must exactly match Password field
Agree to Terms and Privacy Policy	Checkbox	Yes	Must be checked to proceed

Buttons & Actions
•✅ Submit Registration — Submits form; creates pending vendor account
•🔄 Reset Form — Clears all input fields
•❓ Help / FAQ — Opens vendor registration guide in a modal

Validation Rules
•All required fields must be completed before submission is accepted
•PhilGEPS number: must be exactly 7 numeric digits
•TIN: must match format 000-000-000-000
•Password strength meter displayed in real-time; weak passwords blocked
•Confirm Password must match Password exactly
•System checks for duplicate email, username, PhilGEPS number, and TIN before submission
•Email verification link sent on submission; account remains inactive until email is verified
Backend Logic
•POST /api/vendors/register — creates vendor record with status = PENDING_EMAIL_VERIFICATION
•System sends email verification link (token valid for 24 hours)
•After email verification, vendor status changes to PENDING_SECRETARIAT_REVIEW
•System notifies BAC Secretariat of new vendor registration pending review
•System automatically queries GPPB debarment list API (or internal blacklist) for the business name/TIN
•If blacklist match found: account flagged as BLACKLISTED; Secretariat notified with match details
Data Stored
•vendor_id (UUID), business_name, business_type, dti_sec_number, philgeps_number, tin, address, contact_person, email, mobile, categories[], status, registration_timestamp
•Blacklist check result: timestamp, match_found (boolean), match_details (if any)
•Email verification token: stored with expiry timestamp
•Audit log: action=VENDOR_REGISTRATION, vendor_id, timestamp, IP
User Interactions
•Inline real-time validation on each field as user types (debounced 500ms)
•Password strength meter updates in real-time
•On successful submission: success message with instructions to check email for verification link
•On duplicate detection: specific field highlighted with error message (e.g., 'This PhilGEPS number is already registered')
Notifications Triggered
•📧 Vendor — email verification link immediately upon form submission
•📧 BAC Secretariat — new vendor pending review notification after email verification
•📧 BAC Secretariat — blacklist flag alert if potential match detected

4.2 Annual Procurement Plan (APP) Module
4.2.1 Create APP Project Entry
PURPOSE
Allows Department Heads or their authorized representatives to submit project entries for inclusion in the Annual Procurement Plan. Each entry represents a single procurement requirement for the fiscal year.

| Field Name | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| Project Title | Text Input | Yes | Max 300 characters; must be descriptive and specific |
| Project Description / Scope | Rich Text Area | Yes | Full description of goods, services, or works required |
| Major Final Output (MFO) | Dropdown | Yes | Linked to approved agency MFO master list for the selected fiscal year |
| Program / Activity / Project (PAP) Code | Text Input | Yes | Format validation: alphanumeric with dash/period separators; must exist in approved PAP registry |
| UACS Object Code | Text Input | Yes | Must match valid UACS object code format and master list for COA-aligned expenditure classification |
| Link to Approved Budget (GAA/Local Budget) | Reference Number Input | Yes | Must match an approved budget reference (e.g., ordinance/appropriation item reference) |
| Procurement Category | Dropdown | Yes | Goods / Services / Infrastructure Works / Consulting Services |
| Procurement Mode | Dropdown | Yes | Pre-populated with 11 RA 12009 modes; system suggests based on ABC |
| Approved Budget for the Contract (ABC) | Number Input (₱) | Yes | Must be greater than 0; system auto-suggests mode based on amount |
| Unit of Measurement | Text Input | Conditional | Required for Goods; e.g., 'piece', 'ream', 'set' |
| Quantity | Number Input | Conditional | Required for Goods; positive integer |
| Fund Source | Dropdown | Yes | Linked to Budget Register: General Fund, SEF, Trust Fund, LGSF, etc. |
| Account Code | Text Input | Yes | Government Chart of Accounts code; format: 000-000-000 |
| Implementing Unit / Office | Dropdown | Yes | Requesting department or office |
| Target Procurement Start (Quarter) | Dropdown | Yes | Q1 / Q2 / Q3 / Q4 of the fiscal year |
| Target Completion (Quarter) | Dropdown | Yes | Must be equal to or after Start Quarter |
| Justification / Basis | Text Area | Yes | Why this procurement is necessary; reference to approved programs |
| Technical Specifications (Attachment) | File Upload | No | PDF or DOCX; max 10MB; stored in system document repository |

Buttons & Actions
•💾 Save as Draft — Saves entry without submitting; remains editable
•📤 Submit for APP Consolidation — Submits entry to BAC Secretariat for APP inclusion
•🗑️ Delete Draft — Permanently deletes a draft entry (only for own drafts not yet submitted)
•📎 Attach Document — File upload trigger for technical specifications

Validation Rules
•ABC must be a positive number; system displays a mode recommendation tooltip based on ABC amount
•Target Completion Quarter must not be earlier than Target Procurement Start Quarter
•If Procurement Mode selected is an alternative mode, system prompts for Justification/Basis — this field becomes mandatory
•Account Code must match a valid code in the government chart of accounts master list
•MFO must be selected from the active MFO registry configured by the System Administrator for the fiscal year
•PAP Code must match an approved PAP entry in the agency planning/budget table; unregistered PAP codes are blocked
•UACS Object Code must pass both format validation and master-list validation before APP submission
•Approved Budget Reference must map to an approved GAA/Local Budget appropriation record with available balance
•File uploads must not exceed 10MB; only PDF and DOCX formats accepted
Backend Logic
•POST /api/app/entries — creates new APP entry record with status = DRAFT or SUBMITTED
•System checks if a submitted APP entry already exists for same department + project title to prevent duplicates
•System validates mfo_id against /api/master/mfo (active fiscal year entries only)
•System validates pap_code against /api/master/pap and confirms the PAP is tagged as funded for the selected fiscal year
•System validates uacs_object_code against /api/master/uacs-object-codes; invalid or inactive codes are rejected
•System validates approved_budget_reference against /api/budget/appropriations and performs soft-allocation check against available amount
•On submission: entry status set to PENDING_SECRETARIAT_CONSOLIDATION
•System records submission timestamp and user_id
•If alternative mode selected: system creates a mandatory approval task for HOPE (mode justification approval)
•System writes audit linkage metadata (mfo_id, pap_code, uacs_object_code, approved_budget_reference) into APP audit index for COA and Internal Audit queries
Data Stored
•app_entry_id, department_id, project_title, description, mfo_id, mfo_name_snapshot, pap_code, uacs_object_code, approved_budget_reference, category, mode, abc, unit, quantity, fund_source, account_code, implementing_unit, target_start_quarter, target_completion_quarter, justification, status, created_by, created_at, submitted_at
•Attached file: stored in /documents/app/ with reference linked to app_entry_id
•Audit index record: app_entry_id, mfo_id, pap_code, uacs_object_code, approved_budget_reference, fiscal_year, coa_trace_tag, indexed_at
User Interactions
•Mode Recommendation Tooltip: As user types the ABC, a tooltip appears suggesting the appropriate mode (e.g., 'ABC above ₱2M — Competitive Bidding recommended')
•Draft auto-save: every 2 minutes while user is on the form, a draft is auto-saved with a 'Last saved at HH:MM' indicator
•Budget Alignment Preview: once MFO, PAP, UACS, and Approved Budget Reference are selected, the UI displays a compliance badge ('Budget Alignment: Verified' or 'Mismatch Detected')
•On successful submission: success message; entry moves to 'My Submitted APP Entries' list
Notifications Triggered
•📧 BAC Secretariat — new APP entry submitted for consolidation (batched daily digest or real-time per entry, configurable)
•📧 Requester — confirmation that APP entry was successfully submitted

Audit Readiness and COA Examination Use
•The MFO, PAP Code, UACS Object Code, and Approved Budget Reference fields create a direct trace chain from APP planning entries to authorized appropriations, allowing each procurement project to be reconciled against approved budget authority.
•During COA examination, auditors can filter APP entries by MFO, PAP, and UACS to verify that procurement purpose, object of expenditure, and funding source are consistent with the approved budget ordinance/GAA line item.
•The approved budget reference and COA trace tag allow examiners to quickly cross-reference APP entries with budget documents, PRs, awards, and disbursement records, reducing manual document reconstruction and improving audit defensibility.

4.3 Purchase Requisition (PR) Module
4.3.1 Create Purchase Requisition Page
PURPOSE
Allows authorized department personnel to formally request procurement of goods, services, or works. The PR must be linked to an approved APP entry and is the trigger document that initiates the formal procurement process in ProcureSeal.

Field Name	Type	Required	Validation / Notes
PR Reference Number	Auto-generated	System	Format: PR-[YEAR]-[DEPT CODE]-[SEQUENCE]; e.g., PR-2025-MHO-0042
APP Reference / Project Link	Searchable Dropdown	Yes	Must link to an approved APP entry with available budget; auto-fills project details
Item Description	Text Area (per line item)	Yes	Detailed description of each good/service/work being requested
Unit of Measure	Text Input (per line item)	Yes	e.g., piece, box, ream, lot, unit
Quantity	Number Input (per line item)	Yes	Positive integer; cannot exceed remaining APP quantity
Estimated Unit Cost (₱)	Number Input (per line item)	Yes	Must be reasonable and consistent with market prices
Estimated Total Cost (₱)	Auto-computed	System	System multiplies Qty × Unit Cost; sum of all line items = Total PR Value
Purpose / Justification	Text Area	Yes	Specific reason for procurement; urgency level if applicable
Technical Specifications	Rich Text Area / File	Yes	Detailed specs for evaluation; may attach file
Requested by (Name & Designation)	Auto-filled from logged-in user	System	Name and designation of the requester
Date Required	Date Picker	Yes	Date by which goods/services must be delivered; must be future date
Urgency Level	Dropdown	No	Routine / Urgent / Emergency; affects priority in Secretariat queue
Supporting Documents	File Upload (multiple)	No	Any supporting documents: program of works, market study, etc.; PDF/DOCX, max 25MB total

Buttons & Actions
•💾 Save as Draft — Saves PR for later completion; editable while in Draft status
•➕ Add Line Item — Adds another row to the line item table for multiple items
•🗑️ Remove Line Item — Removes a specific line item row
•📤 Submit for Department Head Endorsement — Finalizes PR and routes to DH
•🖨️ Print PR Form — Generates printable PDF version of the PR
•🗑️ Delete Draft — Deletes draft PR (only available before submission)

Validation Rules
•Total estimated cost cannot exceed the remaining ABC of the linked APP entry
•Date Required must be at least 15 calendar days from submission date (to allow procurement processing time)
•If Urgency = Emergency, a mandatory justification text area appears (minimum 100 characters required)
•All line items must have complete fields before submission is allowed
•System validates that the linked APP entry is in 'Approved' status; PRs cannot be linked to pending or draft APP entries
Backend Logic
•POST /api/pr/create — creates PR record with all line items; status = DRAFT
•PUT /api/pr/:id/submit — changes status to PENDING_DH_ENDORSEMENT; locks editing
•System computes total PR value from line items; compares against APP remaining ABC
•Budget reservation flag created in Budget Register (soft reservation) upon submission
•Workflow task created for Department Head's dashboard: 'PR [PR-REF] awaiting your endorsement'
Data Stored
•pr_id, pr_reference_number, app_entry_id, department_id, requester_id, line_items[] {item_description, uom, quantity, unit_cost, total_cost}, purpose, date_required, urgency_level, status, created_at, submitted_at
•Supporting document references (file path, file name, upload timestamp)
•Budget reservation: amount, fund_source, account_code, pr_id, status=SOFT_RESERVED
User Interactions
•Line item table: add/remove rows dynamically; total cost auto-updates as quantities or unit costs are changed
•APP link: when user selects an APP entry, the form auto-fills: project title, category, mode, and remaining budget
•Remaining ABC indicator: shows 'Remaining Budget: ₱ X' and highlights in red if PR total would exceed it
•Draft auto-save every 2 minutes
Notifications Triggered
•📧 Department Head — 'PR [PR-REF] is awaiting your endorsement' with link to review
•📧 Requester — 'Your PR [PR-REF] has been submitted for endorsement'

4.4 Invitation / Advertisement Module
4.4.1 Create Invitation to Bid (ITB) Page
PURPOSE
Allows the BAC Secretariat to prepare the Invitation to Bid for Competitive Bidding procurement mode. The system auto-populates fields from the linked PR and APP data, reducing manual entry and ensuring data consistency.

Field Name	Type	Required	Validation / Notes
ITB Reference Number	Auto-generated	System	Format: ITB-[YEAR]-[SEQ]; e.g., ITB-2025-0015
Project Title	Auto-filled from PR	System	Editable if minor corrections needed; changes logged
Procuring Entity Name	Auto-filled from System Config	System	Official LGU name from master settings
Approved Budget for the Contract (ABC)	Auto-filled from PR	System	Read-only; reflects approved PR total
Source of Funds	Auto-filled from PR	System	Read-only; reflects certified fund source
Procurement Mode	Read-only from PR	System	Competitive Bidding (enforced for this template)
Bid Document Cost (₱)	Number Input	Yes	Per RA 12009 IRR Schedule: e.g., ₱500 for ABC ≤ ₱1M
Eligibility Check Date	Date Picker	Yes	Must be at least 12 days from posting date
Pre-Bid Conference Date	Date Picker	Conditional	Required if ABC ≥ ₱1M; must be at least 12 days from posting
Bid Submission Deadline	Date/Time Picker	Yes	Must comply with minimum advertisement period from RA 12009 IRR
Bid Opening Date and Time	Date/Time Picker	Yes	Must be same day as or after submission deadline
Bid Opening Venue	Text Input	Yes	Physical location for bid opening (conference room, address)
Contact Person	Text Input	Yes	Name and designation of BAC Secretariat contact
Contact Email and Phone	Text Input	Yes	Official contact details for bidder inquiries
PhilGEPS Posting Reference No.	Text Input	Post-publication	Entered after actual posting to PhilGEPS; updates system record
Additional Eligibility Requirements	Rich Text Area	No	Project-specific requirements beyond standard eligibility docs
ITB Remarks / Special Conditions	Rich Text Area	No	Any procurement-specific conditions or instructions to bidders

Buttons & Actions
•💾 Save as Draft — Saves ITB without routing for approval
•📤 Submit for BAC Chairperson Approval — Routes ITB for Chairperson digital signature
•👁️ Preview ITB — Shows formatted GPPB-template version of the ITB for review
•🖨️ Generate PDF — Generates printable PDF version of the ITB
•📋 Duplicate as Template — Copies ITB structure for a new similar project

Validation Rules
•Bid Document Cost must match the RA 12009 IRR prescribed schedule based on ABC
•All dates must comply with minimum legal periods defined in RA 12009 IRR; system displays required minimum dates as date picker constraints
•Bid Opening Date must be ≥ Bid Submission Deadline
•Pre-Bid Conference Date, if set, must be at least 12 days after posting date and at least 12 days before bid submission deadline
•System blocks submission of ITB if any required date falls on a non-working day (system uses PH public holiday calendar + weekend detection)
Backend Logic
•POST /api/itb/create — stores ITB record with status = DRAFT
•PUT /api/itb/:id/submit — routes for BAC Chairperson approval; status = PENDING_CHAIRPERSON_APPROVAL
•System auto-computes minimum required dates for each date field based on RA 12009 IRR timelines
•On Chairperson approval: status = APPROVED; system triggers posting workflow
•System generates announcement page on the public-facing portal with all ITB details
•After PhilGEPS reference number is entered: system records posting date and starts minimum advertisement period countdown
•Blockchain event recorded: ITB_POSTED with hash of ITB document, posting_date, responsible_user_id
Data Stored
•itb_id, itb_reference_number, pr_id, project_title, procuring_entity, abc, fund_source, bid_doc_cost, eligibility_date, pre_bid_date, submission_deadline, opening_date, opening_venue, contact_person, contact_email, contact_phone, philgeps_ref, status, created_by, created_at, approved_by, approved_at, posted_at
•Blockchain record: event=ITB_POSTED, document_hash (SHA-256 of PDF), timestamp, actor_id
User Interactions
•Date pickers enforce minimum legal periods as constraints; dates before the legal minimum are grayed out and unselectable
•ABC field auto-triggers bid document cost suggestion in a tooltip referencing the RA 12009 IRR schedule
•Preview button opens ITB in GPPB format in a new browser tab before submission
•After Chairperson approval, posting workflow appears: three checkboxes for posting destinations (PhilGEPS, LGU Website, Bulletin Board), each must be confirmed
Notifications Triggered
•📧 BAC Chairperson — 'ITB [ITB-REF] awaiting your approval for posting'
•📧 BAC Secretariat — 'ITB [ITB-REF] approved by Chairperson; proceed with posting'
•📧 All registered vendors in matching category — 'New Invitation to Bid posted: [Project Title]'
•📧 BAC Secretariat — 'Reminder: Bid submission deadline for [ITB-REF] is in 3 days'

4.4.2 Create Request for Quotation (RFQ) — Small Value Procurement
PURPOSE
Allows the BAC Secretariat to create and send RFQs to selected vendors for Small Value Procurement (SVP) mode. The system enforces the minimum of three (3) vendor invitations and tracks quotation receipts.

Field Name	Type	Required	Validation / Notes
RFQ Reference Number	Auto-generated	System	Format: RFQ-[YEAR]-[SEQ]; e.g., RFQ-2025-0088
Project / Item Title	Auto-filled from PR	System	Editable for corrections
Item Description (per line item)	Auto-filled from PR	System	Detailed description of each item requested
Quantity and Unit	Auto-filled from PR	System	Per line item
ABC / Price Ceiling	Auto-filled from PR	System	Maximum acceptable price; read-only
Technical Specifications	Rich Text Area / File	Yes	Full specifications that vendors must comply with
Quotation Submission Deadline	Date/Time Picker	Yes	Minimum of 3 business days from RFQ sending date
Delivery Schedule / Period	Text Input / Date Picker	Yes	Required delivery date or number of days from PO
Delivery Location	Text Input	Yes	Specific delivery address
Payment Terms	Dropdown	Yes	30 days / 60 days / Upon Delivery; standard government terms
Selected Vendors (min. 3)	Multi-select from Vendor Registry	Yes	System filters by matching procurement category; minimum 3 required
Additional Instructions to Vendors	Text Area	No	Any special instructions or requirements for the quotation

Buttons & Actions
•📤 Send RFQ — Sends RFQ to all selected vendors via system notification and email
•➕ Add Vendor — Opens vendor search to add more recipients
•🗑️ Remove Vendor — Removes a vendor from the recipient list (minimum 3 must remain)
•👁️ Preview RFQ — Shows formatted RFQ document before sending
•💾 Save as Draft — Saves without sending

Validation Rules
•Minimum of three (3) vendors must be selected before sending is allowed
•Submission deadline must be at least 3 business days from RFQ sending date
•System prevents sending RFQ to vendors with SUSPENDED or BLACKLISTED status
•ABC/Price Ceiling is read-only and cannot be altered in the RFQ stage
•All selected vendors must have active, non-expired eligibility documents on file
Backend Logic
•POST /api/rfq/create — creates RFQ with vendor invitation list
•POST /api/rfq/:id/send — sends in-system notifications and emails to all selected vendors; status = SENT
•System creates a quotation tracking record for each vendor: vendor_id, rfq_id, sent_at, opened_at, submitted_at, status
•System records delivery confirmation (read-receipt simulation) when vendor opens the notification
•Blockchain event: RFQ_SENT with hash of RFQ document, list of invited vendors (hashed), timestamp
Data Stored
•rfq_id, rfq_reference_number, pr_id, line_items[], abc, specifications, submission_deadline, delivery_schedule, delivery_location, payment_terms, invited_vendors[] {vendor_id, sent_at, read_at, status}, status, created_by, sent_at
User Interactions
•Vendor search: real-time search by business name or category; displays vendor registration status indicator
•On Send: confirmation dialog showing vendor list and deadline before final submission
•Quotation Tracking Panel: real-time table showing each vendor's status (Sent / Viewed / Quotation Submitted / No Response)
Notifications Triggered
•📧 Each selected vendor — RFQ invitation with deadline and portal link to submit quotation
•📱 BAC Secretariat — status update as each vendor views or submits quotation
•📧 BAC Secretariat — '1 day before deadline' reminder for vendors who have not yet submitted
•📧 Non-responsive vendors — reminder notification 24 hours before submission deadline

4.5 Bidder Management Module
4.5.1 Bidder Document Pre-Screening Page (Secretariat View)
PURPOSE
Allows the BAC Secretariat to review and pre-screen eligibility documents uploaded by registered vendors before bid opening day. Pre-screening reduces bid opening day workload and allows advance identification of document deficiencies.

Field Name	Type	Required	Validation / Notes
Bidder Name	Display (from vendor record)	System	Read-only
PhilGEPS Registration Number	Display	System	Read-only
Document: DTI/SEC/CDA Registration	File View + Status Toggle	System	Secretariat marks: Complete / Incomplete / Expired / Defective
Document: Mayor's Permit	File View + Status Toggle	System	Check expiry date; flag if expired
Document: Tax Clearance	File View + Status Toggle	System	Check validity; BIR-issued within validity period
Document: PhilGEPS Registration Certificate	File View + Status Toggle	System	Gold card or Platinum; check expiry
Document: Audited Financial Statements (AFS)	File View + Status Toggle	System	Most recent AFS; check NFRS/PFRS compliance
Document: PCAB License (for Works)	File View + Status Toggle	System	Conditional — required only for infrastructure contracts
Document: Statement of Ongoing Contracts	File View + Status Toggle	System	Verify completeness and proper notarization
Document: Statement of SLCC	File View + Status Toggle	System	Single Largest Completed Contract; check amount and relevance
Document: Bid Security	File View + Status Toggle	System	Check form (cash, bond, GSIS guarantee) and amount (2% of ABC)
Remarks per Document	Text Input	Conditional	Required if document is marked Incomplete, Expired, or Defective
Overall Pre-Screening Result	Dropdown	Yes	Pre-Screened Complete / Pre-Screened with Deficiencies / Pre-Screened Incomplete
Internal Secretariat Notes	Text Area	No	Notes for BAC use on bid opening day; not visible to vendor

Buttons & Actions
•✅ Save Pre-Screening Result — Saves current evaluation status for this bidder
•📧 Notify Bidder of Deficiency — Sends system notification to vendor listing document deficiencies (informational only; bidder must still appear on opening day)
•👁️ View Document — Opens uploaded file in a new browser tab (PDF viewer built-in)
•🔍 Verify Hash — Checks uploaded document's current SHA-256 hash against blockchain-recorded hash at upload time (tamper detection)
•✅ Mark All Complete — Bulk-marks all documents as Complete (used when Secretariat confirms originals are all in order)

Validation Rules
•Remarks field becomes mandatory if any document is marked Incomplete, Expired, or Defective
•Hash verification must show 'MATCH' for document to be considered valid; 'MISMATCH' triggers an automatic alert to Secretariat head and BAC Chairperson
•Pre-screening does not constitute final eligibility determination — that is done by the BAC on opening day with original documents
•Pre-screening status is advisory and internal; the formal eligibility determination is recorded in the Bid Opening Session module
Backend Logic
•GET /api/bidder/:vendor_id/documents — retrieves all documents for the selected bidder for the current procurement
•PUT /api/prescreening/:id — updates document status for each item; overall pre-screening status
•Document hash verification: GET /api/documents/:doc_id/verify — compares current file hash against on-chain recorded hash
•Hash mismatch event: blockchain record written — event=DOCUMENT_HASH_MISMATCH, doc_id, detected_at, actor_id; simultaneous alert sent to Admin
•Notification dispatch: POST /api/notify/vendor — sends deficiency notification if triggered by Secretariat
Data Stored
•prescreening_id, procurement_id, vendor_id, documents[] {doc_type, file_id, file_hash_at_upload, current_hash, status, remarks, verified_at, verified_by}, overall_status, internal_notes, prescreened_by, prescreened_at
•Blockchain: event=PRESCREENING_COMPLETED, procurement_id, vendor_id, result, timestamp, actor_id
User Interactions
•Document list displays inline PDF preview pane on the right when a document row is clicked
•Document status toggles update in real-time with color-coded badges: ✅ Complete (green), ⚠️ Deficiency (yellow), ❌ Incomplete (red), 🔄 Expired (orange)
•Hash Verification button shows a loading spinner; result displayed as 'VERIFIED ✅' or 'TAMPERED ❌ — ALERT SENT'
•Bidder list on the left panel; selecting a bidder loads their document checklist on the right (split-pane layout)
Notifications Triggered
•📧 Vendor — document deficiency notification (if Secretariat triggers it)
•📧 BAC Chairperson + System Admin — CRITICAL ALERT if document hash mismatch detected
•📧 BAC Secretariat — daily summary of pre-screening completion status for all bidders before opening day

4.6 Bid Opening Module
4.6.1 Bid Opening Session Page
PURPOSE
The central operational interface for conducting a formal bid opening session. The session must be initiated by the BAC Secretariat, quorum of BAC members must be confirmed, and all Pass/Fail determinations and bid prices are recorded in real-time during the physical opening.

Field Name	Type	Required	Validation / Notes
Session Reference	Auto-generated	System	Format: BOS-[ITB/RFQ REF]-[DATE]; e.g., BOS-ITB-2025-0015-20250315
Procurement Reference	Linked from ITB/RFQ	System	Read-only; project title and reference number displayed
Session Date and Time	Auto-filled (current)	System	System timestamp at session start; cannot be backdated
BAC Members Present (Quorum Confirmation)	Multi-select with digital confirm	Yes	Each listed BAC member clicks 'Confirm Attendance'; minimum 3 required
Observers Present	Text Input (multiple entries)	No	COA, GPPB, or other observers; names recorded for minutes
Bidder Attendance Record	Checklist per bidder	Yes	Mark each expected bidder as Present or Absent
For each bidder — Eligibility Documents	Per-document Pass/Fail radio	Yes	For each required document: Pass / Fail with reason if Fail
For each eligible bidder — Bid Price As Read (₱)	Number Input	Yes	Exact amount as stated in the bidder's financial envelope
Failure of Bidding Declaration	Yes/No + Grounds Dropdown	Conditional	Required if ≤1 bidder remains eligible or no valid bids
Postponement Reason	Text Area + New Date	Conditional	Required if session is postponed before completion
Session Minutes / Notes	Rich Text Area	Yes	Narrative of proceedings; auto-populated with session data

Buttons & Actions
•▶️ Start Session — Officially opens the session (requires quorum confirmation first)
•✅ Confirm Quorum — Each BAC member clicks individually to confirm attendance
•📊 Generate Abstract of Bids As Read — Automatically creates the abstract from recorded bid prices
•⏸️ Postpone Session — Records postponement with reason and new date; notifies all bidders
•⚠️ Declare Failure of Bidding — Records failure with grounds; initiates re-bidding workflow
•🔒 Close Session — Finalizes session record; locks all entries; triggers blockchain recording
•🖨️ Print Session Minutes — Generates printable PDF minutes of the opening

Validation Rules
•Session cannot be started unless minimum quorum (3 BAC members) have confirmed attendance
•Bid Price As Read field only appears for bidders who pass eligibility check
•If fewer than 2 eligible bidders remain, system auto-prompts: 'Insufficient competition detected — declare Failure of Bidding?'
•Once 'Close Session' is clicked, no edits are allowed; a final confirmation dialog appears before closing
•All numerical bid price inputs must be positive numbers; system validates for data entry errors (e.g., missing decimal places flagged if significantly different from ABC)
Backend Logic
•POST /api/bid-opening/start — creates session record; requires quorum_confirmed = true
•PUT /api/bid-opening/:id/eligibility — updates pass/fail per document per bidder
•PUT /api/bid-opening/:id/bid-price — records bid price as read for each eligible bidder
•POST /api/bid-opening/:id/generate-abstract — generates Abstract of Bids As Read document
•POST /api/bid-opening/:id/close — finalizes session; triggers blockchain recording of entire session record
•Blockchain event: BID_OPENING_COMPLETED — hash of Abstract of Bids As Read, list of BAC member confirmations, session_timestamp
•POST /api/bid-opening/:id/failure — records Failure of Bidding; triggers re-bidding or alternative mode workflow
Data Stored
•bid_opening_id, procurement_id, session_reference, session_date, bac_members_present[] {member_id, confirmed_at}, observers[], bidder_attendance[] {vendor_id, present}, eligibility_results[] {vendor_id, documents[] {type, result, reason}, overall_eligible}, bid_prices_as_read[] {vendor_id, amount}, failure_declared, failure_grounds, status, closed_at
•Blockchain: event=BID_OPENING, session_hash, abstract_hash, bac_signatures[], timestamp
•Abstract of Bids As Read: system-generated PDF stored in documents repository with blockchain-recorded hash
User Interactions
•Quorum panel: shows each BAC member with a large 'Confirm Attendance' button; turns green when confirmed; session Start button activates only when ≥3 confirmed
•Bidder evaluation: table layout with bidder names in rows, document types in columns; each cell is a Pass/Fail radio button
•Eligible bidder counter updates in real-time as Pass/Fail selections are made
•Bid price entry: appears only in rows where bidder passed eligibility; amount formatted as Philippine Peso in real-time
•Abstract of Bids As Read: preview appears on the right side of the screen before generation is finalized
•Session timeline bar shows: Quorum → Eligibility Check → Bid Price Recording → Abstract Generation → Session Close
Notifications Triggered
•📧 All registered bidders — postponement notification with new date (if session postponed)
•📧 BAC Chairperson + HOPE — Failure of Bidding alert (if declared)
•📧 BAC Secretariat — session successfully closed and blockchain-recorded confirmation
•📊 In-system push notification to COA/GPPB Observer accounts — session completed; records now available

4.7 Evaluation Module
4.7.1 Bid Evaluation Page
PURPOSE
Allows BAC members and TWG to conduct systematic technical and financial evaluation of eligible bids. All evaluation inputs are recorded per evaluator, and the system aggregates results to produce the evaluation report and ranking.

Field Name	Type	Required	Validation / Notes
Evaluation Reference	Auto-generated	System	Linked to Bid Opening Session reference
Eligible Bidder (per tab/row)	From Opening Session	System	Each eligible bidder displayed for evaluation
Technical Compliance — Specification Item 1...N	Pass / Fail radio per item	Yes	Each item corresponds to a line in the technical specifications
Technical Compliance Remarks	Text Area per item	Conditional	Mandatory if Fail is selected for any spec item
Financial Bid — Bid Price As Calculated (₱)	Number Input	Yes	Arithmetic correction applied if As-Read amount had errors
Arithmetic Correction Details	Text Area	Conditional	Required if Calculated Price differs from As-Read Price; explain correction
Evaluator Recommendation	Dropdown	Yes	Responsive / Non-Responsive per bidder
Overall Evaluation Remarks	Text Area	Yes	Summary of evaluation findings per bidder

Buttons & Actions
•💾 Save Evaluation — Saves current evaluation inputs (per evaluator session)
•📊 Generate Abstract of Bids As Calculated — Compiles financial rankings from all eligible and technically responsive bids
•📄 Generate Evaluation Report — Produces the official BAC Evaluation Report for Chairperson signature
•📤 Submit Evaluation for Chairperson Review — Routes completed evaluation for BAC Chairperson sign-off
•⚠️ Declare Failure of Bidding — If no responsive bid found; records grounds

Validation Rules
•All technical specification items must be evaluated before financial evaluation can be entered
•Calculated Price must equal As-Read Price unless an arithmetic correction is documented
•All BAC evaluators must complete their individual evaluation; system tracks completion per evaluator
•If all bids are declared Non-Responsive, Failure of Bidding must be formally declared
•Ranking is generated automatically by the system based on Calculated Price (ascending for goods/works) — manual ranking override is not allowed
Backend Logic
•POST /api/evaluation/submit — stores evaluation per evaluator per bidder
•GET /api/evaluation/:id/summary — aggregates all evaluator inputs into the consolidated evaluation result
•POST /api/evaluation/:id/generate-abstract — computes rankings; creates Abstract of Bids As Calculated PDF
•PUT /api/evaluation/:id/submit-to-chair — routes for Chairperson review; status = PENDING_CHAIRPERSON_REVIEW
•Blockchain event: EVALUATION_COMPLETED — hash of Evaluation Report, hash of Abstract As Calculated, evaluator_ids[], timestamp
Data Stored
•evaluation_id, bid_opening_id, procurement_id, evaluators[] {evaluator_id, evaluation_date, bidder_results[] {vendor_id, tech_items[] {item, result, remarks}, calculated_price, arithmetic_correction, recommendation, remarks}}, ranked_bidders[] {rank, vendor_id, calculated_price}, status
•Abstract of Bids As Calculated: system-generated PDF with blockchain hash
•BAC Evaluation Report: system-generated PDF with blockchain hash
User Interactions
•Tab-based layout: one tab per eligible bidder for evaluation input
•Financial ranking table auto-updates as Calculated Prices are entered
•Evaluator completion tracker: shows 'X of Y evaluators have completed evaluation' with real-time updates
•Abstract of Bids As Calculated: displayed in sortable table (rank, bidder name, calculated price, differential from ABC)
Notifications Triggered
•📧 BAC Chairperson — evaluation completed; Abstract and Report ready for your review and signature
•📧 All BAC Members — evaluation report submitted; review before Chairperson signs
•📊 HOPE Dashboard — evaluation phase completed; post-qualification to begin

4.8 Post-Qualification Module
4.8.1 Post-Qualification Invitation Page (Secretariat View)
PURPOSE
Allows the BAC Secretariat to formally issue a Post-Qualification Invitation to the current ranked bidder (starting with Rank 1 LCB), enforce the RA 12009 IRR five (5) calendar-day submission window, and track compliance before TWG evaluation.

| Field Name | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| Post-Qualification Invitation Reference | Auto-generated | System | Format: PQI-[YEAR]-[SEQ]; e.g., PQI-2025-0034 |
| Procurement Reference | Auto-filled from Evaluation Module | System | Read-only; includes ITB/RFQ reference and project title |
| Target Ranked Bidder | Auto-filled from ranking table | Yes | Defaults to current highest-ranked eligible bidder not yet disqualified |
| Bidder Rank | Auto-filled | System | Rank 1 by default; auto-updates to Rank 2/3 if prior bidder fails post-qualification |
| Invitation Issue Date | Auto-filled (current date/time) | System | System-generated issuance timestamp |
| Acknowledged Receipt Date | System-generated | System | Set when vendor acknowledges invitation in portal/email link |
| Post-Qualification Submission Deadline | Auto-computed | System | Exactly 5 calendar days from vendor acknowledgment date, per RA 12009 IRR |
| Required Post-Qualification Documents | Checklist (mode-specific template) | Yes | Pulled from procurement mode and project type (Goods/Infra/Consulting) |
| Special Document Instructions | Rich Text Area | No | Project-specific clarification notes to bidder |
| Extension Request Eligibility | Dropdown | No | Default = Not Allowed; if allowed, requires BAC justification + HOPE concurrence |
| Secretariat Contact Person | Auto-filled / Editable Text | Yes | Name, designation, email, and phone for bidder inquiries |
| Failure-to-Submit Consequence Notice | Display Block | System | Read-only legal notice: non-submission within deadline leads to disqualification and next-rank processing |

Buttons & Actions
•📄 Generate Post-Qualification Invitation — Creates invitation document using approved template
•📤 Send Invitation to Bidder — Sends invitation via portal + email; starts acknowledgment tracking
•👁️ Preview Invitation — Displays final invitation letter before sending
•🔁 Re-issue Invitation — Re-sends invitation when bidder claims non-receipt; does not reset legal deadline unless BAC-approved
•⏱️ Apply Approved Extension — Applies BAC/HOPE-approved extension with reason and new due date
•❌ Mark Bidder as Non-Compliant — Available after deadline lapse; routes to next ranked bidder

Validation Rules
•Invitation can only be issued after BAC confirms evaluation ranking and identifies the current LCB candidate.
•System computes the deadline as 5 calendar days from bidder acknowledgment timestamp, consistent with RA 12009 IRR post-qualification submission period.
•If bidder does not acknowledge within 24 hours, system continues running the legal clock from recorded service timestamp and flags 'Unacknowledged Service'.
•Extension is blocked unless justification is encoded and digitally approved by BAC Chairperson with HOPE concurrence.
•Once bidder is marked Non-Compliant due to late/non-submission, rank advancement to next bidder is mandatory and logged.

Backend Logic
•POST /api/post-qualification/invitations — creates invitation record with status = DRAFT
•POST /api/post-qualification/invitations/:id/send — dispatches invitation, sets status = SENT, records sent_at
•POST /api/post-qualification/invitations/:id/acknowledge — captures bidder acknowledgment; computes deadline_at = acknowledged_at + 5 calendar days
•PUT /api/post-qualification/invitations/:id/extension — applies approved extension with approval metadata and reason
•POST /api/post-qualification/invitations/:id/non-compliance — tags bidder as NON_COMPLIANT and triggers next-rank invitation workflow
•Blockchain event: POST_QUAL_INVITATION_SENT with invitation_hash, bidder_id, rank, sent_at, deadline_at

Data Stored
•pq_invitation_id, procurement_id, invitation_reference, bidder_id, bidder_rank, sent_at, acknowledged_at, deadline_at, extension_granted, extension_reason, extension_deadline_at, status, created_by, updated_by
•required_documents_snapshot[] {doc_code, doc_name, required, mode_context}
•service_audit[] {channel, delivered_at, opened_at, ip_address}
•Blockchain: event=POST_QUAL_INVITATION_SENT, invitation_hash, procurement_id, bidder_id, rank, timestamp

User Interactions
•Secretariat sees a deadline countdown badge (D-5 to D-0) immediately after service or acknowledgment.
•Invitation timeline panel displays Sent, Received, Acknowledged, Deadline, and Compliance status.
•If deadline is near (75% and 90% elapsed), warning banners appear inline.
•On non-compliance, a confirmation modal requires legal ground selection before advancing to next bidder.

Notifications Triggered
•📧 Target Bidder — official Post-Qualification Invitation with submission deadline and checklist
•📱 BAC Secretariat — bidder acknowledgment and document submission status updates
•📧 BAC Chairperson — deadline breach alert and recommendation to proceed to next rank
•📊 HOPE Dashboard — post-qualification delay/escalation alert when deadline lapses

4.8.2 Post-Qualification Document Upload Page (Vendor/Bidder View)
PURPOSE
Allows the invited bidder to upload all required post-qualification documents within the statutory submission window, with file integrity hashing and timestamping for legal defensibility.

| Field Name | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| Invitation Reference | Display | System | Read-only; linked to active post-qualification invitation |
| Project / Procurement Title | Display | System | Read-only |
| Submission Countdown Timer | Display | System | Shows remaining time based on 5-calendar-day legal window |
| Document Type | Checklist Row | Yes | System-provided required document list per invitation |
| Document File Upload | File Upload (per document) | Yes | PDF only; max 25MB per file; malware scan required |
| Document Reference Number | Text Input | Conditional | Required for permit/license/certificate documents |
| Issuing Agency | Text Input | Conditional | Required where applicable (BIR, SEC, PCAB, etc.) |
| Issue Date | Date Picker | Conditional | Required for date-bound documents |
| Expiry Date | Date Picker | Conditional | Required for expiring documents; must be on/after submission date |
| Explanation for Missing Document | Text Area | Conditional | Required if bidder uploads affidavit/substitute document, subject to BAC evaluation |
| Final Submission Attestation | Checkbox | Yes | Bidder confirms uploads are true, complete, and unaltered |

Buttons & Actions
•📤 Upload Document — Uploads selected file and computes SHA-256 hash
•🔄 Replace File — Replaces document before final submission deadline
•💾 Save Draft Submission — Saves partial uploads without final submission
•✅ Submit Post-Qualification Documents — Final submission; locks files after confirmation
•👁️ View Uploaded File — Opens uploaded PDF for verification

Validation Rules
•Uploads are accepted only within the active post-qualification window (5 calendar days from service/acknowledgment unless approved extension exists).
•Final submission is blocked until all required checklist items are uploaded or valid substitution explanation is provided.
•Expiry-sensitive documents are auto-flagged if expired on submission date.
•After final submission, document replacement is disabled unless BAC reopens the window through formal action.
•Late uploads are automatically rejected and logged as NON_COMPLIANT submission attempts.

Backend Logic
•GET /api/post-qualification/vendor/:invitationId/checklist — returns required document checklist and due date
•POST /api/post-qualification/vendor/:invitationId/upload — stores file in document repository, computes hash, records metadata
•PUT /api/post-qualification/vendor/:invitationId/replace/:docId — replaces draft-stage file before lock
•POST /api/post-qualification/vendor/:invitationId/submit — sets status = SUBMITTED, records submitted_at, locks files
•POST /api/post-qualification/vendor/:invitationId/late-attempt — logs blocked upload attempt beyond deadline
•Blockchain event: POST_QUAL_DOCUMENT_SUBMITTED per required file and consolidated submission event

Data Stored
•pq_submission_id, pq_invitation_id, bidder_id, submitted_at, status, attestation_confirmed, attested_by_user_id
•pq_documents[] {doc_id, doc_type, file_path, file_name, file_hash, reference_no, issuing_agency, issue_date, expiry_date, uploaded_at, replaced_at, locked}
•submission_audit[] {action, actor_id, timestamp, ip_address}
•Blockchain: event=POST_QUAL_DOCUMENT_SUBMITTED, procurement_id, bidder_id, doc_hash, timestamp

User Interactions
•Completeness meter displays progress (e.g., 7/9 required documents uploaded).
•Deadline indicator changes color at 75% and 90% elapsed to warn bidder.
•Each upload row shows hash generation status: 'Hash Recorded ✅'.
•After final submit, UI switches to read-only mode with submission receipt number.

Notifications Triggered
•📧 Bidder — submission receipt with timestamp and checklist summary
•📧 BAC Secretariat — bidder completed post-qualification submission
•📱 TWG Members — evaluation task unlocked and ready for review
•📧 Bidder + Secretariat — automatic warning at 24 hours before deadline if not yet submitted

4.8.3 TWG Post-Qualification Evaluation Form Page
PURPOSE
Allows TWG evaluators to assess post-qualification submissions against legal, technical, and financial requirements and produce an objective recommendation for BAC action.

| Field Name | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| Post-Qualification Evaluation Reference | Auto-generated | System | Format: PQE-[YEAR]-[SEQ] |
| Procurement Reference | Auto-filled | System | Read-only |
| Evaluated Bidder | Auto-filled | System | Current ranked bidder under post-qualification review |
| Legal Compliance Checklist | Pass/Fail per item | Yes | Includes permits, registrations, tax compliance, sworn statements |
| Technical Compliance Checklist | Pass/Fail per item | Yes | Includes conformity to specs, equipment/manpower capability, performance records |
| Financial Capacity Checklist | Pass/Fail per item | Yes | Includes NFCC/credit line and audited financial capacity indicators |
| Document Authenticity Verification | Status Toggle + Hash Result | Yes | Hash match required; mismatch triggers critical alert |
| Clarification Request Notes | Text Area | Conditional | Required if TWG requests clarification from bidder |
| Site/Office Verification Schedule | Date-Time Picker | No | Optional field when physical validation is required |
| TWG Evaluator Remarks | Rich Text Area | Yes | Consolidated findings and supporting observations |
| Overall TWG Recommendation | Dropdown | Yes | Pass Post-Qualification / Fail Post-Qualification |
| Grounds for Failure | Dropdown + Text Area | Conditional | Mandatory when recommendation = Fail; cite specific deficiency |

Buttons & Actions
•💾 Save Evaluation Draft — Saves in-progress evaluation per TWG member
•🔍 Verify All Document Hashes — Batch hash validation against blockchain records
•✉️ Issue Clarification Request — Sends documented clarification request to bidder (if permitted by BAC)
•📄 Generate TWG Post-Qualification Report — Produces signed evaluation report draft
•📤 Submit Recommendation to BAC — Finalizes TWG recommendation for BAC deliberation

Validation Rules
•All legal, technical, and financial checklist items must be rated before submission.
•Any 'Fail' rating requires item-specific justification and evidence reference.
•Hash mismatch automatically blocks a 'Pass' recommendation until resolved or formally noted as adverse finding.
•TWG cannot alter bidder-submitted files; evaluation is strictly read-only with annotation capability.
•Submission after internal BAC/TWG evaluation cut-off requires Chairperson override log.

Backend Logic
•GET /api/post-qualification/evaluation/:invitationId — loads bidder submission package and checklist template
•POST /api/post-qualification/evaluation/:id/save — stores evaluator draft findings
•POST /api/post-qualification/evaluation/:id/verify-hashes — validates all file hashes against on-chain records
•POST /api/post-qualification/evaluation/:id/generate-report — creates TWG report PDF and hash
•POST /api/post-qualification/evaluation/:id/submit — sets status = SUBMITTED_TO_BAC, unlocks BAC resolution generator
•Blockchain event: POST_QUAL_EVALUATED with report_hash, recommendation, evaluator_ids, timestamp

Data Stored
•pq_evaluation_id, pq_invitation_id, procurement_id, bidder_id, evaluator_id, checklist_results[] {item_code, result, remarks}, overall_recommendation, failure_grounds, submitted_at, status
•twg_report_path, twg_report_hash, hash_verification_summary[] {doc_id, expected_hash, actual_hash, match}
•Blockchain: event=POST_QUAL_EVALUATED, procurement_id, bidder_id, report_hash, recommendation, timestamp

User Interactions
•Split-screen view: left panel for checklist scoring, right panel for document preview.
•Hash verification status appears per document (MATCH / MISMATCH).
•Recommendation banner updates dynamically based on checklist outcomes.
•Evaluator completion tracker shows BAC when all TWG reviewers have submitted.

Notifications Triggered
•📧 BAC Secretariat — TWG recommendation submitted and report ready
•📧 BAC Chairperson — post-qualification result awaiting BAC action
•📧 Bidder — clarification request notice (if issued)
•📊 HOPE Dashboard — post-qualification result milestone completed

4.8.4 BAC Resolution Generator Page (Declaration of LCRB)
PURPOSE
Allows BAC to generate, review, and finalize the formal BAC Resolution declaring the Lowest Calculated Responsive Bid (LCRB), or recording bidder disqualification and rank progression when post-qualification fails.

| Field Name | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| BAC Resolution Number | Auto-generated | System | Format: BAC-RES-[YEAR]-[SEQ] |
| Procurement Reference | Auto-filled | System | Read-only |
| Subject Bidder | Auto-filled | System | Bidder under current post-qualification deliberation |
| TWG Recommendation Summary | Auto-filled | System | Pulled from submitted TWG Post-Qualification Report |
| BAC Resolution Type | Dropdown | Yes | Declare LCRB / Declare Failed Post-Qualification / Advance to Next Rank |
| Legal Basis / Grounds | Rich Text Area | Yes | Must cite applicable RA 12009 IRR basis for decision |
| Rank Movement Directive | Dropdown | Conditional | Required if bidder fails; options: Move to Rank 2, Rank 3, etc. |
| BAC Voting Record | Per-member vote entry | Yes | Approve / Disapprove / Abstain; quorum required |
| BAC Chairperson Signature | Digital confirmation + signature artifact | Yes | Required before finalization |
| Co-signatories (BAC Members) | Digital confirmations | Yes | Minimum quorum co-signatures required |
| Resolution Date | Auto-filled (upon finalization) | System | Read-only after final sign-off |
| Attachment: Signed Resolution Scan | File Upload | Conditional | Required when physical signed copy is available |

Buttons & Actions
•📝 Generate Draft Resolution — Builds draft from TWG recommendation and templates
•👁️ Preview Resolution — Displays complete resolution text before signatures
•✅ Collect BAC Signatures — Opens signature workflow for BAC members
•🔒 Finalize Resolution — Locks resolution and records official BAC decision
•📤 Route to HOPE — Sends finalized LCRB recommendation package for HOPE action
•🔁 Trigger Next-Rank Post-Qualification — Available when result is failed post-qualification

Validation Rules
•Resolution cannot be finalized without quorum-confirmed BAC co-signatures and Chairperson sign-off.
•If resolution outcome is 'Declare LCRB', bidder must have a TWG recommendation of Pass.
•If outcome is failure, specific grounds and rank movement directive are mandatory.
•Finalized resolutions are immutable; corrections require superseding resolution with linked reference.
•Physical signed BAC Resolution remains required; digital confirmation is audit-supporting and not a legal substitute.

Backend Logic
•POST /api/post-qualification/resolutions/generate — creates draft BAC resolution from TWG report
•POST /api/post-qualification/resolutions/:id/sign — records BAC member signatures and timestamps
•POST /api/post-qualification/resolutions/:id/finalize — locks resolution, sets decision outcome, records finalized_at
•POST /api/post-qualification/resolutions/:id/route-hope — transmits finalized resolution to HOPE approval queue
•POST /api/post-qualification/resolutions/:id/next-rank — initiates next ranked bidder invitation when failure is declared
•Blockchain event: BAC_RESOLUTION_LCRB_DECLARED or BAC_RESOLUTION_POSTQUAL_FAILED with resolution_hash and metadata

Data Stored
•pq_resolution_id, procurement_id, resolution_number, bidder_id, resolution_type, legal_basis_text, rank_directive, votes[] {member_id, vote, voted_at}, signed_by_chair_at, finalized_at, routed_to_hope_at, status
•resolution_document_path, resolution_hash, physical_signed_copy_path
•Blockchain: event_type, procurement_id, resolution_hash, actor_ids[], timestamp, decision_metadata

User Interactions
•Resolution text is auto-assembled with editable 'Whereas' clauses before lock.
•Signature progress bar shows remaining BAC members required for quorum.
•If bidder fails, a guided workflow prompts immediate next-rank initiation to avoid delay.
•Finalized resolution view includes QR/hash verification link for audit review.

Notifications Triggered
•📧 HOPE — BAC Resolution for LCRB recommendation is ready for approval action
•📧 BAC Secretariat — resolution finalized and archived
•📧 Bidder (Winning LCRB) — advisory notice that BAC has issued recommendation for award
•📧 Next Ranked Bidder — post-qualification invitation notice (if rank progression triggered)

4.9 Award Module
4.9.1 Generate Notice of Award Page
PURPOSE
Allows the BAC Secretariat (after HOPE approval of the BAC recommendation) to generate and transmit the official Notice of Award to the winning bidder. The NOA is auto-populated from the procurement record and uses the GPPB-prescribed template.

Field Name	Type	Required	Validation / Notes
NOA Reference Number	Auto-generated	System	Format: NOA-[YEAR]-[SEQ]; e.g., NOA-2025-0021
Project Title	Auto-filled from Procurement Record	System	Read-only
Winning Bidder (LCRB)	Auto-filled from Post-Qualification	System	Read-only; legal business name and address
Contract Amount (₱)	Auto-filled (LCRB Calculated Price)	System	Read-only; basis for the award
Performance Security Required	Auto-computed	System	2–10% of contract amount per RA 12009; displayed with form options
Performance Security Submission Deadline	Auto-computed	System	10 calendar days from receipt of NOA per RA 12009 IRR
Contract Signing Schedule / Deadline	Auto-computed	System	Within 10 days from NOA receipt per RA 12009 IRR
HOPE Name and Designation	Auto-filled from System Config	System	Signatory name; read-only
NOA Date	Auto-filled (today's date upon HOPE sign-off)	System	System date when HOPE digitally signs
Special Conditions (if any)	Text Area	No	Any procurement-specific conditions for the awarded contract

Buttons & Actions
•👁️ Preview NOA — Shows formatted GPPB-template NOA before finalization
•✅ HOPE Sign & Issue NOA — (HOPE role only) Digitally signs and issues the NOA; triggers transmission to vendor
•🖨️ Download NOA PDF — Downloads signed NOA as PDF
•📧 Resend NOA — Resends NOA notification to vendor (if original not acknowledged)
•❌ Cancel Award — (HOPE only) Records award cancellation with mandatory grounds; initiates re-award workflow

Validation Rules
•NOA can only be generated after HOPE has formally approved the BAC Resolution recommending award
•HOPE digital sign-off is required before NOA is transmitted to vendor
•Once issued (HOPE signed), the NOA record is locked and cannot be modified
•Award Cancellation requires a mandatory grounds entry (minimum 150 characters) and a new HOPE digital sign-off on the cancellation record
Backend Logic
•POST /api/award/noa/generate — creates NOA record pre-populated from procurement data; status = DRAFT
•PUT /api/award/noa/:id/sign — records HOPE digital signature (JWT-verified identity); status = ISSUED; triggers vendor notification
•Blockchain event: NOA_ISSUED — hash of signed NOA PDF, winning_vendor_id, contract_amount, hope_id, timestamp
•Vendor portal notification + email sent with NOA PDF attachment and acknowledgment request
•Acknowledgment tracking: vendor must click 'Acknowledge Receipt' in vendor portal within 3 calendar days; system tracks and alerts Secretariat if not acknowledged
•Performance security deadline tracker auto-created in system with countdown to deadline
Data Stored
•noa_id, procurement_id, noa_reference, vendor_id (winner), contract_amount, performance_security_amount, performance_security_deadline, contract_signing_deadline, hope_signature_id, issued_at, acknowledged_at, status
•Blockchain: event=NOA_ISSUED, noa_hash, vendor_id, amount, timestamp, hope_id
User Interactions
•Preview pane: shows fully formatted NOA with all GPPB-prescribed sections; letterhead auto-included from system config
•HOPE sees a prominent 'Sign and Issue NOA' button with a confirmation dialog: 'You are about to digitally sign and issue the Notice of Award. This action cannot be undone.'
•Acknowledgment tracker: shows real-time status 'Awaiting Acknowledgment' / 'Acknowledged on [date]' with countdown timer
Notifications Triggered
•📧 Winning Vendor — NOA with PDF attachment and acknowledgment instruction
•📧 BAC Secretariat — NOA issued; acknowledgment tracking initiated
•📧 Department Requester — award issued for your PR [PR-REF]; contract preparation in progress
•📧 BAC Secretariat — vendor acknowledgment deadline warning (Day 2 if not yet acknowledged)
•📧 All losing bidders — notification that the contract has been awarded (informational)

4.10 Contract Management Module
4.10.1 Contract Dashboard Page
PURPOSE
Central view for monitoring all active contracts in ProcureSeal. Provides real-time status, milestone tracking, and quick access to contract actions. Accessible to BAC Secretariat, HOPE, Department Requesters (own contracts), and Finance Officers.

Field Name	Type	Required	Validation / Notes
Search / Filter Bar	Text Search + Filters	No	Filter by: contract status, department, vendor, mode, date range, contract amount range
Contract Status	Display Badge	System	Active / Suspended / Completed / Terminated / For Renewal
Implementation Progress	Progress Bar (% computed)	System	Based on elapsed time vs. contract duration; or milestone completion

Buttons & Actions
•📋 View Contract Details — Opens full contract record with all documents
•📝 File Amendment Request — Initiates amendment workflow (Secretariat/Requester)
•⏱️ File Time Extension Request — Initiates extension workflow
•⏸️ Issue Suspension Order — HOPE only; suspends contract with justification
•🛑 Initiate Termination — HOPE only; starts termination workflow with legal checklist
•📊 View Inspection Reports — Opens all IARs linked to this contract
•💳 View Payment Records — Shows all payment transactions for this contract
•📤 Export Contract Summary — Exports contract data as PDF or Excel

Validation Rules
•Milestone dates auto-computed from NTP date and contract duration; system alerts when milestone is approaching (3 days) or overdue
•Amendment or extension requests require HOPE approval before taking effect in the system
•Termination workflow requires a mandatory legal checklist to be completed before the termination order is issued
Backend Logic
•GET /api/contracts — paginated list of contracts with current status, filtered by user role (Requester sees only own contracts; HOPE sees all)
•Contract progress: computed daily by background job comparing elapsed_days vs. contract_duration_days
•Deadline alert job: runs every 6 hours; sends alerts for contracts with milestones due within 3 days
Data Stored
•contract_id, procurement_id, vendor_id, contract_reference, ntp_date, contract_duration_days, contract_end_date, contract_amount, status, milestones[], amendments[], extensions[], suspensions[], termination (if applicable), iars[], payments[], created_at
User Interactions
•Dashboard cards: summary counts — Active Contracts, Contracts Ending This Month, Overdue Milestones, Pending Inspections
•Contract list: sortable table with color-coded status badges and progress bars
•Clicking a contract row expands a preview panel on the right with key contract details before opening full view
Notifications Triggered
•📧 Department Requester + Secretariat — milestone approaching alert (3 days before deadline)
•📧 HOPE + Secretariat — contract overdue milestone alert
•📧 Finance Officer — inspection acceptance report submitted; invoice processing required



SECTION 5: SYSTEM ARCHITECTURE

5.1 Technology Stack
Layer	Technology	Version	Justification
Frontend	React.js	18.x	Component-based SPA; large ecosystem; efficient for complex, role-specific dashboards
Frontend State	Redux Toolkit + RTK Query	Latest	Centralized state management; efficient API caching and real-time data sync
Frontend UI	Tailwind CSS + shadcn/ui	Latest	Utility-first; highly customizable; professional government system aesthetics
Frontend Charts	Recharts	Latest	React-native charting for procurement analytics dashboards
Frontend PDF Preview	react-pdf	Latest	In-browser PDF rendering for document review without download
Backend	Node.js + Express.js	20.x LTS	Non-blocking I/O; excellent for concurrent API handling; large middleware ecosystem
API Design	RESTful API + Swagger/OpenAPI	3.0	Standard REST conventions; auto-generated API documentation for maintainability
Real-time	Socket.IO	Latest	Enables real-time bid opening session updates, quorum confirmation, and live notifications
Database (Primary)	PostgreSQL	15.x	ACID-compliant relational DB; ideal for complex procurement data relationships and audit requirements
ORM	Prisma ORM	Latest	Type-safe DB queries; schema migration management; strong PostgreSQL integration
Caching	Redis	7.x	Session management; failed login rate limiting; real-time notification queuing
File Storage	AWS S3 (or MinIO on-prem)	Latest	Secure, scalable storage for procurement documents; pre-signed URL access control
Authentication	JWT (Access + Refresh Tokens) + Passport.js	Latest	Stateless authentication; short-lived access tokens; secure refresh token rotation
2FA	TOTP / Email OTP via Nodemailer	Latest	Time-based OTP; enforced for privileged roles
Email Service	Nodemailer + SMTP (or SendGrid)	Latest	Transactional email delivery for notifications; templates rendered with Handlebars
Blockchain	Hyperledger Fabric	2.5.x	Permissioned enterprise blockchain; suitable for government use; supports chaincode in Node.js/Go
Blockchain SDK	Fabric Node.js SDK	Latest	Programmatic interaction with Fabric network from Node.js backend
Document Generation	PDFKit / Puppeteer	Latest	Server-side PDF generation for GPPB-prescribed document templates
Security Hashing	crypto (Node built-in) — SHA-256	Built-in	Document fingerprinting for blockchain integrity verification
Background Jobs	Bull + Redis	Latest	Scheduled deadline checks, notification dispatch, report generation
Testing	Jest + Supertest + React Testing Library	Latest	Unit, integration, and component testing
Deployment	Docker + Docker Compose	Latest	Containerized deployment; consistent environments; easy scaling
Reverse Proxy	Nginx	Latest	Load balancing, HTTPS termination, static file serving
HTTPS / SSL	Let's Encrypt / Certbot	Latest	Free, auto-renewing SSL certificates

5.2 System Architecture Diagram (Textual)
ARCHITECTURE OVERVIEW
PRESENTATION LAYER (React SPA) ↔ API GATEWAY (Nginx) ↔ APPLICATION LAYER (Node.js/Express) ↔ DATA LAYER (PostgreSQL + Redis + S3) + BLOCKCHAIN LAYER (Hyperledger Fabric)

The Application Layer is the integration hub connecting all layers. It handles business logic, enforces RBAC, triggers blockchain recording, manages file uploads to S3, and dispatches notifications.

Presentation Layer (React Frontend)
•Single Page Application served via Nginx
•Role-based routing: users see only routes their role permits
•RTK Query manages API calls with automatic caching and revalidation
•Socket.IO client maintains WebSocket connection for real-time updates (bid opening sessions, notifications)
•JWT access token stored in memory (not localStorage) for XSS protection; refresh token in HttpOnly cookie

Application Layer (Node.js / Express Backend)
•RESTful API organized by domain modules: /api/auth, /api/app, /api/pr, /api/itb, /api/rfq, /api/bidders, /api/bid-opening, /api/evaluation, /api/post-qualification, /api/award, /api/contracts, /api/reports, /api/admin, /api/blockchain
•Middleware pipeline: CORS → Rate Limiter → Auth (JWT verification) → RBAC Check → Request Validator → Controller → Service → Repository → Database
•Business logic isolated in Service layer (testable independently of framework)
•Blockchain integration: Service calls Fabric SDK chaincode functions; event results returned async; stored in PostgreSQL for fast querying; on-chain for immutability
•Bull job queues for: deadline monitoring (every 6 hours), notification dispatch, report generation, blockchain event batch processing

Data Layer
•PostgreSQL — primary relational database; all procurement data, user accounts, document metadata, audit logs
•Redis — session cache, rate limiting counters, job queues (Bull), real-time notification pub/sub
•AWS S3 / MinIO — document file storage (PDFs, DOCX uploads); accessed via pre-signed URLs with 15-minute expiry

Blockchain Layer (Hyperledger Fabric)
•Permissioned network: organization nodes represent the LGU and potentially external oversight bodies
•Chaincode (Smart Contract) functions: recordEvent(), getEventHistory(), verifyDocumentHash(), getAuditTrail()
•Events recorded: APP_APPROVED, PR_ACCEPTED, ITB_POSTED, BID_OPENING_COMPLETED, EVALUATION_COMPLETED, POST_QUAL_COMPLETED, NOA_ISSUED, NTP_ISSUED, CONTRACT_SIGNED, AMENDMENT_APPROVED, CONTRACT_TERMINATED, DOCUMENT_HASH_MISMATCH
•Each block contains: event_type, procurement_id, actor_id, timestamp, document_hash (if applicable), metadata_hash
•PostgreSQL stores a local mirror of blockchain events for fast querying; Fabric is the source of truth for immutability verification

5.3 Database Schema Overview
Core Entities and Key Relationships
Entity (Table)	Key Fields	Relationships
users	user_id, name, email, password_hash, role_id, department_id, status, created_at	belongs to: departments, roles
roles	role_id, role_name, permissions[] (JSONB)	has many: users
departments	dept_id, dept_name, dept_code, head_user_id	has many: users, app_entries, purchase_requisitions
vendors	vendor_id, business_name, type, philgeps_no, tin, email, status, blacklisted, categories[]	has many: bid_submissions, contracts
vendor_documents	doc_id, vendor_id, doc_type, file_path, file_hash, upload_at, expiry_date, status	belongs to: vendors
app_entries	entry_id, dept_id, project_title, category, mode, abc, fund_source, account_code, status, created_by, approved_by, approved_at	has many: purchase_requisitions
purchase_requisitions	pr_id, pr_ref, app_entry_id, dept_id, requester_id, line_items (JSONB), total_value, status, created_at	has many: invitations; belongs to: app_entries
invitations	inv_id, inv_ref, pr_id, mode, type (ITB/RFQ), status, posting_date, submission_deadline, opening_date, philgeps_ref, created_by	has many: bid_submissions; belongs to: purchase_requisitions
rfq_invitations	rfq_inv_id, inv_id, vendor_id, sent_at, read_at, status	belongs to: invitations, vendors
bid_openings	opening_id, inv_id, session_ref, session_date, quorum_confirmed, bac_members_present[], status, closed_at	has many: bid_results, bid_prices
bid_results	result_id, opening_id, vendor_id, doc_type, pass_fail, remarks	belongs to: bid_openings, vendors
bid_prices_as_read	price_id, opening_id, vendor_id, amount_as_read, amount_as_calculated, arithmetic_correction	belongs to: bid_openings, vendors
evaluations	eval_id, opening_id, evaluator_id, vendor_id, tech_items (JSONB), calculated_price, recommendation, submitted_at	belongs to: bid_openings, users, vendors
post_qualifications	pq_id, opening_id, vendor_id, rank, status, result, report_path, completed_at	belongs to: bid_openings, vendors
awards	award_id, opening_id, vendor_id, contract_amount, noa_ref, noa_issued_at, acknowledged_at, status	has one: contract; belongs to: bid_openings, vendors
contracts	contract_id, award_id, vendor_id, pr_id, contract_ref, ntp_date, duration_days, end_date, amount, status, amendments[], extensions[]	has many: inspection_acceptance_reports, invoices
inspection_acceptance_reports	iar_id, contract_id, inspected_by, accepted_by, items (JSONB), accepted_at	belongs to: contracts
invoices	invoice_id, contract_id, iar_id, vendor_id, amount, submitted_at, validated_by, paid_at, status	belongs to: contracts
blockchain_events	event_id, event_type, procurement_id, actor_id, document_hash, block_number, tx_id, recorded_at	references: all procurement entities
audit_logs	log_id, user_id, action, entity_type, entity_id, ip_address, timestamp, old_value (JSONB), new_value (JSONB)	references: users
notifications	notif_id, recipient_id, type, title, message, entity_ref, read_at, created_at	belongs to: users

5.4 Security Architecture
Authentication & Session Security
•JWT Access Token: 15-minute expiry; stored in React component state (memory only — not localStorage)
•JWT Refresh Token: 7-day expiry; stored in HttpOnly, Secure, SameSite=Strict cookie
•Token refresh handled transparently by RTK Query base query with automatic retry on 401
•2FA enforced for: System Administrator, HOPE, BAC Chairperson, Finance Officer
•Failed login lockout: 3 attempts → 30-minute lock; 10 attempts → permanent lock requiring Admin unlock
Role-Based Access Control (RBAC)
•Permission check middleware applied to every protected API route
•Permissions stored as JSONB in roles table: {module: {action: boolean}}
•Frontend: usePermissions() hook gates UI element rendering; backend validates all requests independently
•No client-side permission bypass is possible — all business logic enforced server-side
Data Security
•All data in transit: HTTPS/TLS 1.3 enforced via Nginx
•All data at rest: PostgreSQL column-level encryption for sensitive fields (TIN, financial data) using pgcrypto
•Document files: S3 server-side encryption (AES-256); pre-signed URLs with 15-minute expiry
•Password storage: bcrypt with cost factor 12
•Document integrity: SHA-256 hash computed at upload; stored in PostgreSQL and Hyperledger Fabric; verifiable at any time
API Security
•Rate limiting: 100 requests/minute per authenticated user; 20 requests/minute for unauthenticated endpoints
•Input validation: express-validator applied to all request bodies and query parameters
•SQL injection prevention: Prisma ORM parameterized queries exclusively; raw SQL queries prohibited
•XSS prevention: React's built-in escaping + Content Security Policy headers via Nginx
•CORS: restricted to specific allowed origins (LGU domain and development origins only)
•Helmet.js: sets security HTTP headers (X-Frame-Options, HSTS, X-Content-Type-Options)


SECTION 6: DATA FLOW & SYSTEM LOGIC

6.1 Core Data Flow Across Modules
The following describes how data moves through ProcureSeal from initiation to completion, illustrating the entity relationships and handoffs between modules:

Data Flow Step	From Entity	To Entity	Data Passed	Trigger
1. APP Entry → PR	app_entries	purchase_requisitions	entry_id, project_title, abc, mode, fund_source, account_code	Requester selects APP entry in PR form
2. PR → Invitation	purchase_requisitions	invitations	pr_id, pr_ref, project_title, abc, category, mode	Secretariat accepts PR and initiates posting
3. Invitation → Vendor	invitations + rfq_invitations	vendors (notification)	inv_id, project details, deadline, submission link	ITB posted or RFQ sent
4. Vendor → Bid Opening	vendors (document uploads)	bid_openings + bid_results	vendor_id, document hashes, physical bid envelope data	Secretariat encodes during opening session
5. Bid Opening → Evaluation	bid_openings + bid_prices_as_read	evaluations	eligible_vendor_ids, amounts_as_read	Opening session closed; evaluation phase begins
6. Evaluation → Post-Qualification	evaluations	post_qualifications	ranked_vendor_ids[], calculated_prices[]	Evaluation report approved by Chairperson
7. Post-Qualification → Award	post_qualifications	awards	lcrb_vendor_id, contract_amount	BAC Resolution declaring LCRB approved by HOPE
8. Award → Contract	awards	contracts	award_id, vendor_id, contract_amount, ntp_date	HOPE signs NOA and NTP; contract executed
9. Contract → Invoice	contracts + iars	invoices	contract_id, iar_id, accepted_amount	IAR signed; Finance Officer processes invoice
10. Every Critical Step → Blockchain	All modules	blockchain_events	event_type, entity_ids, document_hash, actor_id, timestamp	Automated trigger after each critical action

6.2 Scenario: End-to-End Competitive Bidding for Office Supplies
Scenario Context
The Municipal Health Office (MHO) requires medical supplies worth ₱500,000. This falls under Small Value Procurement (SVP). The scenario traces the complete data flow:
66.Department Requester (MHO) logs in → Creates PR → Links to APP Entry 'Medical Supplies Q2' → Enters 5 line items → Submits for Department Head endorsement.
67.Department Head endorses PR online → PR status changes to PENDING_BUDGET_CERT.
68.Budget Officer certifies fund availability from General Fund → PR status changes to PENDING_SECRETARIAT_REVIEW.
69.BAC Secretariat reviews PR → Confirms mode = SVP (ABC ≤ ₱2M) → Accepts PR → Creates RFQ.
70.Secretariat selects 5 vendors from the vendor registry (matching 'Medical Supplies' category) → System sends RFQ to all 5 via email and in-system notification.
71.3 vendors submit quotations through the vendor portal within the deadline. 2 vendors do not respond.
72.BAC Secretariat initiates 'Quotation Opening' (simplified SVP flow): reviews 3 quotations; identifies lowest compliant quotation.
73.Secretariat generates Canvass Report and Abstract of Quotations → Routes to BAC Chairperson for approval.
74.BAC Chairperson approves → Routes to HOPE for award approval.
75.HOPE approves → System generates Purchase Order (PO) in GPPB template → PO transmitted to winning vendor.
76.Vendor delivers goods → Department Requester creates Inspection and Acceptance Report (IAR) → Signs acceptance.
77.IAR submitted → Finance Officer processes invoice → Payment confirmation recorded in system.
78.All events (RFQ_SENT, QUOTATION_RECEIVED, AWARD_ISSUED, PAYMENT_RECORDED) written to Hyperledger Fabric ledger.

6.3 Blockchain Logic — Chaincode Functions
Chaincode Function	Triggered By	Input Parameters	On-Chain Data Written
recordProcurementEvent()	Node.js backend service after each critical action	event_type, procurement_id, actor_id, document_hash, metadata, timestamp	Block with: event_type, procurement_id, actor_id, document_hash, tx_timestamp, tx_id
verifyDocumentHash()	Secretariat or observer triggers hash verification	doc_id, current_file_hash	Query only — returns original_hash vs. current_hash; no new block written
getProcurementAuditTrail()	COA Observer, HOPE, or System Admin requests audit trail	procurement_id	Returns ordered list of all events for that procurement from ledger
getActorHistory()	Internal audit or investigation query	actor_id, date_range	Returns all actions performed by a specific user across all procurements
declareDocumentTampered()	Auto-triggered by hash mismatch detection	doc_id, procurement_id, detected_by	Alert block written: event=DOCUMENT_TAMPERED; triggers mandatory investigation flag

6.4 Automated Deadline Enforcement Logic
ProcureSeal runs a background deadline monitoring job every 6 hours using Bull + Redis. The job queries all active procurements and checks each against a deadline matrix derived from RA 12009 IRR timelines:
Deadline Event	Alert at 75%	Alert at 90%	Alert at 100% (Breach)	Notified Parties
Minimum Advertisement Period	Day of 75% elapsed	Day of 90% elapsed	Day advertisement period ends (auto-unlock opening)	Secretariat
Bid Submission Deadline	3 days before	1 day before	Day of deadline (system locks new submissions)	Secretariat, Vendors
Post-Qualification Submission (5 days)	Day 3	Day 4	Day 5 (results due)	Secretariat, BAC Chair
NOA Acknowledgment (3 days)	N/A	Day 2	Day 3 (escalation to HOPE)	Secretariat, HOPE
Performance Security Submission (10 days)	Day 7	Day 9	Day 10 (breach alert)	Secretariat, HOPE, Vendor
Contract Signing Deadline (10 days)	Day 7	Day 9	Day 10 (breach — re-award triggered)	Secretariat, HOPE
Contract Implementation Milestone	3 days before milestone	1 day before	Milestone date passed	Requester, Secretariat, HOPE
Document Expiry (Vendor)	30 days before expiry	7 days before expiry	On expiry date (document auto-flagged)	Vendor, Secretariat


SECTION 7: IMPLEMENTATION PLAN

7.1 Development Methodology
ProcureSeal follows an Agile-Scrum development methodology adapted for academic capstone constraints. Development is organized into 5 Sprints, each 3 weeks long, for a total of 15 weeks (approximately one semester). A Sprint 0 (Setup) precedes the main development sprints.

Sprint	Duration	Focus Area	Key Deliverables
Sprint 0 — Setup	Week 1	Environment setup, architecture decisions, design system	Dev environment, database schema v1, React scaffold, design tokens, API structure
Sprint 1 — Core Foundation	Weeks 2–4	Authentication, User Management, APP Module, PR Module	Login/2FA, role-based routing, RBAC middleware, APP CRUD, PR workflow (create → DH → Budget → Secretariat)
Sprint 2 — Bidding Operations	Weeks 5–7	Invitation/Advertisement, Bidder Management, Bid Opening	ITB creation/posting, RFQ workflow, Vendor portal (registration + document upload), Pre-screening, Bid Opening Session
Sprint 3 — Evaluation & Award	Weeks 8–10	Evaluation, Post-Qualification, Award, Blockchain Integration	Evaluation forms, Abstract generation, Post-qual workflow, NOA/NTP generation, Hyperledger Fabric basic integration
Sprint 4 — Contract & Finance	Weeks 11–12	Contract Management, Finance Module, Reporting	Contract dashboard, amendments, IAR, invoice processing, procurement reports, analytics dashboards
Sprint 5 — Security, QA & Polish	Weeks 13–15	Security hardening, testing, bug fixes, documentation, deployment	Penetration testing checklist, unit & integration tests, user acceptance testing, deployment to staging, final documentation

7.2 Milestone Tracker
Milestone	Target Week	Acceptance Criteria
M1: System Login + RBAC Working	Week 3	All 12 roles can log in; each sees only their assigned sidebar and routes; 2FA functional for privileged roles
M2: PR Workflow Complete	Week 4	PR can be created, submitted, endorsed, budget-certified, and accepted by Secretariat; all status transitions work; notifications sent
M3: Competitive Bidding Posting Live	Week 6	ITB can be created, approved by Chairperson, published to public portal; minimum date constraints enforced; vendor notification sent
M4: Bid Opening Session Functional	Week 7	Full bid opening session can be conducted digitally; quorum enforcement works; Abstract of Bids As Read auto-generated; blockchain event recorded
M5: Full Competitive Bidding Cycle	Week 10	Complete Competitive Bidding from PR to NOA issuance works end-to-end in the system with all blockchain events recorded
M6: SVP and Direct Acquisition Cycles	Week 11	SVP (RFQ → Quotation → Canvass → PO) and Direct Acquisition (simplified) workflows functional
M7: Contract Management Live	Week 12	Contract can be created, monitored, amended; IAR processed; invoice submitted; payment recorded
M8: System Testing Complete	Week 14	All unit and integration tests passing; security audit checklist complete; UAT conducted with simulated users
M9: Final Deployment	Week 15	System deployed to staging server; all documentation finalized; capstone defense materials prepared

7.3 Risk Register
Risk ID	Risk Description	Likelihood	Impact	Mitigation Strategy
R-01	Hyperledger Fabric setup complexity exceeds timeline	High	High	Use pre-configured Fabric test network for development; integrate Fabric after core app is functional in Sprint 3; consider simplified hash-based audit log as fallback
R-02	RA 12009 IRR timeline rules are misinterpreted	Medium	High	Validate all deadline calculations against official GPPB IRR document; have legal/procurement expert review workflow before implementation
R-03	Vendor portal adoption resistance	Medium	Medium	Design vendor portal to be mobile-responsive and intuitive; provide step-by-step onboarding guide; physical submission still supported as fallback
R-04	Scope creep across 11 procurement modes	High	Medium	Prioritize Competitive Bidding and SVP (most common modes) for full implementation; remaining 9 modes implemented as simplified workflows in Sprint 4–5
R-05	Real-time bid opening feature performance under concurrent users	Low	High	Load test bid opening Socket.IO implementation with concurrent connections; implement Redis pub/sub for scalable real-time messaging
R-06	Data migration from legacy paper-based records	Medium	Low	Out of scope for capstone; system designed to start fresh from new fiscal year; migration module flagged as future enhancement
R-07	PhilGEPS API unavailability for real-time verification	High	Medium	System accepts manual PhilGEPS reference number entry; automated API verification flagged as future enhancement; no blocking dependency
R-08	Academic timeline insufficient for full feature set	Medium	High	Clear priority matrix: core procurement workflow > alternative modes > advanced analytics; progressive delivery ensures usable system at each milestone

7.4 KPIs — System Performance Metrics
KPI Category	KPI Name	Target / Benchmark	Measurement Method
Compliance	RA 12009 Deadline Compliance Rate	≥ 95% of procurements complete each phase within legal timeframes	Automated comparison of actual step timestamps vs. computed legal deadline
Compliance	Failed Bidding Rate	Monitor and compare with pre-system baseline	Count of Failure of Bidding declarations / total procurements initiated
Efficiency	Average PR-to-Posting Time	Target: ≤ 7 working days	Date difference: PR submission → ITB/RFQ posting date
Efficiency	Average Bidding-to-Award Time	Target: ≤ 30 working days for Competitive Bidding	Date difference: Bid Opening → NOA issuance date
Transparency	Audit Trail Completeness	100% of critical events blockchain-recorded	Count of procurements with complete blockchain event log / total completed procurements
Security	Document Tamper Detection Rate	0 undetected tampering events	Count of hash mismatch alerts generated / total documents verified
Vendor	Vendor Portal Adoption Rate	≥ 70% of invited vendors use the portal	Count of vendors submitting via portal / total invited vendors
Vendor	Average Vendor Pre-Screening Completion Time	≤ 2 working days before opening	Date difference: Secretariat pre-screening completed → Bid Opening date
System	System Uptime	≥ 99.5% during business hours (8 AM – 5 PM)	Server monitoring (Uptime Robot or equivalent)
System	Average API Response Time	≤ 500ms for 95th percentile	Application Performance Monitoring (APM) tool
Finance	Invoice-to-Payment Processing Time	≤ 5 working days from IAR acceptance	Date difference: IAR signing → payment recording

7.5 Limitations
•ProcureSeal does not process actual financial payments or disbursements — it records payment confirmations but does not interface with banking systems or government e-payment platforms.
•PhilGEPS API integration is not implemented in the initial version — PhilGEPS reference numbers are entered manually by the Secretariat.
•Electronic signatures in ProcureSeal are implemented as JWT-verified digital confirmations (identity-binding digital signatures), not legally-equivalent e-signatures under Philippine law (RA 8792). The system is designed to complement physical document signing, not replace it.
•The blockchain layer (Hyperledger Fabric) requires dedicated server infrastructure. Deployment on a single server is possible for development but production deployment requires proper node configuration.
•The system does not include GPS or IoT-based delivery tracking for contract implementation.
•COA and GPPB observer accounts are provisioned manually by the System Administrator; no external SSO integration with COA or GPPB systems is implemented.

7.6 Future Improvements
•PhilGEPS API Integration: Real-time posting to PhilGEPS directly from ProcureSeal; automatic retrieval of PhilGEPS certificate data for vendor verification.
•Mobile Application: Native iOS/Android app for Department Requesters and Vendors to submit PRs, track procurement status, and submit invoices from mobile devices.
•AI-Powered Price Benchmarking: Machine learning model trained on historical procurement data to suggest reasonable unit cost estimates during PR creation and flag anomalous bid prices during evaluation.
•COA / DBM System Integration: Direct data sharing with Commission on Audit and Department of Budget and Management systems for real-time financial oversight.
•Supplier Performance Scoring (Full Merchant Ranking): Comprehensive supplier performance tracking across contracts (delivery compliance, quality scores, payment dispute history) to inform future bidder selection.
•Data Migration Tool: Batch import module to digitize historical procurement records from manual files into ProcureSeal's database.
•Multi-LGU / Multi-Tenant Architecture: Scale ProcureSeal to serve multiple LGUs within a province under a single platform instance with complete data isolation per LGU.
•Advanced Analytics and Predictive Dashboards: Procurement spend forecasting, trend analysis by category and vendor, and automated anomaly detection for red-flag transactions.


GLOSSARY OF TERMS

Term / Acronym	Definition
ABC	Approved Budget for the Contract — the maximum amount approved for a specific procurement project
APP	Annual Procurement Plan — the consolidated plan of all projected procurement activities of a procuring entity for the fiscal year
BAC	Bids and Awards Committee — the body responsible for conducting all procurement activities of the procuring entity
Blockchain	A distributed, decentralized, immutable digital ledger that records transactions in a sequence of cryptographically linked blocks
COA	Commission on Audit — the supreme audit institution of the Philippines responsible for auditing government accounts
GPPB	Government Procurement Policy Board — the interagency body that oversees government procurement policy in the Philippines
HOPE	Head of Procuring Entity — the highest official of the procuring entity; has final approval authority in procurement
Hyperledger Fabric	An enterprise-grade permissioned blockchain framework hosted by the Linux Foundation; used as ProcureSeal's blockchain layer
IAR	Inspection and Acceptance Report — document certifying that delivered goods or services were inspected and accepted
ITB	Invitation to Bid — the public advertisement calling for competitive bids for a specific procurement project
JWT	JSON Web Token — a compact, self-contained means of securely transmitting information between parties as a JSON object
LCB	Lowest Calculated Bid — the eligible bid with the lowest calculated price after arithmetic correction
LCRB	Lowest Calculated Responsive Bid — the LCB that has passed post-qualification evaluation
NOA	Notice of Award — the official document informing the winning bidder that they have been awarded the contract
NTP	Notice to Proceed — the official document directing the winning bidder to commence contract implementation
PhilGEPS	Philippine Government Electronic Procurement System — the mandatory online portal for government procurement transactions
PO	Purchase Order — a commercial document issued by the procuring entity to a vendor authorizing a purchase
PR	Purchase Requisition — an internal document requesting the procurement of goods, services, or works
RBAC	Role-Based Access Control — a security approach that restricts system access based on defined user roles
RFQ	Request for Quotation — a document sent to suppliers asking them to submit their price quotations
SHA-256	Secure Hash Algorithm 256-bit — a cryptographic hash function that produces a unique 256-bit digital fingerprint of any document
SVP	Small Value Procurement — an alternative procurement mode for low-value goods and services below the competitive bidding threshold
TWG	Technical Working Group — a body of technical experts assisting the BAC in evaluating technical aspects of bids

