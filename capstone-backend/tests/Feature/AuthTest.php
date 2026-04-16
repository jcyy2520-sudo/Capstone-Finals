<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->department = Department::create(['name' => 'Test Department', 'code' => 'TST']);
    }

    protected function createUser(string $roleName, array $overrides = []): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => "test-{$roleName}@test.com",
            'password' => 'ProcureSeal@2025',
            'role_id' => $role->id,
            'department_id' => $this->department->id,
            'status' => 'active',
            'email_verified_at' => now(),
            'requires_password_change' => false,
        ], $overrides));
    }

    public function test_login_with_valid_credentials(): void
    {
        // bac_secretariat doesn't require 2FA
        $user = $this->createUser('bac_secretariat');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'ProcureSeal@2025',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_with_invalid_credentials(): void
    {
        $user = $this->createUser('bac_secretariat');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_with_missing_fields(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_locked_account(): void
    {
        $user = $this->createUser('bac_secretariat', [
            'locked_until' => now()->addMinutes(30),
            'failed_login_attempts' => 3,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'ProcureSeal@2025',
        ]);

        $response->assertStatus(423)
                 ->assertJson(['locked' => true]);
    }

    public function test_login_suspended_account(): void
    {
        $user = $this->createUser('bac_secretariat', [
            'status' => 'suspended',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'ProcureSeal@2025',
        ]);

        $response->assertStatus(403);
    }

    public function test_logout(): void
    {
        $user = $this->createUser('bac_secretariat');
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/auth/logout');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_access_denied(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_rate_limiting_on_login(): void
    {
        $user = $this->createUser('bac_secretariat');

        // Make 5 rapid requests (the limit)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'nonexistent@test.com',
                'password' => 'wrong',
            ]);
        }

        // 6th should be rate-limited
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
    }
}
