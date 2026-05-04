<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $trackedTables = [
        'app_entries',
        'purchase_requisitions',
        'pr_line_items',
        'invitations',
        'rfq_invitations',
        'pre_procurement_conferences',
        'pre_bid_conferences',
        'bid_submissions',
        'bid_openings',
        'bid_prices',
        'bid_eligibility_results',
        'evaluations',
        'evaluation_summaries',
        'post_qualifications',
        'bac_resolutions',
        'awards',
        'contracts',
        'contract_amendments',
        'contract_extensions',
        'contract_suspensions',
        'inspection_acceptance_reports',
        'invoices',
        'blockchain_events',
        'audit_logs',
        'procurement_notifications',
        'ethereum_transactions',
        'chain_anchors',
    ];

    private array $deleteProtectedTables = [
        'app_entries',
        'purchase_requisitions',
        'invitations',
        'bid_submissions',
        'bid_openings',
        'bid_prices',
        'bac_resolutions',
        'awards',
        'contracts',
        'invoices',
        'blockchain_events',
        'audit_logs',
        'procurement_notifications',
        'immutable_history_entries',
    ];

    private array $updateProtectedTables = [
        'audit_logs',
        'immutable_history_entries',
    ];

    public function up(): void
    {
        Schema::create('immutable_history_entries', function (Blueprint $table) {
            $table->id();
            $table->string('table_name', 120);
            $table->unsignedBigInteger('record_id')->nullable();
            $table->string('operation', 16);
            $table->json('old_snapshot')->nullable();
            $table->json('new_snapshot')->nullable();
            $table->timestamp('recorded_at');

            $table->index(['table_name', 'record_id']);
            $table->index(['table_name', 'recorded_at']);
        });

        foreach ($this->trackedTables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $this->createHistoryTriggers($tableName);
        }

        foreach ($this->deleteProtectedTables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $this->createDeleteProtectionTrigger($tableName);
        }

        foreach ($this->updateProtectedTables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $this->createUpdateProtectionTrigger($tableName);
        }
    }

    public function down(): void
    {
        $allTables = array_values(array_unique([
            ...$this->trackedTables,
            ...$this->deleteProtectedTables,
            ...$this->updateProtectedTables,
        ]));

        foreach ($allTables as $tableName) {
            $this->dropTrigger($this->historyTriggerName($tableName, 'created'));
            $this->dropTrigger($this->historyTriggerName($tableName, 'updated'));
            $this->dropTrigger($this->historyTriggerName($tableName, 'deleted'));
            $this->dropTrigger($this->protectionTriggerName($tableName, 'delete'));
            $this->dropTrigger($this->protectionTriggerName($tableName, 'update'));
        }

        Schema::dropIfExists('immutable_history_entries');
    }

    private function createHistoryTriggers(string $tableName): void
    {
        $columns = Schema::getColumnListing($tableName);

        if (!in_array('id', $columns, true)) {
            return;
        }

        $newSnapshot = $this->jsonObjectExpression($columns, 'NEW');
        $oldSnapshot = $this->jsonObjectExpression($columns, 'OLD');

        $this->createTrigger(
            $this->historyTriggerName($tableName, 'created'),
            $tableName,
            'AFTER INSERT',
            $this->historyInsertStatement($tableName, 'NEW.id', 'created', 'NULL', $newSnapshot)
        );

        $this->createTrigger(
            $this->historyTriggerName($tableName, 'updated'),
            $tableName,
            'AFTER UPDATE',
            $this->historyInsertStatement($tableName, 'NEW.id', 'updated', $oldSnapshot, $newSnapshot)
        );

        $this->createTrigger(
            $this->historyTriggerName($tableName, 'deleted'),
            $tableName,
            'AFTER DELETE',
            $this->historyInsertStatement($tableName, 'OLD.id', 'deleted', $oldSnapshot, 'NULL')
        );
    }

    private function createDeleteProtectionTrigger(string $tableName): void
    {
        $this->createProtectionTrigger($tableName, 'delete');
    }

    private function createUpdateProtectionTrigger(string $tableName): void
    {
        $this->createProtectionTrigger($tableName, 'update');
    }

    private function createProtectionTrigger(string $tableName, string $action): void
    {
        $triggerName = $this->protectionTriggerName($tableName, $action);
        $this->dropTrigger($triggerName);

        $table = $this->quoteIdentifier($tableName);
        $event = strtoupper($action);
        $message = addslashes("{$tableName} is immutable and cannot be {$action}d.");
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER {$triggerName} BEFORE {$event} ON {$table} FOR EACH ROW BEGIN SELECT RAISE(ABORT, '{$message}'); END;"
            );

            return;
        }

        DB::unprepared(
            "CREATE TRIGGER {$triggerName} BEFORE {$event} ON {$table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$message}'"
        );
    }

    private function createTrigger(string $triggerName, string $tableName, string $timing, string $statement): void
    {
        $this->dropTrigger($triggerName);

        $table = $this->quoteIdentifier($tableName);
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER {$triggerName} {$timing} ON {$table} FOR EACH ROW BEGIN {$statement}; END;"
            );

            return;
        }

        DB::unprepared(
            "CREATE TRIGGER {$triggerName} {$timing} ON {$table} FOR EACH ROW {$statement}"
        );
    }

    private function historyInsertStatement(
        string $tableName,
        string $recordIdExpression,
        string $operation,
        string $oldSnapshotExpression,
        string $newSnapshotExpression,
    ): string {
        $historyTable = $this->quoteIdentifier('immutable_history_entries');

        return sprintf(
            "INSERT INTO %s (%s, %s, %s, %s, %s, %s) VALUES ('%s', %s, '%s', %s, %s, CURRENT_TIMESTAMP)",
            $historyTable,
            $this->quoteIdentifier('table_name'),
            $this->quoteIdentifier('record_id'),
            $this->quoteIdentifier('operation'),
            $this->quoteIdentifier('old_snapshot'),
            $this->quoteIdentifier('new_snapshot'),
            $this->quoteIdentifier('recorded_at'),
            $tableName,
            $recordIdExpression,
            $operation,
            $oldSnapshotExpression,
            $newSnapshotExpression,
        );
    }

    private function jsonObjectExpression(array $columns, string $rowAlias): string
    {
        $pairs = [];

        foreach ($columns as $column) {
            $pairs[] = sprintf("'%s', %s.%s", $column, $rowAlias, $this->quoteIdentifier($column));
        }

        return 'json_object(' . implode(', ', $pairs) . ')';
    }

    private function historyTriggerName(string $tableName, string $operation): string
    {
        return "immhist_{$tableName}_{$operation}";
    }

    private function protectionTriggerName(string $tableName, string $action): string
    {
        return "immguard_{$tableName}_{$action}";
    }

    private function dropTrigger(string $triggerName): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS {$triggerName}");
    }

    private function quoteIdentifier(string $identifier): string
    {
        $escaped = str_replace('`', '``', $identifier);

        return "`{$escaped}`";
    }
};