<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradeStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\GradeResource;
use App\Http\Resources\SubmissionResource;
use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SubmissionController extends Controller
{
    private const DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

    // POST /assignments/{assignment}/submission. Check order follows PRD §7.5.
    public function store(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();
        Gate::authorize('view', $assignment);

        if ($assignment->isOverdue() && ! $assignment->allow_late) {
            return $this->fail(409, 'DEADLINE_PASSED', 'Deadline sudah lewat.');
        }
        if ($this->gradeIsPublished($assignment, $user)) {
            return $this->fail(409, 'GRADE_LOCKED', 'Nilai sudah dipublikasikan, pengumpulan dikunci.');
        }

        // Checked before the other rules so the intern gets the Drive fallback hint, not a generic error.
        // UPLOAD_ERR_INI_SIZE: PHP already dropped a file above upload_max_filesize.
        $file = $request->file('file');
        $maxMb = $assignment->max_file_size_mb;
        if ($file && ($file->getError() === UPLOAD_ERR_INI_SIZE || ($file->isValid() && $file->getSize() > $maxMb * 1024 * 1024))) {
            return $this->fail(422, 'FILE_TOO_LARGE', "Ukuran file melebihi batas {$maxMb} MB. Unggah ke Google Drive lalu kirim link-nya.", 'file', [
                'max_file_size_mb' => $maxMb,
                'fallback' => 'drive_link',
            ]);
        }

        $extensions = implode(',', $assignment->allowed_extensions ?? config('lms.submission_extensions'));
        $data = $request->validate([
            // mimes checks the file content; extensions checks the name, so a renamed .exe fails both ways.
            'file' => ['required_without:drive_link', 'nullable', 'file', 'max:'.($maxMb * 1024), 'mimes:'.$extensions, 'extensions:'.$extensions],
            'drive_link' => ['required_without:file', 'nullable', 'string', 'max:2048', 'url:https', function (string $attribute, mixed $value, \Closure $fail) {
                if (! in_array(strtolower((string) parse_url($value, PHP_URL_HOST)), self::DRIVE_HOSTS, true)) {
                    $fail('Link harus dari drive.google.com atau docs.google.com.');
                }
            }],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $path = $file?->storeAs("submissions/{$assignment->id}", Str::uuid().'.'.$file->extension(), 'local');

        try {
            [$submission, $oldPath] = DB::transaction(function () use ($assignment, $user, $file, $path, $data) {
                // Row lock: two quick resubmits run one after the other, so each sees the file the
                // other stored as "old" and no file is left orphaned on disk.
                $oldPath = $assignment->submissions()->where('user_id', $user->id)->lockForUpdate()->value('file_path');

                $submission = Submission::updateOrCreate(
                    ['assignment_id' => $assignment->id, 'user_id' => $user->id],
                    [
                        'file_path' => $path ?: null,
                        'file_name' => $file ? $this->safeName($file->getClientOriginalName()) : null,
                        'file_size' => $file?->getSize(),
                        'mime_type' => $file?->getMimeType(),
                        'drive_link' => $data['drive_link'] ?? null,
                        'note' => $data['note'] ?? null,
                        'is_late' => $assignment->isOverdue(),
                        'submitted_at' => now(),
                    ],
                );

                return [$submission, $oldPath];
            });
        } catch (Throwable $e) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $e;
        }

        // Only after the new row is committed, so a failed resubmit never loses the old file.
        if ($oldPath && $oldPath !== $path) {
            Storage::disk('local')->delete($oldPath);
        }

        return (new SubmissionResource($submission))
            ->additional(['message' => 'Tugas berhasil dikumpulkan.'])
            ->response()
            ->setStatusCode($submission->wasRecentlyCreated ? 201 : 200);
    }

    // GET /assignments/{assignment}/submission → { data: <Submission> | null }
    public function show(Request $request, Assignment $assignment): JsonResponse
    {
        Gate::authorize('view', $assignment);
        $submission = $assignment->submissions()->where('user_id', $request->user()->id)->first();

        return response()->json(['data' => $submission ? new SubmissionResource($submission) : null]);
    }

    // DELETE /assignments/{assignment}/submission: withdraw before the deadline, while the grade is unpublished.
    public function destroy(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();
        Gate::authorize('view', $assignment);
        $submission = $assignment->submissions()->where('user_id', $user->id)->firstOrFail();

        if ($assignment->isOverdue()) {
            return $this->fail(409, 'DEADLINE_PASSED', 'Deadline sudah lewat, pengumpulan tidak bisa ditarik.');
        }
        if ($this->gradeIsPublished($assignment, $user)) {
            return $this->fail(409, 'GRADE_LOCKED', 'Nilai sudah dipublikasikan, pengumpulan dikunci.');
        }

        $submission->delete();
        if ($submission->file_path) {
            Storage::disk('local')->delete($submission->file_path);
        }

        return response()->json(['message' => 'Pengumpulan ditarik.']);
    }

    // GET /assignments/{assignment}/submissions: every active intern of the division, submitted or not.
    public function index(Request $request, Assignment $assignment): JsonResponse
    {
        Gate::authorize('update', $assignment);

        $interns = $assignment->interns()->orderBy('name')->get(['id', 'name', 'email', 'nim']);
        $submissions = $assignment->submissions()->whereIn('user_id', $interns->modelKeys())->get()->keyBy('user_id');
        $grades = $assignment->grades()->with('grader')->whereIn('user_id', $interns->modelKeys())->get()->keyBy('user_id');

        $rows = $interns->map(fn (User $intern) => [
            'user' => $intern->only(['id', 'name', 'email', 'nim']),
            'submission' => $submissions->get($intern->id),
            'grade' => $grades->get($intern->id),
        ]);

        $is = [
            'submitted' => fn ($r) => $r['submission'] !== null,
            'missing' => fn ($r) => $r['submission'] === null,
            'late' => fn ($r) => (bool) $r['submission']?->is_late,
            'graded_draft' => fn ($r) => $r['grade']?->status === GradeStatus::Draft,
            'graded_published' => fn ($r) => $r['grade']?->status === GradeStatus::Published,
        ];

        $term = Str::lower((string) $request->search);
        $filtered = $rows
            ->when(isset($is[$request->status]), fn ($c) => $c->filter($is[$request->status]))
            ->when($term !== '', fn ($c) => $c->filter(fn ($r) => Str::contains(Str::lower($r['user']['name'].' '.$r['user']['nim'].' '.$r['user']['email']), $term)));

        return response()->json([
            'data' => $filtered->values()->map(fn ($r) => [
                'user' => $r['user'],
                'submission' => $r['submission'] ? new SubmissionResource($r['submission']) : null,
                'grade' => $r['grade'] ? new GradeResource($r['grade']) : null,
            ]),
            'meta' => ['total' => $rows->count(), ...array_map(fn ($check) => $rows->filter($check)->count(), $is)],
        ]);
    }

    // GET /submissions/{submission}/download: private file as an attachment with its original name.
    public function download(Submission $submission): StreamedResponse
    {
        Gate::authorize('view', $submission);
        abort_unless($submission->file_path && Storage::disk('local')->exists($submission->file_path), 404);

        return Storage::disk('local')->download($submission->file_path, $submission->file_name, [
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function gradeIsPublished(Assignment $assignment, User $user): bool
    {
        return $assignment->grades()->where('user_id', $user->id)->where('status', GradeStatus::Published)->exists();
    }

    // Keeps letters, digits, dot, dash, underscore and space; strips paths and header-breaking characters.
    private function safeName(string $name): string
    {
        $clean = preg_replace('/[^\pL\pN._ -]+/u', '_', basename(str_replace('\\', '/', $name)));

        return Str::limit(trim((string) $clean, ' .') ?: 'file', 200, '');
    }
}
