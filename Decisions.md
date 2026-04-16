# ProcureSeal — Architecture Decisions Log

## Last Updated
2026-04-13



### RBAC Implementation
Permissions stored as JSONB in roles table.
Checked at both: frontend (usePermissions hook) and backend (rbac.middleware.js).
No client-side permission bypass is possible.

### Blockchain Events
PostgreSQL stores mirror of blockchain events for fast querying.
Hyperledger Fabric is source of truth for immutability verification.
Both must be written on every critical event — DB first, then Fabric async.

### Document Hashing
SHA-256 computed at upload time on the server (never client-side).
Hash stored in: PostgreSQL (documents table) AND Hyperledger Fabric.
Mismatch between the two = CRITICAL ALERT.

### Vendor Registration
Vendors do NOT self-register.
BAC Secretariat creates vendor accounts after offline physical verification.
Reason: government procurement requires physical document verification first.

### Digital Signatures
In-system confirmations = JWT-verified identity bindings (audit trail only).
NOT legally equivalent e-signatures under RA 8792.
Physical wet signatures still required on: BAC Resolutions, NOA, NTP, Contracts.

---

## PROCUREMENT LOGIC DECISIONS

### Mode Selection Threshold
ABC > ₱2,000,000 → Competitive Bidding (default, enforced)
ABC ≤ ₱2,000,000 → SVP suggested
ABC ≤ ₱200,000 → Direct Acquisition suggested
Alternative modes always require HOPE approval + justification.

### Failure of Bidding → Negotiated Procurement
System automatically suggests Negotiated Procurement after 2nd failed bidding.
System validates: 2 Failure of Bidding records must exist before allowing Negotiated mode.

### Repeat Order Validation (system auto-checks all 3):
1. Quantity ≤ 25% of original contract quantity
2. Date within 6 months of original NTP
3. Price ≤ original contract unit price
All 3 must pass or system blocks the repeat order.

### Post-Qualification Deadline
Exactly 5 calendar days from vendor acknowledgment timestamp.
If vendor does not acknowledge within 24 hours:
  Clock still runs from sent_at (unacknowledged service rule).

### BAC Quorum
Minimum 3 BAC members must digitally confirm attendance.
Bid opening session START button disabled until quorum confirmed.
Quorum also required before any BAC Resolution can be finalized.

---

## UI/UX DECISIONS

### Role Routing
Each role sees only their assigned routes and sidebar items.
Unauthenticated users see only: Login page and Vendor portal.
Wrong-role URL access → redirect to role's own dashboard.

### Auto-save
All forms with significant data auto-save draft every 2 minutes.
"Last saved at HH:MM" indicator shown.

### Date Pickers
All date pickers enforce RA 12009 minimum legal periods.
Dates before legal minimum are grayed out and unselectable.
PH public holidays and weekends are blocked where legally required.

### Blockchain Hash Display
Every uploaded document shows hash status badge:
  ✅ Hash Recorded — on upload
  ✅ VERIFIED — on hash check (match)
  ❌ TAMPERED — on hash check (mismatch)

---

## SECURITY DECISIONS

### bcrypt Cost Factor
Set to 12. Do not lower for performance — security requirement.

### Rate Limiting
100 req/min for authenticated users.
20 req/min for unauthenticated endpoints.
Implemented via express-rate-limit + Redis store.

### Account Lockout
3 failed attempts → 30-minute automatic lock (Redis counter with TTL).
10 failed attempts → permanent lock requiring System Admin unlock.

### 2FA Enforcement
Mandatory for: System Administrator, HOPE, BAC Chairperson, Finance Officer.
Optional but available for all other roles.
OTP valid for 5 minutes, single-use.

---

## THINGS EXPLICITLY REJECTED

| Suggestion | Reason Rejected |
|-----------|----------------|
| TypeScript | Timeline constraints, not needed for capstone |
| AWS S3 | Local LGU deployment, MinIO is equivalent |
| Ethereum/Solidity | Public chain not suitable for government data |
| localStorage for JWT | XSS vulnerability |
| Self-registration for vendors | Physical verification required by procurement law |
| Automated PhilGEPS API | Out of scope, manual reference number entry instead |
| Online payment processing | Out of scope for this system |