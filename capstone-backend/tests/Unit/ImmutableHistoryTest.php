<?php

namespace Tests\Unit;

use App\Models\AppEntry;
use App\Models\Department;
use App\Models\ImmutableHistoryEntry;
use App\Models\ProcurementNotification;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImmutableHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_records_create_and_update_snapshots_for_tracked_procurement_records(): void
    {
        $user = User::factory()->create();
        $department = Department::create([
            'name' => 'Municipal Engineering Office',
            'code' => 'MEO',
        ]);

        $entry = AppEntry::create([
            'department_id' => $department->id,
            'project_title' => 'Road Repair',
            'description' => 'Initial draft',
            'category' => 'infrastructure',
            'mode' => 'competitive_bidding',
            'abc' => 2500000,
            'unit_of_measurement' => 'lot',
            'quantity' => 1,
            'fund_source' => 'General Fund',
            'account_code' => '5020399000',
            'implementing_unit' => 'MEO',
            'target_start_quarter' => 'Q2',
            'target_completion_quarter' => 'Q3',
            'fiscal_year' => 2026,
            'justification' => 'Core infrastructure repair.',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $entry->update([
            'project_title' => 'Road Repair Phase 1',
            'description' => 'Revised scope',
        ]);

        $history = ImmutableHistoryEntry::query()
            ->where('table_name', 'app_entries')
            ->where('record_id', $entry->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $history);
        $this->assertSame('created', $history[0]->operation);
        $this->assertSame('Road Repair', $history[0]->new_snapshot['project_title']);
        $this->assertSame('updated', $history[1]->operation);
        $this->assertSame('Road Repair', $history[1]->old_snapshot['project_title']);
        $this->assertSame('Road Repair Phase 1', $history[1]->new_snapshot['project_title']);
    }

    public function test_it_records_bulk_updates_that_bypass_eloquent_events(): void
    {
        $recipient = User::factory()->create(['status' => 'active']);

        $notification = ProcurementNotification::create([
            'recipient_id' => $recipient->id,
            'type' => 'integrity_warning',
            'title' => 'Integrity Warning',
            'message' => 'A mismatch was detected.',
            'priority' => 'critical',
        ]);

        DB::table('procurement_notifications')
            ->where('id', $notification->id)
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        $history = ImmutableHistoryEntry::query()
            ->where('table_name', 'procurement_notifications')
            ->where('record_id', $notification->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $history);
        $this->assertSame('created', $history[0]->operation);
        $this->assertSame('updated', $history[1]->operation);
        $this->assertNull($history[1]->old_snapshot['read_at']);
        $this->assertNotNull($history[1]->new_snapshot['read_at']);
    }

    public function test_it_blocks_hard_deletes_for_top_level_procurement_records(): void
    {
        $user = User::factory()->create();
        $department = Department::create([
            'name' => 'Municipal Planning Office',
            'code' => 'MPO',
        ]);

        $entry = AppEntry::create([
            'department_id' => $department->id,
            'project_title' => 'Planning System Upgrade',
            'description' => 'Draft proposal',
            'category' => 'goods',
            'mode' => 'small_value_procurement',
            'abc' => 500000,
            'unit_of_measurement' => 'lot',
            'quantity' => 1,
            'fund_source' => 'General Fund',
            'account_code' => '5020301000',
            'implementing_unit' => 'MPO',
            'target_start_quarter' => 'Q1',
            'target_completion_quarter' => 'Q2',
            'fiscal_year' => 2026,
            'justification' => 'System improvement.',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $this->expectException(QueryException::class);

        DB::table('app_entries')->where('id', $entry->id)->delete();
    }

    public function test_it_blocks_hard_deletes_for_notifications(): void
    {
        $recipient = User::factory()->create(['status' => 'active']);

        $notification = ProcurementNotification::create([
            'recipient_id' => $recipient->id,
            'type' => 'integrity_warning',
            'title' => 'Immutable Notice',
            'message' => 'Delete should be blocked.',
            'priority' => 'high',
        ]);

        $this->expectException(QueryException::class);

        DB::table('procurement_notifications')->where('id', $notification->id)->delete();
    }
}