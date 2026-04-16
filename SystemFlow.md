
## USER ROLES (12 total)
1. System Administrator
2. HOPE (Head of Procuring Entity / Mayor)
3. BAC Chairperson
4. BAC Member (minimum 3 for quorum)
5. BAC Secretariat
6. TWG Member (Technical Working Group)
7. Department Requester
8. Budget Officer
9. Finance Officer
10. Vendor / Supplier
11. COA / GPPB Observer (read-only)
12. Internal Auditor

---

## THE 11 PROCUREMENT MODES UNDER RA 12009

The system must support all 11 modes. The general rule:
Competitive Bidding is the DEFAULT. All other modes are ALTERNATIVE and 
require justification + HOPE approval before use.

### MODE 1: COMPETITIVE BIDDING
- Threshold: NONE (can be used for any ABC amount)
- Default mode for all procurement
- Full public advertisement required (PhilGEPS + LGU website + bulletin board)
- Complete lifecycle: APP → PR → ITB → Eligibility Check → Bid Opening → 
  Evaluation → Post-Qualification → Award → Contract
- Award criterion: LCRB (Lowest Calculated Responsive Bid) for goods/works,
  HRRB (Highest Rated Responsive Bid) for consulting, or MEARB where applicable

### MODE 2: LIMITED SOURCE BIDDING
- Threshold: NONE
- Used when: goods/services are highly specialized, only few suppliers known
- BAC prepares shortlist of qualified suppliers
- Requires HOPE approval of shortlist before invitations are sent
- Competitive evaluation among shortlisted invitees only
- Same evaluation and award steps as Competitive Bidding but closed to shortlist

### MODE 3: COMPETITIVE DIALOGUE
- Threshold: NONE
- Used when: complex, innovative, or high-risk projects where technical 
  solutions are not yet clearly defined (ICT systems, new technology, PPP)
- TWO STAGES:
  Stage 1 (Dialogue): Procuring entity engages pre-qualified participants 
    to refine requirements. Each participant's solution is kept confidential.
  Stage 2 (Final Bidding): After dialogue concludes, final bids are submitted
    based on refined specifications
- Requires clear justification of complexity
- Equal treatment of all participants throughout

### MODE 4: UNSOLICITED OFFER WITH BID MATCHING
- Threshold: NONE
- Initiated by a PRIVATE PROPONENT'S unsolicited proposal (not from the agency)
- Used when: proposal introduces new technology, innovation, or unique solution
  not in the APP
- FLOW:
  1. Private proponent submits unsolicited offer
  2. Government evaluates completeness and compliance of proposal
  3. Government invites comparative/competitive bids from other suppliers
  4. Original proponent has RIGHT TO MATCH the best competitive bid
  5. If original proponent matches → awarded to original proponent
  6. If no comparative bid received within prescribed period → awarded to 
     original proponent
- Requires full transparency and publication

### MODE 5: DIRECT CONTRACTING
- Threshold: NONE
- Used when: item is proprietary/patented, exclusive dealer, or critical 
  compatibility with existing government equipment
- NO public bidding — direct engagement with single supplier
- Requires:
  * Proof of exclusivity or patent
  * Price reasonableness verification
  * Certification of availability from supplier
  * HOPE approval
- Blockchain records: justification, HOPE approval, price negotiation

### MODE 6: DIRECT ACQUISITION
- Threshold: UP TO ₱200,000 ABC (adjustable by GPPB)
- Simplest mode — direct purchase without formal canvassing
- Used for: minor purchases, items not in PS-DBM catalog, routine low-value needs
- Must still be in the APP
- STRICTLY NO splitting of contracts to circumvent threshold
- Requires: price reasonableness documentation, proper documentation
- Blockchain records: justification, price docs, HOPE/authorized official approval

### MODE 7: SMALL VALUE PROCUREMENT (SVP)
- Threshold: UP TO ₱2,000,000 ABC (LGU thresholds may vary by income class)
- Uses Request for Quotation (RFQ) instead of full ITB
- MINIMUM of 3 vendors must receive RFQ
- Simplified evaluation: lowest price or best value
- No public advertisement required — direct vendor invitations
- STRICTLY NO splitting of contracts
- Requires: fund availability certification
- FLOW: PR → RFQ to ≥3 vendors → Quotation Submission → Canvass/Evaluation →
  Abstract of Quotations → Chairperson Approval → HOPE Award → Purchase Order

### MODE 8: REPEAT ORDER
- Threshold: UP TO 25% of the ORIGINAL CONTRACT QUANTITY
- Used to replenish goods previously procured through competitive bidding
- Conditions:
  * Same or LOWER unit price as original contract
  * Must be within 6 MONTHS from original Notice to Proceed (NTP) date
  * No splitting allowed
  * HOPE approval required
- System must link Repeat Order to the original procurement record
- Blockchain records: original contract reference, price comparison, NTP date check

### MODE 9: NEGOTIATED PROCUREMENT
- Threshold: NONE (no fixed threshold)
- Used ONLY under exceptional circumstances:
  * After TWO failed competitive biddings for the same procurement
  * Emergency cases (calamity, imminent danger to life/property)
  * Take-over of contracts (when original contractor defaults)
  * Adjacent or contiguous projects
  * Lease of real property
- Requires:
  * Specific justification citing the applicable ground
  * Price negotiation must still ensure reasonableness
  * Full BAC documentation
  * HOPE approval
- System tracks the ground used and links to prior failed bidding records if applicable

### MODE 10: DIRECT SALES
- Threshold: NONE (no specific amount limit)
- Used when: item was previously and successfully procured by ANOTHER 
  government agency from the same supplier
- Conditions:
  * Same technical specifications
  * Price NOT HIGHER than the other agency's original contract price
  * Procurement must be within 6 MONTHS of the other agency's contract
  * Certification from the end-user agency required
- System records: reference agency, reference contract, price comparison evidence

### MODE 11: DIRECT PROCUREMENT FOR SCIENCE, TECHNOLOGY AND INNOVATION (STI)
- Threshold: NONE (no fixed threshold)
- Special mode to support R&D, startups, and innovation-driven projects
- Used for: research and development, pre-commercial goods, procurement from 
  qualified startups or innovators
- Requires:
  * Project must be classified as STI-related
  * Endorsement by appropriate technical body (DOST or equivalent)
  * Documentation of innovation benefit to government
  * Compliance with IRR safeguards
- Blockchain records: STI classification, endorsement documents, innovation justification

---

## MODE SELECTION LOGIC (implement in BAC Secretariat's PR acceptance step)

When Secretariat accepts a PR and assigns procurement mode, the system enforces:

IF abc > 2,000,000:
  → DEFAULT to Competitive Bidding
  → Any alternative mode requires written justification + HOPE approval task
  → System blocks progression until HOPE approves the alternative mode

IF abc ≤ 2,000,000 AND abc > 200,000:
  → SUGGEST Small Value Procurement (SVP)
  → Competitive Bidding also valid
  → Alternative modes require justification

IF abc ≤ 200,000:
  → SUGGEST Direct Acquisition
  → SVP also valid
  → Competitive Bidding also valid

SPECIAL CASES (system checks these conditions and suggests the mode):
  → Repeat Order: system detects if same item was procured before; prompts Secretariat
  → Negotiated Procurement: system detects if 2 prior failed biddings exist for same PR
  → Direct Contracting: Secretariat must manually select + justify + attach exclusivity proof
  → Limited Source Bidding: Secretariat must manually select + justify + submit shortlist
  → Competitive Dialogue: Secretariat must manually select + attach complexity justification
  → Unsolicited Offer: initiated differently — from Vendor portal, not from a PR
  → Direct Sales: Secretariat must attach reference agency + reference contract
  → Direct Procurement for STI: must attach DOST/technical body endorsement

---

## THE COMPLETE PROCUREMENT FLOW

### ═══ STAGE 0: ANNUAL PROCUREMENT PLAN (APP) ═══

Actors: Department Requester → BAC Secretariat → Budget Officer → HOPE

STEP 1 — Department Requester creates APP Entry:
  Fields: project_title, description, mfo_id, pap_code, uacs_object_code,
    approved_budget_reference, category [Goods/Services/Works/Consulting],
    procurement_mode (suggested based on ABC), abc, unit, quantity,
    fund_source, account_code, implementing_unit,
    target_start_quarter, target_completion_quarter, justification
  Status: APP_DRAFT
  Rules:
    - Auto-save draft every 2 minutes
    - Mode recommendation tooltip shown based on ABC amount
    - If alternative mode selected → justification field becomes mandatory
    - ABC must be > 0
    - Target completion quarter must be ≥ target start quarter

STEP 2 — Requester submits:
  Status: APP_PENDING_CONSOLIDATION
  Blockchain event: APP_ENTRY_SUBMITTED
  Notification: BAC Secretariat

STEP 3 — BAC Secretariat consolidates all submissions:
  - Reviews each entry for completeness
  - Can return with remarks → APP_RETURNED (notification to Requester)
  - Accepts → APP_PENDING_BUDGET_CERT
  - Consolidates all accepted entries into draft APP document

STEP 4 — Budget Officer certifies each entry:
  Inputs: fund_source, account_code, available_amount confirmation
  Status: APP_PENDING_HOPE_APPROVAL
  Blockchain event: APP_BUDGET_CERTIFIED (timestamp, officer_id, amount)

STEP 5 — HOPE approves or returns:
  APPROVE → Status: APP_APPROVED (LOCKED, IMMUTABLE)
    Blockchain event: APP_APPROVED
    APP published to public transparency dashboard
  RETURN → Status: APP_RETURNED with mandatory remarks

RULES:
  - No PR can be created unless linked APP entry = APP_APPROVED
  - Mid-year additions: APP_SUPPLEMENTAL follows same workflow, versioned

---

### ═══ STAGE 1: PURCHASE REQUISITION (PR) ═══

Actors: Department Requester → Department Head → Budget Officer → BAC Secretariat

STEP 1 — Department Requester creates PR:
  PR Reference: PR-[YEAR]-[DEPT_CODE]-[SEQ]  e.g. PR-2025-MHO-0042
  Fields: app_entry_id (must = APP_APPROVED), per-line-item [description,
    unit_of_measure, quantity, estimated_unit_cost, estimated_total_cost(auto)],
    purpose, technical_specifications, date_required, urgency_level
  Status: PR_DRAFT
  Rules:
    - Total PR value must NOT exceed remaining ABC of linked APP entry
    - Remaining ABC indicator shown in real-time
    - Date required must be ≥ 15 calendar days from submission date
    - If urgency = EMERGENCY → mandatory justification text (min 100 chars)
    - Auto-save draft every 2 minutes

STEP 2 — Requester submits:
  Status: PR_PENDING_DH_ENDORSEMENT
  Notification: Department Head

STEP 3 — Department Head endorses:
  Status: PR_PENDING_BUDGET_CERT
  Notification: Budget Officer

STEP 4 — Budget Officer certifies:
  Inputs: fund_source, account_code confirmation
  Creates SOFT BUDGET RESERVATION in Budget Register
  Status: PR_PENDING_SECRETARIAT_REVIEW
  Notification: BAC Secretariat

STEP 5 — BAC Secretariat accepts and assigns mode:
  - Confirms alignment with approved APP entry
  - Assigns procurement mode (system suggests based on ABC, enforces rules above)
  - If alternative mode: creates HOPE approval task before proceeding
  Status: PR_ACCEPTED
  Blockchain event: PR_ACCEPTED (pr_ref, mode, abc, actor_id, timestamp)

STATUS LIFECYCLE:
  PR_DRAFT → PR_PENDING_DH_ENDORSEMENT → PR_PENDING_BUDGET_CERT →
  PR_PENDING_SECRETARIAT_REVIEW → PR_ACCEPTED
  At any stage: PR_RETURNED (with remarks) or PR_CANCELLED (with reason)

RULES:
  - PR cannot be modified after PR_ACCEPTED
  - Cancelled PRs release the soft budget reservation

---

### ═══ STAGE 2: INVITATION / ADVERTISEMENT ═══

The flow branches here depending on the procurement mode assigned.

━━━ PATH A: COMPETITIVE BIDDING ━━━
Actors: BAC Secretariat → BAC Chairperson → Public + All Registered Vendors

STEP 1 — BAC Secretariat creates Invitation to Bid (ITB):
  ITB Reference: ITB-[YEAR]-[SEQ]  e.g. ITB-2025-0015
  Auto-filled from PR: project_title, abc, fund_source, mode
  Manual inputs: bid_document_cost, eligibility_check_date,
    pre_bid_conference_date (MANDATORY if ABC ≥ ₱1,000,000),
    bid_submission_deadline, bid_opening_date_time, bid_opening_venue,
    contact_person, contact_email, philgeps_ref (entered after posting)
  Status: ITB_DRAFT
  Rules (RA 12009 IRR minimum periods — date picker enforces these):
    - Goods < ₱5M: minimum 7 days advertisement
    - Infrastructure < ₱5M: minimum 14 days
    - Goods/Infra ≥ ₱5M: minimum 30 days
    - Pre-bid conference date: ≥ 12 days after posting
    - Pre-bid conference date: ≥ 12 days before bid submission deadline
    - Bid opening date: same day as OR after bid submission deadline
    - Dates on non-working days or PH public holidays: blocked

STEP 2 — Secretariat submits for Chairperson approval:
  Status: ITB_PENDING_CHAIRPERSON_APPROVAL
  Notification: BAC Chairperson

STEP 3 — BAC Chairperson approves:
  Status: ITB_APPROVED
  Blockchain event: ITB_APPROVED (document_hash, chairperson_id, timestamp)

STEP 4 — Secretariat posts ITB to 3 channels (all 3 required):
  □ PhilGEPS (manual reference number entered after posting)
  □ LGU Public Portal (system auto-generates public announcement page)
  □ Physical Bulletin Board (system generates printable PDF)
  Status: ITB_POSTED
  Advertisement countdown timer begins
  Blockchain event: ITB_POSTED (document_hash, posting_date, actor_id)
  Notifications: All registered vendors in matching procurement category

STEP 5 — System enforces minimum advertisement period:
  "Open Bid Submissions" LOCKED until advertisement period fully elapses
  At expiry: status auto-unlocks to ITB_OPEN_FOR_BIDS
  Notifications: Vendors reminded 3 days and 1 day before submission deadline

━━━ PATH B: SMALL VALUE PROCUREMENT (SVP) ━━━
Actors: BAC Secretariat → Vendors (minimum 3)

STEP 1 — BAC Secretariat creates Request for Quotation (RFQ):
  RFQ Reference: RFQ-[YEAR]-[SEQ]  e.g. RFQ-2025-0088
  Auto-filled from PR: project_title, line_items, abc, specifications
  Manual inputs: quotation_submission_deadline (min 3 business days),
    delivery_schedule, delivery_location, payment_terms
  Vendor selection: system filters registry by matching procurement category
    → Secretariat selects MINIMUM 3 vendors
    → Vendors with SUSPENDED or BLACKLISTED status are excluded
    → All selected vendors must have non-expired eligibility documents

STEP 2 — Secretariat sends RFQ:
  Status: RFQ_SENT
  System sends: in-system notification + email to each selected vendor
  System tracks per-vendor: sent_at, read_at (delivery confirmation), 
    submitted_at, status
  Blockchain event: RFQ_SENT (document_hash, invited_vendors_hashed, timestamp)
  Quotation tracking panel shows real-time status per vendor:
    Sent → Viewed → Quotation Submitted → No Response

STEP 3 — Vendors submit quotations via vendor portal:
  Status per vendor: QUOTATION_SUBMITTED
  System records: submission_timestamp, quoted_price, compliance_notes
  Notifications: 
    - Secretariat alerted as each vendor submits
    - 24-hour reminder to non-responsive vendors before deadline

━━━ PATH C: LIMITED SOURCE BIDDING ━━━
Actors: BAC → HOPE → Shortlisted Suppliers

STEP 1 — BAC prepares shortlist of qualified suppliers:
  Fields: supplier_name, qualification_basis, capability_evidence
  Minimum 3 suppliers on shortlist
  Status: SHORTLIST_PENDING_HOPE_APPROVAL

STEP 2 — HOPE approves shortlist:
  Blockchain event: LIMITED_SOURCE_SHORTLIST_APPROVED
  Status: SHORTLIST_APPROVED

STEP 3 — System sends formal invitation letters ONLY to approved shortlisted suppliers:
  Uses GPPB-prescribed invitation template
  Same evaluation and bid opening steps as Competitive Bidding follow

━━━ PATH D: COMPETITIVE DIALOGUE ━━━
Actors: BAC Secretariat → Pre-qualified Participants → BAC/TWG → Final Bidders

STAGE 1 — DIALOGUE PHASE:
STEP 1 — BAC issues invitation to pre-qualified participants:
  Complexity justification attached, HOPE-approved
  Each participant's solution kept strictly CONFIDENTIAL

STEP 2 — Dialogue sessions conducted:
  BAC/TWG engages each participant separately
  System records: session_date, participants, refined_requirements_per_session
  Equal treatment enforced: same information shared with all participants

STEP 3 — Requirements finalized after dialogue:
  System locks final technical specifications based on dialogue outcomes
  Status: DIALOGUE_COMPLETE → FINAL_BIDDING_OPEN

STAGE 2 — FINAL BIDDING PHASE:
  Same as Competitive Bidding bid opening and evaluation steps

━━━ PATH E: UNSOLICITED OFFER WITH BID MATCHING ━━━
Actors: Private Proponent → BAC/HOPE → Comparative Bidders → Award

STEP 1 — Private Proponent submits unsolicited offer via Vendor Portal:
  Fields: proposal_title, innovation_description, proposed_price,
    technical_solution, compliance_documents
  Status: UNSOLICITED_OFFER_SUBMITTED
  Notification: BAC Secretariat + HOPE

STEP 2 — Government evaluates proposal:
  BAC/TWG reviews completeness and compliance
  HOPE approves to proceed → status: UNSOLICITED_OFFER_ACCEPTED
  If rejected → status: UNSOLICITED_OFFER_REJECTED with grounds

STEP 3 — Government invites comparative/competitive bids:
  Published invitation for comparative offers
  Original proponent notified of invitation

STEP 4 — Bid matching decision:
  If NO comparative bid received within prescribed period:
    → Award directly to original proponent
  If comparative bid received:
    → Original proponent given RIGHT TO MATCH best competitive bid
    → If matches or submits lower → awarded to original proponent
    → If does not match → awarded to best competitive bidder
  Blockchain event: BID_MATCHING_DECISION (outcome, prices, timestamp)

━━━ PATH F: DIRECT CONTRACTING ━━━
Actors: BAC Secretariat → HOPE → Single Supplier

STEP 1 — Secretariat documents justification:
  Fields: exclusivity_basis [Proprietary/Patent/Compatibility],
    exclusivity_proof_document, supplier_name, estimated_price
  Status: DIRECT_CONTRACT_PENDING_HOPE_APPROVAL

STEP 2 — HOPE approves:
  Blockchain event: DIRECT_CONTRACT_APPROVED (justification_hash, hope_id)

STEP 3 — BAC directly negotiates with single supplier:
  Price reasonableness verification documented
  Supplier certification of availability attached
  Proceeds to Award → Contract stages

━━━ PATH G: DIRECT ACQUISITION ━━━
Actors: BAC Secretariat → Authorized Approving Official

STEP 1 — Secretariat documents the purchase:
  Fields: item_description, quantity, unit_cost, total_cost (must ≤ ₱200,000),
    supplier_name, price_reasonableness_basis
  System checks: total does NOT exceed ₱200,000
  System checks: no contract splitting detected (same item + same period flags)

STEP 2 — Authorized official approves:
  Blockchain event: DIRECT_ACQUISITION_APPROVED
  Proceeds directly to Purchase Order issuance

━━━ PATH H: REPEAT ORDER ━━━
Actors: BAC Secretariat → HOPE

STEP 1 — Secretariat initiates Repeat Order:
  System requires: link to ORIGINAL procurement record
  System auto-checks:
    □ Repeat quantity ≤ 25% of original contract quantity
    □ Current date is within 6 months of original NTP date
    □ Proposed price ≤ original contract unit price
  If any check fails → system BLOCKS repeat order with specific reason

STEP 2 — HOPE approves:
  Blockchain event: REPEAT_ORDER_APPROVED (original_contract_ref, quantity, price)
  Proceeds to Purchase Order issuance to original winning supplier

━━━ PATH I: NEGOTIATED PROCUREMENT ━━━
Actors: BAC → HOPE

STEP 1 — Secretariat documents justification:
  Ground selection (MANDATORY, one of):
    □ Two failed biddings (system auto-links to failed bidding records)
    □ Emergency / Calamity
    □ Contract take-over (defaulting contractor)
    □ Adjacent or contiguous project
    □ Lease of real property
  Status: NEGOTIATED_PENDING_HOPE_APPROVAL
  If ground = "Two Failed Biddings" → system validates 2 Failure of Bidding 
    records exist for the same procurement before allowing this mode

STEP 2 — HOPE approves:
  Blockchain event: NEGOTIATED_PROCUREMENT_APPROVED (ground, hope_id)

STEP 3 — BAC negotiates with supplier(s):
  Price negotiation documented
  Price reasonableness verified
  Proceeds to Award → Contract stages

━━━ PATH J: DIRECT SALES ━━━
Actors: BAC Secretariat → HOPE

STEP 1 — Secretariat documents reference:
  Fields: reference_agency_name, reference_contract_number,
    reference_contract_price, reference_contract_date,
    end_user_certification_document
  System checks: current date ≤ reference_contract_date + 6 months
  System checks: proposed price ≤ reference_contract_price

STEP 2 — HOPE approves:
  Blockchain event: DIRECT_SALES_APPROVED
  Proceeds to Purchase Order issuance

━━━ PATH K: DIRECT PROCUREMENT FOR STI ━━━
Actors: BAC Secretariat → Technical Body → HOPE

STEP 1 — Secretariat documents STI classification:
  Fields: sti_project_description, innovation_benefit, startup_supplier_name,
    technical_body_endorsement_document (DOST or equivalent),
    pre_commercial_justification
  Status: STI_PENDING_TECHNICAL_ENDORSEMENT

STEP 2 — Technical body endorsement logged:
  Status: STI_PENDING_HOPE_APPROVAL

STEP 3 — HOPE approves:
  Blockchain event: STI_PROCUREMENT_APPROVED (endorsement_hash, hope_id)
  Proceeds to negotiation and Award → Contract stages

---

### ═══ STAGE 3: VENDOR / BIDDER MANAGEMENT ═══

Actors: BAC Secretariat (creates vendor account) → Vendor (logs in)

NOTE: In ProcureSeal, vendors do NOT self-register freely. The BAC Secretariat
physically evaluates the vendor offline, then creates the vendor's system account
and generates a temporary password. The vendor logs in and must immediately 
change their password.

STEP 1 — BAC Secretariat registers vendor:
  Fields: business_name, business_type [Sole Proprietorship/Partnership/
    Corporation/Joint Venture], dti_sec_cda_number, philgeps_number (7 digits),
    tin (format: 000-000-000-000), registered_address, contact_person,
    contact_email, contact_mobile, procurement_categories[]
  System auto-checks: GPPB debarment/blacklist by business_name + TIN
    → If match found: account flagged BLACKLISTED, Secretariat alerted
    → Blacklisted vendors CANNOT proceed
  System generates: username (from business name), temporary_password (random)
  Account status: ACTIVE (immediately usable)
  Secretariat physically hands or sends credentials to vendor

STEP 2 — Vendor logs in with temporary credentials:
  System detects: is_temporary_password = true
  Mandatory password change screen shown BEFORE any other action
  After password change: vendor lands on Vendor Dashboard

STEP 3 — Vendor uploads eligibility documents:
  Required documents:
    □ DTI/SEC/CDA Registration Certificate
    □ Mayor's Permit / Business Permit
    □ Tax Clearance (BIR-issued)
    □ PhilGEPS Registration Certificate (Gold or Platinum)
    □ Audited Financial Statements (most recent)
    □ PCAB License (for infrastructure works only)
    □ Statement of Ongoing Contracts (notarized)
    □ Statement of Single Largest Completed Contract (SLCC)
  Each file: PDF only, max 25MB
  System: computes SHA-256 hash per file at upload
  Blockchain event: per file → VENDOR_DOCUMENT_UPLOADED (doc_type, hash, vendor_id)

STEP 4 — BAC Secretariat pre-screens uploaded documents:
  For each document: mark Complete / Incomplete / Expired / Defective
    → Remarks MANDATORY if not Complete
  Hash Verification button: checks current file SHA-256 vs. blockchain-recorded hash
    → MATCH ✅: document valid
    → MISMATCH ❌: CRITICAL ALERT to BAC Chairperson + System Admin
       Blockchain event: DOCUMENT_HASH_MISMATCH (automatic, with alert)
  Overall pre-screening result: 
    Pre-Screened Complete / Pre-Screened with Deficiencies / Pre-Screened Incomplete
  Blockchain event: PRESCREENING_COMPLETED (vendor_id, procurement_id, result)
  NOTE: Pre-screening is ADVISORY only — formal eligibility is determined 
    on bid opening day with original physical documents

---

### ═══ STAGE 4: BID OPENING SESSION ═══

Actors: BAC Secretariat (facilitates) + BAC Members (quorum) + BAC Chairperson
        + TWG (observers) + COA/GPPB Observers (read-only)
        + Vendors (physically present for physical document submission)

APPLICABLE MODES: Competitive Bidding, Limited Source Bidding, Competitive Dialogue

STEP 1 — BAC Secretariat opens Bid Opening Session:
  Session Reference: BOS-[ITB_REF]-[DATE]  e.g. BOS-ITB-2025-0015-20250315
  System requires: quorum confirmation BEFORE session can start
    → Each BAC member clicks "Confirm Attendance" individually
    → MINIMUM 3 BAC members must confirm
    → Start button remains DISABLED until ≥3 confirmed
  Observers recorded: COA, GPPB, others (names logged for minutes)
  Bidder attendance recorded: Present / Absent per expected bidder
  Blockchain event: BID_OPENING_SESSION_STARTED (quorum_members[], timestamp)

STEP 2 — Eligibility Check (First Envelope):
  For each bidder present:
    Per required document: Pass / Fail radio button
      → FAIL requires: specific reason (e.g., "Mayor's Permit: Expired — 2024-01-15")
    Overall eligibility: Pass (all documents passed) / Fail (any document failed)
  Eligible bidder counter updates in real-time
  If ≤ 1 bidder remains eligible:
    → System auto-prompts: "Insufficient competition — declare Failure of Bidding?"

STEP 3 — Financial Bid Recording (Second Envelope — eligible bidders only):
  For each ELIGIBLE bidder:
    Enter Bid Price As Read (exact amount from physical sealed envelope)
    Amount formatted as Philippine Peso in real-time
  System validates: no blank amounts for eligible bidders

STEP 4 — Generate Abstract of Bids As Read:
  Auto-generated from recorded bid prices
  Displayed in preview pane before finalization
  Document stored with SHA-256 hash

STEP 5 — Close Session:
  Final confirmation dialog before closing
  All entries LOCKED after close — no edits possible
  System generates: Session Minutes (auto-populated from session data)
  Blockchain event: BID_OPENING_COMPLETED (abstract_hash, bac_signatures[], 
    session_timestamp, observer_acknowledgments[])

SPECIAL CASES:
  POSTPONEMENT: 
    → Must be before session starts
    → Requires: reason + new opening date + HOPE approval
    → All registered bidders auto-notified of schedule change
    → Blockchain event: BID_OPENING_POSTPONED

  FAILURE OF BIDDING:
    → Declared when: no bidder appears, all fail eligibility, 
      only 1 eligible bidder (insufficient competition), or no valid bids
    → Grounds must be selected from RA 12009-prescribed list
    → Blockchain event: FAILURE_OF_BIDDING_DECLARED (grounds, procurement_id)
    → System automatically prompts: Re-bidding or Alternative Mode selection
    → If this is the SECOND failure → system suggests Negotiated Procurement

---

### ═══ STAGE 5: BID EVALUATION ═══

Actors: BAC Members + TWG → BAC Chairperson

APPLICABLE MODES: Competitive Bidding, Limited Source Bidding, Competitive Dialogue

STEP 1 — Technical Evaluation:
  For each ELIGIBLE bidder:
    Per technical specification item: Compliant / Non-Compliant
      → Non-Compliant requires: specific remarks per item
    Overall technical assessment: Responsive / Non-Responsive
  All BAC evaluators must complete individual evaluations
  System tracks: "X of Y evaluators have completed evaluation"

STEP 2 — Financial Evaluation:
  For each technically RESPONSIVE bidder:
    Bid Price As Calculated (apply arithmetic corrections if needed)
      → If Calculated ≠ As-Read: arithmetic correction details MANDATORY
    System auto-ranks: ascending order of Calculated Price (goods/works)
      or descending score (consulting services)
    MANUAL RANKING OVERRIDE: NOT ALLOWED — system computes rank automatically
  Generate Abstract of Bids As Calculated:
    Table: Rank | Bidder Name | Calculated Price | Differential from ABC

STEP 3 — Declare Lowest Calculated Bid (LCB):
  System identifies Rank 1 as LCB
  BAC uploads signed BAC Resolution declaring LCB
  Blockchain event: EVALUATION_COMPLETED (evaluation_report_hash, 
    abstract_calculated_hash, evaluator_ids[], lcb_vendor_id, timestamp)

STEP 4 — BAC Evaluation Report routed to Chairperson:
  Chairperson reviews → signs evaluation report
  Status: EVALUATION_APPROVED

SPECIAL CASE — REQUEST FOR RECONSIDERATION (RR) / PROTEST:
  Any losing bidder may file within prescribed period
  Secretariat logs: filing_date, grounds, documents_submitted
  Resolution of protest recorded
  All protest proceedings blockchain-stamped
  Procurement cannot advance until protest is resolved or dismissed

SPECIAL CASE — ALL BIDS NON-RESPONSIVE:
  → Failure of Bidding declared with this ground
  → Same Failure of Bidding workflow applies

---

### ═══ STAGE 6: POST-QUALIFICATION ═══

Actors: BAC Secretariat → Rank 1 LCB Vendor → TWG → BAC Chairperson → HOPE

APPLICABLE MODES: Competitive Bidding, Limited Source Bidding, Competitive Dialogue

STEP 1 — BAC Secretariat issues Post-Qualification Invitation to Rank 1 LCB:
  PQ Invitation Reference: PQI-[YEAR]-[SEQ]  e.g. PQI-2025-0034
  Auto-filled: procurement_reference, target_bidder, bidder_rank (1)
  System records: sent_at timestamp
  Legal deadline: EXACTLY 5 CALENDAR DAYS from vendor acknowledgment
  If vendor does NOT acknowledge within 24 hours:
    → Legal clock still runs from sent_at (unacknowledged service)
    → System flags: "Unacknowledged Service"
  Deadline countdown badge shown: D-5 to D-0
  Warning banners at 75% (Day 3) and 90% (Day 4) elapsed
  Blockchain event: POST_QUAL_INVITATION_SENT (invitation_hash, bidder_id, rank, 
    sent_at, deadline_at)

STEP 2 — Vendor uploads post-qualification documents (Vendor Portal):
  Upload window: ONLY within active 5-calendar-day window
  Required documents (mode/category specific):
    □ Updated DTI/SEC/CDA Registration
    □ Updated Mayor's/Business Permit
    □ Tax Clearance (current)
    □ Updated PhilGEPS Certificate
    □ Audited Financial Statements
    □ NFCC (Net Financial Contracting Capacity) computation or credit line
    □ Statement of Ongoing Contracts
    □ SLCC (Single Largest Completed Contract) with supporting documents
    □ PCAB License (for works)
    □ Omnibus Sworn Statement (notarized)
  Per file: SHA-256 hash computed and blockchain-recorded at upload
  Completeness meter shown (e.g., 7/9 documents uploaded)
  Final Submission Attestation checkbox: MANDATORY before submit
  After final submit: UI switches to READ-ONLY mode
  Late uploads: AUTOMATICALLY REJECTED, logged as NON_COMPLIANT attempt
  Blockchain event per file: POST_QUAL_DOCUMENT_UPLOADED
  Blockchain event on final submit: POST_QUAL_DOCUMENTS_SUBMITTED

STEP 3 — TWG evaluates post-qualification submission:
  For each checklist item in three categories:
    LEGAL COMPLIANCE: permits, registrations, tax compliance, sworn statements
    TECHNICAL COMPLIANCE: specs conformity, equipment capability, personnel, track record
    FINANCIAL CAPACITY: NFCC or credit line, AFS capacity indicators
    → Each item: Pass / Fail
    → Fail requires: item-specific justification + evidence reference
  Document hash verification (batch):
    → Each uploaded file's current hash vs. blockchain-recorded hash
    → MISMATCH: CRITICAL ALERT; blocks Pass recommendation until resolved
    → TWG cannot alter vendor-submitted files — evaluation is READ-ONLY
  TWG Overall Recommendation: Pass Post-Qualification / Fail Post-Qualification
  If Fail: grounds must cite specific deficiency with RA 12009 IRR basis
  TWG generates Post-Qualification Report
  Blockchain event: POST_QUAL_EVALUATED (report_hash, recommendation, 
    evaluator_ids[], timestamp)

STEP 4 — BAC acts on TWG Recommendation:
  BAC Chairperson reviews TWG report
  BAC Resolution Generator:
    BAC Resolution Number: BAC-RES-[YEAR]-[SEQ]
    Resolution Type: 
      □ Declare LCRB (TWG = Pass) 
      □ Declare Failed Post-Qualification (TWG = Fail)
      □ Advance to Next Rank
    Legal Basis: cite specific RA 12009 IRR provision
    BAC Voting Record: each member votes Approve/Disapprove/Abstain
    Quorum of BAC signatures REQUIRED before finalization
  Resolution FINALIZED → LOCKED (corrections require superseding resolution)
  Physical signed BAC Resolution still required; digital = audit-supporting
  Blockchain event: BAC_RESOLUTION_LCRB_DECLARED or BAC_RESOLUTION_POSTQUAL_FAILED

STEP 5 — If Vendor FAILS post-qualification:
  Rank advancement: system moves to Rank 2 automatically
  Rank 2 vendor receives Post-Qualification Invitation
  Same 5-day window and evaluation steps repeated
  This continues through Rank 3, etc.
  If ALL ranked bidders fail → Failure of Bidding declared
    → System suggests Negotiated Procurement (this counts as second failure 
      if a prior failed bidding exists)

STEP 6 — BAC Resolution routed to HOPE:
  Notification: HOPE with complete procurement record package
  Status: PENDING_HOPE_APPROVAL

---

### ═══ STAGE 7: AWARD ═══

Actors: HOPE → BAC Secretariat → Winning Vendor

STEP 1 — HOPE reviews BAC Resolution:
  System presents complete procurement record:
    PR details → ITB/RFQ → Bid Opening results → Evaluation → Post-Qualification
  HOPE APPROVES: proceeds to NOA generation
  HOPE RETURNS: back to BAC with specific grounds (blockchain-recorded)
  Any HOPE action: blockchain event: HOPE_RESOLUTION_ACTION (action, grounds, timestamp)

STEP 2 — Generate Notice of Award (NOA):
  NOA Reference: NOA-[YEAR]-[SEQ]  e.g. NOA-2025-0021
  Auto-populated GPPB template:
    winning_bidder (legal name + address), contract_amount,
    performance_security_required (2–10% of contract amount per RA 12009),
    performance_security_deadline (10 calendar days from NOA receipt),
    contract_signing_deadline (10 calendar days from NOA receipt),
    hope_name_and_designation, noa_date
  HOPE clicks "Sign and Issue NOA":
    Confirmation dialog: "You are about to digitally sign and issue the Notice 
    of Award. This action cannot be undone."
  Status: NOA_ISSUED
  Blockchain event: NOA_ISSUED (noa_hash, vendor_id, contract_amount, 
    hope_id, timestamp)

STEP 3 — NOA transmitted to winning vendor:
  Via: vendor portal + email (NOA PDF attached)
  System tracks: transmission_timestamp, acknowledgment_status
  Vendor must click "Acknowledge Receipt" in vendor portal
  Acknowledgment deadline: 3 CALENDAR DAYS from NOA receipt
  At Day 2 with no acknowledgment: alert to Secretariat
  At Day 3 with no acknowledgment: escalation to HOPE
  Blockchain event: NOA_ACKNOWLEDGED (vendor_id, acknowledged_at)

STEP 4 — Performance Security tracking:
  Deadline tracker auto-created: 10 calendar days from NOA receipt
  Alert schedule: Day 7 (warning), Day 9 (urgent), Day 10 (breach)
  On breach: alert to Secretariat + HOPE; re-award workflow initiated

STEP 5 — Award Cancellation (if needed):
  HOPE only
  Mandatory grounds (minimum 150 characters)
  New HOPE sign-off on cancellation record
  Blockchain event: AWARD_CANCELLED (grounds, hope_id, timestamp)
  Re-award workflow initiated to next eligible ranked bidder
  Notifications: all losing bidders informed of award (informational)

---

### ═══ STAGE 8: CONTRACT MANAGEMENT ═══

Actors: HOPE + BAC Secretariat → Department Requester → Finance Officer → Vendor

STEP 1 — Contract and NTP generation:
  Contract auto-generated from GPPB template (populated from procurement record)
  Notice to Proceed (NTP) auto-generated from GPPB template
  HOPE digitally signs both documents
  Physical wet signatures still required on originals
  All signed documents uploaded to system with blockchain-recorded hashes
  Blockchain events: CONTRACT_SIGNED, NTP_ISSUED (document_hashes, hope_id, timestamp)

STEP 2 — NTP issued to vendor:
  NTP Date = Day 1 of contract implementation period
  System begins tracking: contract duration countdown
  Contract milestone dates auto-computed from NTP date
  Contract Dashboard activated for this contract

STEP 3 — Contract Dashboard monitoring:
  Real-time status: Active / Suspended / Completed / Terminated
  Implementation progress: elapsed days vs. contract duration (% bar)
  Milestone tracker with alert schedule:
    3 days before milestone: warning (Requester + Secretariat)
    Milestone date passed without completion: alert (HOPE + Secretariat)
  Accessible by: BAC Secretariat (all), HOPE (all), 
    Department Requester (own contracts only), Finance Officer (all)

STEP 4 — Contract Amendment (change in scope/cost/duration):
  Filed by: Department Requester or Secretariat
  Routed: BAC review → HOPE approval
  All amendments versioned in system with change reason
  Blockchain event: AMENDMENT_APPROVED (amendment_hash, version, hope_id)

STEP 5 — Time Extension Request:
  Filed by: Vendor or Department Requester
  Required: supporting justification
  System enforces RA 12009 allowable grounds:
    □ Force majeure
    □ Government-caused delays
    □ Other RA 12009-prescribed grounds
  Routed: HOPE approval
  Blockchain event: EXTENSION_APPROVED (grounds, new_end_date, hope_id)

STEP 6 — Suspension Order:
  Issued by: HOPE only
  Implementation clock PAUSED at suspension date
  Suspension period documented with reason
  Blockchain event: CONTRACT_SUSPENDED (reason, suspension_date, hope_id)

STEP 7 — Termination:
  For CAUSE or FOR CONVENIENCE
  HOPE initiates termination workflow:
    Legal checklist completed (RA 12009 termination requirements)
    Formal termination notice generated and sent to vendor
  Blockchain event: CONTRACT_TERMINATED (grounds, termination_date, hope_id)

STEP 8 — Inspection and Acceptance:
  Vendor delivers goods/completes service
  Department Requester creates Inspection and Acceptance Report (IAR):
    Per-item checklist: quantity, condition, compliance with specs
    Inspection team completes checklist
    Department Head confirms acceptance
  IAR signed → status: DELIVERY_ACCEPTED
  Blockchain event: IAR_COMPLETED (iar_hash, accepted_by, accepted_at)

STEP 9 — Invoice Processing (Finance Officer):
  Vendor submits invoice via vendor portal (linked to specific delivery)
  Finance Officer performs THREE-WAY MATCH:
    Invoice vs. Purchase Order vs. Inspection and Acceptance Report
  All three must match before payment is certified
  Payment confirmation recorded in system
  Blockchain event: PAYMENT_RECORDED (invoice_id, amount, validated_by, paid_at)

---

### ═══ COMPLETE BLOCKCHAIN EVENT LOG ═══

Record ALL of these events on Hyperledger Fabric:

APP_ENTRY_SUBMITTED, APP_BUDGET_CERTIFIED, APP_APPROVED
PR_ACCEPTED
ITB_APPROVED, ITB_POSTED
RFQ_SENT
LIMITED_SOURCE_SHORTLIST_APPROVED
DIALOGUE_SESSION_CONDUCTED, DIALOGUE_COMPLETE
UNSOLICITED_OFFER_ACCEPTED, BID_MATCHING_DECISION
DIRECT_CONTRACT_APPROVED, DIRECT_ACQUISITION_APPROVED
REPEAT_ORDER_APPROVED, NEGOTIATED_PROCUREMENT_APPROVED
DIRECT_SALES_APPROVED, STI_PROCUREMENT_APPROVED
VENDOR_DOCUMENT_UPLOADED, DOCUMENT_HASH_MISMATCH
PRESCREENING_COMPLETED
BID_OPENING_SESSION_STARTED, BID_OPENING_COMPLETED
FAILURE_OF_BIDDING_DECLARED, BID_OPENING_POSTPONED
EVALUATION_COMPLETED
POST_QUAL_INVITATION_SENT, POST_QUAL_DOCUMENTS_SUBMITTED
POST_QUAL_EVALUATED
BAC_RESOLUTION_LCRB_DECLARED, BAC_RESOLUTION_POSTQUAL_FAILED
HOPE_RESOLUTION_ACTION
NOA_ISSUED, NOA_ACKNOWLEDGED
AWARD_CANCELLED
CONTRACT_SIGNED, NTP_ISSUED
AMENDMENT_APPROVED, EXTENSION_APPROVED
CONTRACT_SUSPENDED, CONTRACT_TERMINATED
IAR_COMPLETED
PAYMENT_RECORDED

Each blockchain record contains:
  event_type, procurement_id, actor_id, document_hash (SHA-256 of relevant doc),
  metadata (mode-specific), timestamp, block_number, tx_id

---

### ═══ AUTOMATED DEADLINE ENFORCEMENT (Bull + Redis job every 6 hours) ═══

Monitor these deadlines and alert at 75%, 90%, 100%:

Deadline                          | Legal Period         | Notified Parties
----------------------------------|----------------------|----------------------------------
Minimum advertisement period      | Mode-dependent       | Secretariat + Vendors
Bid submission deadline           | Per ITB              | Secretariat + Vendors
Post-qualification submission     | 5 calendar days      | Secretariat + BAC Chairperson
NOA acknowledgment                | 3 calendar days      | Secretariat + HOPE
Performance security submission   | 10 calendar days     | Secretariat + HOPE + Vendor
Contract signing deadline         | 10 calendar days     | Secretariat + HOPE
Contract milestone dates          | Per contract terms   | Requester + Secretariat + HOPE
Vendor document expiry            | Per document expiry  | Vendor + Secretariat
Repeat Order 6-month window       | 6 months from NTP    | Secretariat (advisory)
Direct Sales 6-month window       | 6 months from ref    | Secretariat (advisory)

---


---

## YOUR TASK

Generate the complete project step by step.
For each step provide:
  1. The exact file path
  2. The COMPLETE code (no placeholders, no "// TODO", fully implemented)
  3. A one-line note on how it connects to the next step

BUILD ORDER:
  Step 1: Docker + environment setup
  Step 2: Prisma schema (all models, all 11 mode fields, all relations)
  Step 3: Auth module (login, 2FA, JWT, account lockout, RBAC middleware)
  Step 4: User and role management + seed file (all 12 roles + permissions)
  Step 5: Frontend auth + role-based routing + role dashboards
  Step 6: APP module (full workflow)
  Step 7: PR module (full workflow)
  Step 8: All 11 invitation/mode modules
  Step 9: Vendor management module
  Step 10: Bid opening session (Socket.IO real-time)
  Step 11: Evaluation module
  Step 12: Post-qualification module (all 3 sub-steps)
  Step 13: Award module (NOA + tracking)
  Step 14: Contract management module
  Step 15: Blockchain integration (Hyperledger Fabric chaincode + SDK)
  Step 16: Deadline monitoring jobs
  Step 17: Reports and audit trail
  Step 18: Security hardening
  Step 19: Tests

Begin with Step 1.









Phase 1: Annual Procurement Plan
Login as Department Requester → requester@procureseal.gov.ph → /requester

Go to APP section → Create new APP entry
Fill in: project title, description, ABC amount, category (Goods/Services/Works), target quarter, justification
Submit the entry
Login as BAC Secretariat → secretariat@procureseal.gov.ph → /secretariat

Check notifications → Review the submitted APP
Accept and consolidate it (or return with remarks if testing that path)
Login as Budget Officer → budget@procureseal.gov.ph → /budget

Review APP → Certify fund source and availability
Login as HOPE → hope@procureseal.gov.ph → /hope

Review APP with budget cert → Approve it
Status becomes APP_APPROVED (locked, blockchain recorded)
Phase 2: Purchase Requisition
Login as Requester again

Go to PR section → Create PR linked to the approved APP
Add line items (description, unit, qty, unit cost) → Submit
Department Head endorses (same requester account or separate head)

Login as Budget Officer → Certify funds for the PR

Login as BAC Secretariat → Review PR → Assign procurement mode → Accept PR

Status becomes PR_ACCEPTED (blockchain recorded, locked)
Phase 3: Vendor Setup
Login as BAC Secretariat

Go to Vendor Management → Create a vendor account (business name, TIN, PhilGEPS #, etc.)
System checks GPPB blacklist automatically
Note the generated credentials
Login as the new Vendor → /vendor

System forces password change on first login
Upload eligibility docs (PDF, ≤25MB each): DTI/SEC, Mayor's Permit, Tax Clearance, PhilGEPS cert, etc.
Login as BAC Secretariat → Pre-screen each vendor document (mark Complete/Incomplete/Expired)

Phase 4: Invitation to Bid (Competitive Bidding)
Login as BAC Secretariat

Create ITB linked to accepted PR → Set dates (pre-bid conf if ABC ≥ 1M, submission deadline, opening date)
Submit for Chairperson approval
Login as BAC Chairperson → bacchair@procureseal.gov.ph → /chairperson

Approve the ITB
Login as BAC Secretariat → Post ITB to 3 channels (PhilGEPS ref#, LGU portal auto-generates, print PDF for bulletin)

Wait for advertisement period to elapse (system auto-unlocks bids)
Login as Vendor → Submit bid documents before deadline

Phase 5: Bid Opening
Login as BAC Secretariat → Open Bid Opening Session
Login as each BAC Member → bac1@, bac2@, bac3@procureseal.gov.ph → /bac-member
Each clicks Confirm Attendance (need 3 for quorum)
Login as BAC Secretariat
Perform eligibility check per bidder (Pass/Fail each document)
Enter bid prices from physical envelopes
System generates Abstract of Bids As Read → Close session (locks everything)
Phase 6: Bid Evaluation
Login as BAC Members (and TWG twg@procureseal.gov.ph → /twg)
Technical evaluation: mark each spec item Compliant/Non-Compliant per bidder
Login as BAC Members → Financial evaluation: enter Calculated Price, system auto-ranks
Login as BAC Chairperson → Review, sign evaluation report
Phase 7: Post-Qualification
Login as BAC Secretariat → Send post-qual invitation to Rank 1 bidder
Login as Vendor (Rank 1) → Upload post-qual documents within 5 days → Check attestation → Submit
Login as TWG → Evaluate documents (Legal, Technical, Financial) → Generate post-qual report
Login as BAC Chairperson → Generate BAC Resolution → BAC Members vote → Finalize
Phase 8: Award
Login as HOPE → Review full procurement package → Approve resolution
Login as HOPE → Generate & sign Notice of Award (NOA)
Login as Vendor → Acknowledge NOA within 3 days
System starts 10-day performance security deadline
Phase 9: Contract Management
Login as BAC Secretariat + HOPE → System generates Contract & NTP → HOPE signs
Login as BAC Secretariat → Issue NTP to vendor (Day 1 of contract starts)
Login as Requester → When delivery happens, create Inspection & Acceptance Report (IAR)
Login as Vendor → Submit invoice linked to delivery
Login as Finance Officer → finance@procureseal.gov.ph → /finance
Three-way match: Invoice vs PO vs IAR → Certify payment
Observer/Auditor (anytime)
Observer: observer@procureseal.gov.ph → /observer — read-only view of everything
Auditor: auditor@procureseal.gov.ph → /auditor — read-only + blockchain audit trail