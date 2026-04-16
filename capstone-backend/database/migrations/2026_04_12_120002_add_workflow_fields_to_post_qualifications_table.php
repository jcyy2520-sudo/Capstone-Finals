<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('post_qualifications', function (Blueprint $table) {
            $table->string('invitation_reference')->nullable()->after('rank');
            $table->string('workflow_status', 40)->default('invitation_sent')->after('result');
            $table->timestamp('acknowledged_at')->nullable()->after('invitation_sent_at');
            $table->timestamp('submission_deadline_at')->nullable()->after('acknowledged_at');
            $table->timestamp('extension_deadline_at')->nullable()->after('submission_deadline_at');

            $table->json('required_documents')->nullable()->after('document_results');
            $table->json('submitted_documents')->nullable()->after('required_documents');
            $table->json('twg_evaluation')->nullable()->after('submitted_documents');
            $table->enum('twg_recommendation', ['pending', 'pass', 'fail'])->default('pending')->after('twg_evaluation');
            $table->text('twg_remarks')->nullable()->after('twg_recommendation');
            $table->text('non_compliance_reason')->nullable()->after('failure_reason');

            $table->foreignId('bac_resolution_id')->nullable()->after('report_path')
                ->constrained('bac_resolutions')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable()->after('completed_at');

            $table->index(['bid_opening_id', 'workflow_status']);
            $table->index('submission_deadline_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_qualifications', function (Blueprint $table) {
            $table->dropIndex(['bid_opening_id', 'workflow_status']);
            $table->dropIndex(['submission_deadline_at']);

            $table->dropForeign(['bac_resolution_id']);

            $table->dropColumn([
                'invitation_reference',
                'workflow_status',
                'acknowledged_at',
                'submission_deadline_at',
                'extension_deadline_at',
                'required_documents',
                'submitted_documents',
                'twg_evaluation',
                'twg_recommendation',
                'twg_remarks',
                'non_compliance_reason',
                'bac_resolution_id',
                'finalized_at',
            ]);
        });
    }
};
