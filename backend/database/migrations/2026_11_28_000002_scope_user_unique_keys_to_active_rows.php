<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// email/nim are unique among *non-deleted* users only, so a soft-deleted account frees its email
// and NIM for a new account. A virtual column is NULL for deleted rows, and a MySQL unique index
// allows any number of NULLs. Restoring a user whose email is taken again fails on this index.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropUnique(['nim']);
            $table->index('email');
            $table->index('nim');
            $table->string('active_email')->nullable()->virtualAs('IF(deleted_at IS NULL, email, NULL)')->unique();
            $table->string('active_nim')->nullable()->virtualAs('IF(deleted_at IS NULL, nim, NULL)')->unique();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['active_email', 'active_nim']);
            $table->dropIndex(['email']);
            $table->dropIndex(['nim']);
            $table->unique('email');
            $table->unique('nim');
        });
    }
};
