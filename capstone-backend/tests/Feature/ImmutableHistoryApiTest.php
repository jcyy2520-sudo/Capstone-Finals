<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\ImmutableHistoryEntry;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImmutableHistoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected Department $department;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->department = Department::create([
            'name' => 'Immutable History Test Department',
            'code' => 'IHT',
        ]);
    }

    public function test_internal_auditor_can_view_filtered_immutable_history(): void
    {
        $this->actingAsRole(Role::INTERNAL_AUDITOR);

        ImmutableHistoryEntry::create([
            'table_name' => 'app_entries',
            'record_id' => 10,
            'operation' => 'updated',
            'old_snapshot' => ['project_title' => 'Old APP'],
            'new_snapshot' => ['project_title' => 'New APP'],
            'recorded_at' => now()->subMinute(),
        ]);

        ImmutableHistoryEntry::create([
            'table_name' => 'contracts',
            'record_id' => 22,
            'operation' => 'created',
            'old_snapshot' => null,
            'new_snapshot' => ['contract_reference' => 'CON-2026-0001'],
            'recorded_at' => now(),
        ]);

        $response = $this->getJson('/api/immutable-history?table_name=app_entries&operation=updated');

        $response->assertOk();
        $response->assertJsonPath('summary.total', 1);
        $response->assertJsonPath('summary.updated', 1);
        $response->assertJsonPath('summary.created', 0);
        $response->assertJsonPath('data.0.table_name', 'app_entries');
        $response->assertJsonPath('data.0.operation', 'updated');
        $response->assertJsonPath('data.0.record_id', 10);
        $response->assertJsonPath('data.0.record_label', 'New APP');
    }

    public function test_observer_cannot_view_immutable_history(): void
    {
        $this->actingAsRole(Role::OBSERVER);

        $response = $this->getJson('/api/immutable-history');

        $response->assertStatus(403);
    }

    private function actingAsRole(string $roleName): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        $user = User::create([
            'name' => "Immutable {$roleName}",
            'email' => "immutable-{$roleName}@test.com",
            'password' => 'ProcureSeal@2025',
            'role_id' => $role->id,
            'department_id' => $this->department->id,
            'status' => 'active',
            'email_verified_at' => now(),
            'requires_password_change' => false,
        ]);

        $token = $user->createToken('test', ['*'])->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $user;
    }
}