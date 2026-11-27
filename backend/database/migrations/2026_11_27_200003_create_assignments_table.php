<?php

use App\Enums\AssignmentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained();
            $table->foreignId('created_by')->constrained('users');
            $table->string('title');
            $table->longText('description');
            $table->dateTime('due_at');
            $table->boolean('allow_late')->default(false);
            $table->unsignedTinyInteger('max_file_size_mb')->default(10);
            $table->json('allowed_extensions')->nullable();
            $table->unsignedSmallInteger('max_score')->default(100);
            $table->enum('status', array_column(AssignmentStatus::cases(), 'value'))->default(AssignmentStatus::Draft->value);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['division_id', 'status', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
