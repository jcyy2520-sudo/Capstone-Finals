<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use App\Models\AppEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected Department $department;
    protected User $requester;
    protected User $departmentHead;
    protected User $secretariat;
    protected User $budgetOfficer;
    protected User $hope;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->department = Department::create(['name' => 'Test Department', 'code' => 'TST']);

        $this->requester = $this->createUser('department_requester', 'requester@test.com');
    $this->departmentHead = $this->createUser('department_head', 'depthead@test.com');
        $this->secretariat = $this->createUser('bac_secretariat', 'secretariat@test.com');
        $this->budgetOfficer = $this->createUser('budget_officer', 'budget@test.com');
        $this->hope = $this->createUser('hope', 'hope@test.com');
    }

    protected function createUser(string $roleName, string $email): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        return User::create([
            'name' => "Test {$roleName}",
            'email' => $email,
            'password' => 'ProcureSeal@2025',
            'role_id' => $role->id,
            'department_id' => $this->department->id,
            'status' => 'active',
            'email_verified_at' => now(),
            'requires_password_change' => false,
        ]);
    }

    protected function actAs(User $user): self
    {
        $token = $user->createToken('test', ['*'])->plainTextToken;
        return $this->withHeader('Authorization', "Bearer {$token}");
    }

    protected function makeAppEntryPayload(): array
    {
        return [
            'project_title' => 'Test Medical Supplies Procurement',
            'description' => 'Procurement of medical supplies for MHO',
            'mfo_code' => config('procureseal.mfo_options.0.code', 'MFO-1'),
            'pap_code' => config('procureseal.pap_codes.0', 'PAP-001'),
            'uacs_object_code' => config('procureseal.uacs_object_codes.0', '10101010'),
            'approved_budget_reference' => config('procureseal.budget_references.0', 'GAA-2026'),
            'category' => 'goods',
            'mode' => 'competitive_bidding',
            'abc' => 5000000,
            'fund_source' => 'General Fund',
            'account_code' => '1-01-01-010',
            'implementing_unit' => 'Municipal Health Office',
            'department_id' => $this->department->id,
            'target_start_quarter' => 'Q1',
            'target_completion_quarter' => 'Q2',
            'justification' => 'Annual procurement as per APP',
        ];
    }

    public function test_requester_can_create_app_entry(): void
    {
        $response = $this->actAs($this->requester)
            ->postJson('/api/app-entries', $this->makeAppEntryPayload());

        $response->assertStatus(201)
                 ->assertJsonPath('data.status', 'draft');
    }

    public function test_app_entry_requires_validation(): void
    {
        $response = $this->actAs($this->requester)
            ->postJson('/api/app-entries', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['project_title', 'description', 'category']);
    }

    public function test_requester_can_submit_app_entry(): void
    {
        // Create entry
        $createResponse = $this->actAs($this->requester)
            ->postJson('/api/app-entries', $this->makeAppEntryPayload());

        $entryId = $createResponse->json('data.id');

        // Submit
        $response = $this->actAs($this->requester)
            ->postJson("/api/app-entries/{$entryId}/submit");

        $response->assertStatus(200);
    }

    public function test_budget_officer_can_certify_budget(): void
    {
        // Create, submit, and endorse entry for budget certification.
        $entry = AppEntry::create(array_merge($this->makeAppEntryPayload(), [
            'created_by' => $this->requester->id,
            'status' => 'pending_budget_certification',
            'fiscal_year' => now()->year,
            'submitted_at' => now(),
            'endorsed_by' => $this->departmentHead->id,
            'endorsed_at' => now(),
        ]));

        $response = $this->actAs($this->budgetOfficer)
            ->postJson("/api/app-entries/{$entry->id}/certify-budget", [
                'remarks' => 'Funds available and certified.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'pending_secretariat_consolidation');
    }

    public function test_observer_cannot_create_app_entry(): void
    {
        $observer = $this->createUser('observer', 'obs@test.com');

        $response = $this->actAs($observer)
            ->postJson('/api/app-entries', $this->makeAppEntryPayload());

        $response->assertStatus(403);
    }
}
