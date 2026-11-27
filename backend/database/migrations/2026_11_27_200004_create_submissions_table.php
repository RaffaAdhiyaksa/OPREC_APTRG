<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('drive_link', 2048)->nullable();
            $table->text('note')->nullable();
            $table->boolean('is_late')->default(false);
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['assignment_id', 'user_id']);
        });

        // Hybrid submission rule enforced at DB level too. MySQL 8.0.16+ enforces CHECK constraints.
        DB::statement('ALTER TABLE submissions ADD CONSTRAINT submissions_file_or_link_check CHECK (file_path IS NOT NULL OR drive_link IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
