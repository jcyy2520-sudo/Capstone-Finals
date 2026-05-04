<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed roles first (required for user creation)
        $this->call(RoleSeeder::class);

        // 2. Seed sample departments
        $departments = [
            ['name' => 'Municipal Health Office', 'code' => 'MHO'],
            ['name' => 'Municipal Engineering Office', 'code' => 'MEO'],
            ['name' => 'Municipal Social Welfare and Development', 'code' => 'MSWD'],
            ['name' => 'Municipal Agriculture Office', 'code' => 'MAO'],
            ['name' => 'Municipal Budget Office', 'code' => 'MBO'],
            ['name' => 'Municipal Treasurer Office', 'code' => 'MTO'],
            ['name' => 'Municipal Planning and Development Office', 'code' => 'MPDO'],
            ['name' => 'General Services Office', 'code' => 'GSO'],
            ['name' => 'Information Technology Office', 'code' => 'ITO'],
            ['name' => 'Office of the Mayor', 'code' => 'OM'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['code' => $dept['code']], $dept);
        }

        // 3. Create default System Admin account
        $adminRole = Role::where('name', Role::SYSTEM_ADMIN)->first();
        User::updateOrCreate(
            ['email' => 'admin@procureseal.gov.ph'],
            [
                'name' => 'System Administrator',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $adminRole?->id,
                'department_id' => Department::where('code', 'ITO')->first()?->id,
                'designation' => 'MIS Head',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 4. Create sample HOPE account
        $hopeRole = Role::where('name', Role::HOPE)->first();
        User::updateOrCreate(
            ['email' => 'hope@procureseal.gov.ph'],
            [
                'name' => 'Hon. Juan Dela Cruz',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $hopeRole?->id,
                'department_id' => Department::where('code', 'OM')->first()?->id,
                'designation' => 'Municipal Mayor',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 5. Create sample BAC Secretariat account
        $secRole = Role::where('name', Role::BAC_SECRETARIAT)->first();
        User::updateOrCreate(
            ['email' => 'secretariat@procureseal.gov.ph'],
            [
                'name' => 'Maria Santos',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $secRole?->id,
                'department_id' => Department::where('code', 'GSO')->first()?->id,
                'designation' => 'BAC Secretariat Head',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 6. Create sample BAC Chairperson
        $chairRole = Role::where('name', Role::BAC_CHAIRPERSON)->first();
        User::updateOrCreate(
            ['email' => 'bacchair@procureseal.gov.ph'],
            [
                'name' => 'Pedro Reyes',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $chairRole?->id,
                'department_id' => Department::where('code', 'GSO')->first()?->id,
                'designation' => 'BAC Chairperson',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 7. Create sample BAC Members (minimum 3 for quorum)
        $bacMemberRole = Role::where('name', Role::BAC_MEMBER)->first();
        $bacMembers = [
            ['name' => 'Ana Lopez', 'email' => 'bac1@procureseal.gov.ph'],
            ['name' => 'Jose Garcia', 'email' => 'bac2@procureseal.gov.ph'],
            ['name' => 'Elena Cruz', 'email' => 'bac3@procureseal.gov.ph'],
        ];
        foreach ($bacMembers as $member) {
            User::updateOrCreate(
                ['email' => $member['email']],
                [
                    'name' => $member['name'],
                    'password' => bcrypt('ProcureSeal@2025'),
                    'role_id' => $bacMemberRole?->id,
                    'designation' => 'BAC Member',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }

        // 8. Create sample Procurement Officer
        $procurementRole = Role::where('name', Role::PROCUREMENT_OFFICER)->first();
        User::updateOrCreate(
            ['email' => 'procurement@procureseal.gov.ph'],
            [
                'name' => 'Miguel Santiago',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $procurementRole?->id,
                'department_id' => Department::where('code', 'GSO')->first()?->id,
                'designation' => 'Procurement Officer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 9. Create sample Department Requester
        $reqRole = Role::where('name', Role::DEPARTMENT_REQUESTER)->first();
        User::updateOrCreate(
            ['email' => 'requester@procureseal.gov.ph'],
            [
                'name' => 'Roberto Aquino',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $reqRole?->id,
                'department_id' => Department::where('code', 'MHO')->first()?->id,
                'designation' => 'Supply and Procurement Focal Person',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 10. Create sample Department Head
        $departmentHeadRole = Role::where('name', Role::DEPARTMENT_HEAD)->first();
        User::updateOrCreate(
            ['email' => 'depthead@procureseal.gov.ph'],
            [
                'name' => 'Dr. Elena Navarro',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $departmentHeadRole?->id,
                'department_id' => Department::where('code', 'MHO')->first()?->id,
                'designation' => 'Department Head - MHO',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 11. Create sample Budget Officer
        $budgetRole = Role::where('name', Role::BUDGET_OFFICER)->first();
        User::updateOrCreate(
            ['email' => 'budget@procureseal.gov.ph'],
            [
                'name' => 'Ricardo Mendoza',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $budgetRole?->id,
                'department_id' => Department::where('code', 'MBO')->first()?->id,
                'designation' => 'Municipal Budget Officer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 12. Create sample Finance Officer
        $financeRole = Role::where('name', Role::FINANCE_OFFICER)->first();
        User::updateOrCreate(
            ['email' => 'finance@procureseal.gov.ph'],
            [
                'name' => 'Carmen Villanueva',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $financeRole?->id,
                'department_id' => Department::where('code', 'MTO')->first()?->id,
                'designation' => 'Municipal Treasurer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 13. Create sample TWG Member
        $twgRole = Role::where('name', Role::TWG_MEMBER)->first();
        User::updateOrCreate(
            ['email' => 'twg@procureseal.gov.ph'],
            [
                'name' => 'Lorna Bautista',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $twgRole?->id,
                'department_id' => Department::where('code', 'MEO')->first()?->id,
                'designation' => 'TWG Member - Engineering',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 14. Create sample Inspection and Acceptance Committee member
        $iacRole = Role::where('name', Role::INSPECTION_ACCEPTANCE_COMMITTEE)->first();
        User::updateOrCreate(
            ['email' => 'iac@procureseal.gov.ph'],
            [
                'name' => 'Ramon Castillo',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $iacRole?->id,
                'department_id' => Department::where('code', 'GSO')->first()?->id,
                'designation' => 'IAC Chairperson',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 15. Create sample COA/GPPB Observer
        $observerRole = Role::where('name', Role::OBSERVER)->first();
        User::updateOrCreate(
            ['email' => 'observer@procureseal.gov.ph'],
            [
                'name' => 'Gloria Ramos',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $observerRole?->id,
                'designation' => 'COA Observer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 16. Create sample Internal Auditor
        $auditorRole = Role::where('name', Role::INTERNAL_AUDITOR)->first();
        User::updateOrCreate(
            ['email' => 'auditor@procureseal.gov.ph'],
            [
                'name' => 'Fernando Tan',
                'password' => bcrypt('ProcureSeal@2025'),
                'role_id' => $auditorRole?->id,
                'designation' => 'Internal Auditor',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ ProcureSeal database seeded successfully.');
        $this->command->info('   Default password for all accounts: ProcureSeal@2025');
    }
}
