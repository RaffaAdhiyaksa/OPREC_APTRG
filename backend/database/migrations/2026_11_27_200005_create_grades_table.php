<?php

use App\Enums\GradeStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('submission_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('graded_by')->constrained('users');
            $table->decimal('score', 5, 2);
            $table->text('feedback')->nullable();
            $table->enum('status', array_column(GradeStatus::cases(), 'value'))->default(GradeStatus::Draft->value);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
