<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

// First admin on a fresh server (the seeders never create accounts in production).
class CreateAdmin extends Command
{
    protected $signature = 'lms:create-admin {name? : Full name} {email? : Login email}';

    protected $description = 'Create an admin account with a one-time temporary password';

    public function handle(): int
    {
        $data = [
            'name' => $this->argument('name') ?? $this->ask('Nama'),
            'email' => $this->argument('email') ?? $this->ask('Email'),
        ];

        // Unique among non-deleted users only (same rule as POST /admin/users and the DB index).
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->withoutTrashed()],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $password = Str::password(16);
        User::create([...$data, 'role' => Role::Admin, 'password' => $password, 'must_change_password' => true]);

        $this->info("Admin {$data['email']} dibuat.");
        $this->line("Password sementara (hanya ditampilkan sekali): {$password}");
        $this->line('Admin wajib mengganti password saat login pertama.');

        return self::SUCCESS;
    }
}
