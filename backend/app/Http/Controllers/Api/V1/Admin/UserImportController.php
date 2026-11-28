<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\DivisionType;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use SplFileObject;

// POST /admin/users/import: CSV name,email,nim,phone,role,division_slug. All rows or none.
class UserImportController extends Controller
{
    private const HEADER = ['name', 'email', 'nim', 'phone', 'role', 'division_slug'];

    private const MAX_ROWS = 200;

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:1024']]);

        $rows = $this->readRows($request->file('file')->getRealPath());
        if ($rows === null) {
            return $this->fail(422, 'IMPORT_INVALID', 'Header CSV harus: '.implode(',', self::HEADER).'.', '1');
        }
        if (count($rows) === 0) {
            return $this->fail(422, 'IMPORT_INVALID', 'File CSV tidak berisi data.', 'file');
        }
        if (count($rows) > self::MAX_ROWS) {
            return $this->fail(422, 'IMPORT_TOO_LARGE', 'Maksimal '.self::MAX_ROWS.' baris per import.', 'file');
        }

        $errors = $this->validateRows($rows);
        if ($errors) {
            return response()->json([
                'message' => count($errors).' baris tidak valid. Tidak ada user yang dibuat.',
                'code' => 'IMPORT_INVALID',
                'errors' => $errors,
            ], 422);
        }

        // shortcut: one bcrypt hash per row (~0.2 s each at cost 12), so 200 rows need ~40 s; upgrade to a queued job if imports grow.
        set_time_limit(180);
        $divisions = Division::where('type', DivisionType::Research)->pluck('id', 'slug');

        $created = DB::transaction(fn () => collect($rows)->map(function (array $row) use ($divisions) {
            $password = Str::password(12);
            User::create([
                'name' => $row['name'],
                'email' => $row['email'],
                'nim' => $row['nim'],
                'phone' => $row['phone'],
                'role' => $row['role'],
                'research_division_id' => $row['role'] === Role::Admin->value ? null : $divisions[$row['division_slug']],
                'password' => $password,
                'must_change_password' => true,
            ]);

            return ['name' => $row['name'], 'email' => $row['email'], 'temporary_password' => $password];
        })->values()->all());

        return response()->json([
            'data' => ['created_count' => count($created), 'users' => $created],
            'message' => count($created).' user berhasil dibuat.',
        ], 201);
    }

    // Rows keyed by their line number in the file (header = line 1). Null when the header is wrong.
    private function readRows(string $path): ?array
    {
        $file = new SplFileObject($path);
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::READ_AHEAD | SplFileObject::DROP_NEW_LINE);

        $rows = [];
        foreach ($file as $index => $cells) {
            $cells = array_map(fn ($cell) => trim((string) $cell), $cells);
            if (! isset($header)) {
                $cells[0] = preg_replace('/^\xEF\xBB\xBF/', '', $cells[0]); // Excel's UTF-8 BOM
                $header = array_map('strtolower', $cells);
                if ($header !== self::HEADER) {
                    return null;
                }

                continue;
            }
            $values = array_pad(array_slice($cells, 0, count(self::HEADER)), count(self::HEADER), '');
            $rows[$index + 1] = array_map(fn ($v) => $v === '' ? null : $v, array_combine(self::HEADER, $values));
        }

        return $rows;
    }

    // Same rules as POST /admin/users, plus duplicates inside the file. Returns [line => [messages]].
    private function validateRows(array $rows): array
    {
        $errors = [];
        $seen = ['email' => [], 'nim' => []];

        foreach ($rows as $line => $row) {
            $messages = Validator::make($row, [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique('users')->withoutTrashed()],
                'nim' => ['nullable', 'string', 'max:30', Rule::unique('users')->withoutTrashed()],
                'phone' => ['nullable', 'string', 'max:30'],
                'role' => ['required', Rule::enum(Role::class)],
                'division_slug' => [
                    Rule::requiredIf($row['role'] !== Role::Admin->value),
                    'nullable',
                    Rule::exists('divisions', 'slug')->where('type', DivisionType::Research->value),
                ],
            ], [], ['division_slug' => 'divisi riset'])->errors()->all();

            foreach (['email', 'nim'] as $field) {
                $key = Str::lower((string) $row[$field]);
                if ($key !== '' && isset($seen[$field][$key])) {
                    $messages[] = strtoupper($field === 'nim' ? 'NIM' : 'Email')." sama dengan baris {$seen[$field][$key]}.";
                }
                $seen[$field][$key] ??= $line;
            }

            if ($messages) {
                $errors[(string) $line] = $messages;
            }
        }

        return $errors;
    }
}
