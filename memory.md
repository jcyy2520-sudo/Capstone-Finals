# ProcureSeal — Implementation Memory

## Last Updated
2026-04-13

---

## ARCHITECTURE DECISIONS (Locked)

### Stack: ACTUAL vs. SRS
The SRS (Section 5) specifies Node.js + Express + Prisma + PostgreSQL + Redux.
The ACTUAL codebase uses **Laravel 12 + React 19 + Sanctum + Tailwind CSS**.
**DECISION:** We proceed with the ACTUAL stack (Laravel + React). The SRS stack description is treated as aspirational documentation and does NOT govern implementation.

### Blockchain: Simulated, Not Hyperledger
The SRS specifies Hyperledger Fabric 2.5.x.
The codebase implements **application-level blockchain simulation** via `BlockchainEvent` model with chained SHA-256 hashes.
**DECISION:** We proceed with the simulated blockchain.

### Vendor Registration: Secretariat-Only (Confirmed)
SystemFlow.md says vendors do NOT self-register. BAC Secretariat creates accounts after offline verification.
**DECISION:** Follow SystemFlow.md. Self-registration page from SRS Section 4.1.2 is discarded.

### Roles: 12 Total (Confirmed)
12 roles as implemented in RoleSeeder: system_admin, hope, bac_chairperson, bac_member, bac_secretariat, twg_member, department_requester, budget_officer, finance_officer, vendor, observer, internal_auditor.

---

## CODEBASE STATE SNAPSHOT (2026-04-13)

### Backend: ~85% Structure Complete
- 32 Models with relationships
- 18 Controllers
- 27 Migrations
- 12 Roles seeded with permissions
- Auth flow (login, 2FA, lockout, password change) implemented
- 5 Services
- 3 Middleware (CheckRole, CheckPermission, Ensure2FAVerified)
- API routes fully defined with middleware stack

### Frontend: ~55% Complete (revised upward — deep audit 2026-04-13)
- Auth context implemented (login, 2FA, password change, token management)
- Role-based routing with walled garden in App.jsx
- 12 role folders with route definitions + sidebar components
- GenericLayout with sidebar + topbar already built
- **Shared components in `src/shared/components/` (NOT `src/components/`):** Table (5.6KB), Badge, Button, Modal (2.2KB), Icon (4.9KB), PageHeader, RoleFeaturePage (15KB mega-component), RoleSidebarShell (5.2KB), ErrorBoundary, ProtectedRoute
- `src/components/` is EMPTY — all shared components live in `src/shared/components/`
- `src/utils/`: rolePaths.js, toast.js
- `src/services/api.js`: axios with token interceptor

#### Per-Role Page Status (audited):
| Role | Functional Pages | Stub Pages |
|------|-----------------|------------|
| Department Requester | AppEntriesPage, PurchaseRequisitionsPage | DashboardPage |
| BAC Secretariat | AppEntriesPage, PurchaseRequisitionsPage, BiddersPage, PreScreeningPage, DashboardPage | — |
| Budget Officer | CertificationPage | DashboardPage |
| HOPE | ApprovalsPage | DashboardPage |
| Vendor | VendorDashboardPage, VendorProfilePage, VendorOpportunitiesPage | — |
| BAC Chairperson | — | TBD |
| BAC Member | — | TBD |
| TWG Member | — | TBD |
| Observer | — | TBD |
| Internal Auditor | — | TBD |
| Finance Officer | — | TBD |
| System Admin | — | TBD |

#### Backend Controller Status (audited):
| Controller | Status |
|-----------|--------|
| AppEntryController | ✅ FUNCTIONAL (12 methods) |
| PurchaseRequisitionController | ✅ FUNCTIONAL (11 methods) |
| BidOpeningController | ⚠️ PARTIAL (generateAbstract placeholder) |
| EvaluationController | ✅ FUNCTIONAL (6 methods) |
| PostQualificationController | ✅ FUNCTIONAL (6 methods) |
| AwardController | ✅ FUNCTIONAL (5 methods) |
| ContractController | ✅ FUNCTIONAL (4 methods) |
| VendorController | ⚠️ PARTIAL (getBids returns mock data). getProfile/updateProfile/uploadDocument ADDED |

### Infrastructure
- No Docker (using Laragon)
- Database migrated: 41 tables, 12 roles, 13 users seeded
- Backend serves on :8000, Frontend on :5173

---

## PRIORITY ORDER
1. Competitive Bidding — full implementation
2. Small Value Procurement (SVP) — full implementation
3. Direct Acquisition — simplified
4. Remaining 8 modes — basic workflow support

---

## WHAT "DONE" MEANS PER PHASE
1. Database migrations run cleanly
2. Backend API endpoints return correct data with role guards
3. Frontend pages render with real data from API
4. Status transitions work end-to-end
5. Audit log entries created
6. BlockchainEvent records written for critical actions
7. Notifications triggered (at minimum: in-app)
