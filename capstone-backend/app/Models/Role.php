<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'permissions',
        'requires_2fa',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'requires_2fa' => 'boolean',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // ─── Permission Helpers ─────────────────────────────

    /**
     * Check if this role has a specific permission.
     * Permissions stored as: {"module_name": {"action": true/false}}
     */
    public function hasPermission(string $module, string $action): bool
    {
        $perms = $this->permissions ?? [];
        return isset($perms[$module][$action]) && $perms[$module][$action] === true;
    }

    // ─── Role Name Constants ────────────────────────────

    const SYSTEM_ADMIN = 'system_admin';
    const HOPE = 'hope';
    const BAC_CHAIRPERSON = 'bac_chairperson';
    const BAC_MEMBER = 'bac_member';
    const BAC_SECRETARIAT = 'bac_secretariat';
    const TWG_MEMBER = 'twg_member';
    const PROCUREMENT_OFFICER = 'procurement_officer';
    const DEPARTMENT_REQUESTER = 'department_requester';
    const DEPARTMENT_HEAD = 'department_head';
    const BUDGET_OFFICER = 'budget_officer';
    const FINANCE_OFFICER = 'finance_officer';
    const VENDOR = 'vendor';
    const INSPECTION_ACCEPTANCE_COMMITTEE = 'inspection_acceptance_committee';
    const OBSERVER = 'observer';
    const INTERNAL_AUDITOR = 'internal_auditor';
}
