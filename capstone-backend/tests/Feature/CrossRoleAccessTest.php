<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected Department $department;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->department = Department::create(['name' => 'Test Department', 'code' => 'TST']);
    }

    protected function actingAsRole(string $roleName): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $user = User::create([
            'name' => "Test {$roleName}",
            'email' => "crossrole-{$roleName}@test.com",
            'password' => 'ProcureSeal@2025',
            'role_id' => $role->id,
            'department_id' => $this->department->id,
            'status' => 'active',
            'email_verified_at' => now(),
            'requires_password_change' => false,
        ]);

        // Create full-access token (simulating post-2FA)
        $token = $user->createToken('test', ['*'])->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $user;
    }

    // ── Observer cannot access admin endpoints ──

    public function test_observer_cannot_access_user_management(): void
    {
        $this->actingAsRole('observer');

        $response = $this->getJson('/api/users');
        $response->assertStatus(403);
    }

    public function test_observer_cannot_create_app_entry(): void
    {
        $this->actingAsRole('observer');

        $response = $this->postJson('/api/app-entries', [
            'project_title' => 'Test',
        ]);
        $response->assertStatus(403);
    }

    // ── Vendor cannot access BAC endpoints ──

    public function test_vendor_cannot_access_bid_openings(): void
    {
        $this->actingAsRole('vendor');

        $response = $this->postJson('/api/bid-openings', []);
        $response->assertStatus(403);
    }

    public function test_vendor_cannot_access_evaluations(): void
    {
        $this->actingAsRole('vendor');

        $response = $this->postJson('/api/bid-openings/1/evaluate', []);
        $response->assertStatus(403);
    }

    // ── Department requester cannot access admin or BAC write endpoints ──

    public function test_requester_cannot_manage_users(): void
    {
        $this->actingAsRole('department_requester');

        $response = $this->getJson('/api/users');
        $response->assertStatus(403);
    }

    public function test_requester_cannot_create_invitation(): void
    {
        $this->actingAsRole('department_requester');

        $response = $this->postJson('/api/invitations', []);
        $response->assertStatus(403);
    }

    // ── Internal auditor has read-only access ──

    public function test_auditor_can_access_audit_logs(): void
    {
        $this->actingAsRole('internal_auditor');

        $response = $this->getJson('/api/audit-logs');
        $response->assertStatus(200);
    }

    public function test_auditor_cannot_create_app_entry(): void
    {
        $this->actingAsRole('internal_auditor');

        $response = $this->postJson('/api/app-entries', []);
        $response->assertStatus(403);
    }

    // ── Budget officer cannot access secretariat endpoints ──

    public function test_budget_officer_cannot_create_invitation(): void
    {
        $this->actingAsRole('budget_officer');

        $response = $this->postJson('/api/invitations', []);
        $response->assertStatus(403);
    }

    // ── BAC member access ──

    public function test_bac_member_cannot_manage_users(): void
    {
        $this->actingAsRole('bac_member');

        $response = $this->getJson('/api/users');
        $response->assertStatus(403);
    }
}
