import { isDriveLink, MAX_UPLOAD_MB, SUBMISSION_EXTENSIONS } from "@/lib/submission";
import type { AssignmentsService } from "@/services/assignments";
import type { Assignment, AssignmentPayload, Grade, Me, Submission } from "@/types/api";
import {
  currentUser,
  db,
  delay,
  divisionRef,
  fail,
  forbidden,
  inScope,
  internsOf,
  invalid,
  isAdmin,
  isIntern,
  isStaff,
  nextId,
  notFound,
  notify,
  now,
  persist,
  personRef,
  userSummary,
  type AssignmentRow,
  type GradeRow,
  type SubmissionDbRow,
} from "./db";

const toSubmission = ({ assignment_id: _a, user_id: _u, ...row }: SubmissionDbRow): Submission => ({
  ...row,
  method: row.file_name && row.drive_link ? "both" : row.file_name ? "file" : "drive",
});

const toGrade = (g: GradeRow): Grade => ({
  id: g.id,
  score: g.score,
  feedback: g.feedback,
  status: g.status,
  published_at: g.published_at,
  graded_by: personRef(g.graded_by),
  updated_at: g.updated_at,
});

const submissionOf = (assignmentId: number, userId: number) =>
  db.submissions.find((s) => s.assignment_id === assignmentId && s.user_id === userId) ?? null;
const gradeOf = (assignmentId: number, userId: number) =>
  db.grades.find((g) => g.assignment_id === assignmentId && g.user_id === userId) ?? null;

const isPastDue = (a: AssignmentRow) => Date.now() > new Date(a.due_at).getTime();

function canSubmit(a: AssignmentRow, userId: number) {
  return a.status === "published" && (!isPastDue(a) || a.allow_late) && gradeOf(a.id, userId)?.status !== "published";
}

function toAssignment(a: AssignmentRow, viewer: Me): Assignment {
  const base: Assignment = {
    id: a.id,
    division: divisionRef(a.division_id)!,
    title: a.title,
    description: a.description,
    due_at: a.due_at,
    allow_late: a.allow_late,
    max_file_size_mb: a.max_file_size_mb,
    allowed_extensions: a.allowed_extensions,
    max_score: a.max_score,
    status: a.status,
    published_at: a.published_at,
    author: personRef(a.created_by),
    created_at: a.created_at,
  };

  if (isIntern(viewer)) {
    const submission = submissionOf(a.id, viewer.id);
    const grade = gradeOf(a.id, viewer.id);
    return {
      ...base,
      is_overdue: isPastDue(a),
      can_submit: canSubmit(a, viewer.id),
      my_submission: submission ? toSubmission(submission) : null,
      // Draft grades never leave the server for interns (CLAUDE.md §5.5).
      my_grade: grade?.status === "published" ? toGrade(grade) : null,
    };
  }

  const interns = internsOf(a.division_id).map((u) => u.id);
  const subs = db.submissions.filter((s) => s.assignment_id === a.id && interns.includes(s.user_id));
  const grades = db.grades.filter((g) => g.assignment_id === a.id && interns.includes(g.user_id));
  return {
    ...base,
    stats: {
      total_interns: interns.length,
      submitted: subs.length,
      late: subs.filter((s) => s.is_late).length,
      graded_draft: grades.filter((g) => g.status === "draft").length,
      graded_published: grades.filter((g) => g.status === "published").length,
    },
  };
}

function visible(a: AssignmentRow, me: Me) {
  return a.deleted_at === null && inScope(me, a.division_id) && (!isIntern(me) || a.status === "published");
}

const findVisible = (id: number, me: Me) => db.assignments.find((a) => a.id === id && visible(a, me)) ?? notFound();

function validate(payload: AssignmentPayload, me: Me, existing?: AssignmentRow) {
  const errors: Record<string, string[]> = {};
  const title = payload.title?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const due = new Date(payload.due_at);
  if (!title) errors.title = ["Judul wajib diisi."];
  else if (title.length > 255) errors.title = ["Judul maksimal 255 karakter."];
  if (!description) errors.description = ["Deskripsi wajib diisi."];
  if (Number.isNaN(due.getTime())) errors.due_at = ["Deadline wajib diisi."];
  else if (due.getTime() <= Date.now() && due.toISOString() !== existing?.due_at) errors.due_at = ["Deadline harus di masa depan."];
  if (!Number.isInteger(payload.max_file_size_mb) || payload.max_file_size_mb < 1 || payload.max_file_size_mb > MAX_UPLOAD_MB) {
    errors.max_file_size_mb = [`Batas ukuran file 1–${MAX_UPLOAD_MB} MB.`];
  }
  if (payload.allowed_extensions?.some((e) => !(SUBMISSION_EXTENSIONS as readonly string[]).includes(e))) {
    errors.allowed_extensions = ["Ekstensi tidak diizinkan."];
  }
  if (!Number.isInteger(payload.max_score) || payload.max_score < 1) errors.max_score = ["Nilai maksimal minimal 1."];

  let divisionId = existing?.division_id ?? me.research_division?.id ?? 0;
  if (isAdmin(me) && !existing) {
    const division = db.divisions.find((d) => d.id === payload.division_id);
    if (!division || division.type !== "research") errors.division_id = ["Divisi riset wajib dipilih."];
    else divisionId = division.id;
  }
  if (Object.keys(errors).length) invalid(errors);

  return {
    title,
    description,
    due_at: due.toISOString(),
    allow_late: payload.allow_late,
    max_file_size_mb: payload.max_file_size_mb,
    allowed_extensions: payload.allowed_extensions?.length ? payload.allowed_extensions : null,
    max_score: payload.max_score,
    division_id: divisionId,
  };
}

function requireStaffAssignment(id: number) {
  const me = currentUser();
  if (!isStaff(me)) forbidden();
  return { me, assignment: findVisible(id, me) };
}

async function simulateUpload(onProgress?: (percent: number) => void) {
  for (const percent of [8, 23, 41, 58, 76, 90, 100]) {
    await delay(160);
    onProgress?.(percent);
  }
}

export const mockAssignments: AssignmentsService = {
  async list({ status, search, due, division_id }) {
    await delay();
    const me = currentUser();
    const term = search?.trim().toLowerCase();
    return db.assignments
      .filter((a) => visible(a, me))
      .filter((a) => !isAdmin(me) || division_id === undefined || a.division_id === division_id)
      .filter((a) => !status || a.status === status)
      .filter((a) => !term || a.title.toLowerCase().includes(term))
      .filter((a) => !due || (due === "past" ? isPastDue(a) : !isPastDue(a)))
      .sort((a, b) => a.due_at.localeCompare(b.due_at))
      .map((a) => toAssignment(a, me));
  },

  async get(id) {
    await delay();
    const me = currentUser();
    return toAssignment(findVisible(id, me), me);
  },

  async create(payload) {
    await delay(450);
    const me = currentUser();
    if (!isStaff(me)) forbidden();
    const row: AssignmentRow = {
      id: nextId(db.assignments),
      created_by: me.id,
      status: "draft",
      published_at: null,
      created_at: now(),
      deleted_at: null,
      ...validate(payload, me),
    };
    db.assignments.push(row);
    persist();
    return toAssignment(row, me);
  },

  async update(id, payload) {
    await delay(450);
    const { me, assignment } = requireStaffAssignment(id);
    Object.assign(assignment, validate(payload, me, assignment));
    persist();
    return toAssignment(assignment, me);
  },

  async publish(id) {
    await delay();
    const { me, assignment } = requireStaffAssignment(id);
    if (assignment.status === "draft") {
      assignment.status = "published";
      assignment.published_at = now();
      notify(
        internsOf(assignment.division_id).map((u) => u.id),
        { type: "assignment_published", title: `Tugas baru: ${assignment.title}`, excerpt: assignment.description.slice(0, 120), link: `/assignments/${assignment.id}` },
      );
      persist();
    }
    return toAssignment(assignment, me);
  },

  async remove(id) {
    await delay();
    const { assignment } = requireStaffAssignment(id);
    assignment.deleted_at = now();
    persist();
  },

  async submit(id, { file, drive_link, note }, onProgress) {
    const me = currentUser();
    if (!isIntern(me)) forbidden();
    const assignment = findVisible(id, me);
    await delay(200);

    // Same order of checks as the backend (PRD §7.5).
    if (isPastDue(assignment) && !assignment.allow_late) fail(409, "DEADLINE_PASSED", "Deadline sudah lewat.");
    if (gradeOf(id, me.id)?.status === "published") fail(409, "GRADE_LOCKED", "Nilai sudah dipublikasikan, pengumpulan dikunci.");

    const errors: Record<string, string[]> = {};
    const link = drive_link?.trim() || null;
    if (!file && !link) errors.file = ["Unggah file atau isi link Google Drive."];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const allowed = assignment.allowed_extensions ?? [...SUBMISSION_EXTENSIONS];
      if (!allowed.includes(ext)) errors.file = [`Format file harus: ${allowed.join(", ")}.`];
      if (file.size > assignment.max_file_size_mb * 1024 * 1024) {
        fail(422, "FILE_TOO_LARGE", `Ukuran file melebihi batas ${assignment.max_file_size_mb} MB. Gunakan link Google Drive.`, {
          file: [`Ukuran file maksimal ${assignment.max_file_size_mb} MB.`],
        });
      }
    }
    if (link && !isDriveLink(link)) errors.drive_link = ["Link harus HTTPS dari drive.google.com atau docs.google.com."];
    if (note && note.length > 1000) errors.note = ["Catatan maksimal 1000 karakter."];
    if (Object.keys(errors).length) invalid(errors);

    if (file) await simulateUpload(onProgress);

    const submittedAt = now();
    const existing = submissionOf(id, me.id);
    const fields = {
      // Resubmitting replaces the old file (the backend deletes it from storage).
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      mime_type: file?.type || null,
      drive_link: link,
      note: note?.trim() || null,
      is_late: Date.parse(submittedAt) > Date.parse(assignment.due_at),
      submitted_at: submittedAt,
    };
    let row: SubmissionDbRow;
    if (existing) {
      row = Object.assign(existing, fields);
    } else {
      row = { id: nextId(db.submissions), assignment_id: id, user_id: me.id, ...fields };
      db.submissions.push(row);
    }
    persist();
    return toSubmission(row);
  },

  async withdraw(id) {
    await delay();
    const me = currentUser();
    if (!isIntern(me)) forbidden();
    const assignment = findVisible(id, me);
    const submission = submissionOf(id, me.id) ?? notFound();
    if (isPastDue(assignment)) fail(409, "DEADLINE_PASSED", "Deadline sudah lewat, pengumpulan tidak bisa ditarik.");
    if (gradeOf(id, me.id)?.status === "published") fail(409, "GRADE_LOCKED", "Nilai sudah dipublikasikan, pengumpulan dikunci.");
    db.submissions = db.submissions.filter((s) => s !== submission);
    persist();
  },

  async myGrades() {
    await delay();
    const me = currentUser();
    if (!isIntern(me)) forbidden();
    const data = db.grades
      .filter((g) => g.user_id === me.id && g.status === "published")
      .map((g) => ({ g, a: db.assignments.find((a) => a.id === g.assignment_id && a.deleted_at === null) }))
      .filter((x): x is { g: GradeRow; a: AssignmentRow } => Boolean(x.a))
      .sort((x, y) => (y.g.published_at ?? "").localeCompare(x.g.published_at ?? ""))
      .map(({ g, a }) => ({
        id: g.id,
        assignment: { id: a.id, title: a.title, max_score: a.max_score },
        score: g.score,
        feedback: g.feedback,
        published_at: g.published_at!,
      }));
    const average = data.length ? data.reduce((sum, x) => sum + (x.score / x.assignment.max_score) * 100, 0) / data.length : null;
    return { data, meta: { average: average === null ? null : Math.round(average * 10) / 10, graded_count: data.length } };
  },

  async submissions(id) {
    await delay();
    const { assignment } = requireStaffAssignment(id);
    const rows = internsOf(assignment.division_id)
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map((u) => {
        const submission = submissionOf(id, u.id);
        const grade = gradeOf(id, u.id);
        return { user: userSummary(u), submission: submission ? toSubmission(submission) : null, grade: grade ? toGrade(grade) : null };
      });
    const submitted = rows.filter((r) => r.submission);
    return {
      data: rows,
      meta: {
        total: rows.length,
        submitted: submitted.length,
        missing: rows.length - submitted.length,
        late: submitted.filter((r) => r.submission!.is_late).length,
        graded_draft: rows.filter((r) => r.grade?.status === "draft").length,
        graded_published: rows.filter((r) => r.grade?.status === "published").length,
      },
    };
  },

  async download(submissionId) {
    await delay();
    const me = currentUser();
    const submission = db.submissions.find((s) => s.id === submissionId) ?? notFound();
    const assignment = findVisible(submission.assignment_id, me);
    if (isIntern(me) && submission.user_id !== me.id) notFound();
    if (!submission.file_name) notFound();
    const content = `Berkas contoh (mock) untuk "${submission.file_name}" pada tugas "${assignment.title}".`;
    return { blob: new Blob([content], { type: "text/plain" }), fileName: `${submission.file_name}.txt` };
  },

  async grade(assignmentId, userId, { score, feedback }) {
    await delay(350);
    const { me, assignment } = requireStaffAssignment(assignmentId);
    if (!internsOf(assignment.division_id).some((u) => u.id === userId)) notFound();
    if (!Number.isFinite(score) || score < 0 || score > assignment.max_score) {
      invalid({ score: [`Nilai harus 0–${assignment.max_score}.`] });
    }

    const existing = gradeOf(assignmentId, userId);
    const fields = { score: Math.round(score * 100) / 100, feedback: feedback?.trim() || null, graded_by: me.id, updated_at: now() };
    let row: GradeRow;
    if (existing) {
      row = Object.assign(existing, fields);
      // Editing a published grade keeps it published and tells the intern.
      if (row.status === "published") {
        notify([userId], { type: "grade_updated", title: `Nilai ${assignment.title} diperbarui`, excerpt: `Skor: ${row.score}`, link: `/assignments/${assignmentId}` });
      }
    } else {
      row = {
        id: nextId(db.grades),
        assignment_id: assignmentId,
        user_id: userId,
        submission_id: submissionOf(assignmentId, userId)?.id ?? null,
        status: "draft",
        published_at: null,
        ...fields,
      };
      db.grades.push(row);
    }
    persist();
    return toGrade(row);
  },

  async publishGrades(assignmentId, userIds) {
    await delay(450);
    const { assignment } = requireStaffAssignment(assignmentId);
    const drafts = db.grades.filter(
      (g) => g.assignment_id === assignmentId && g.status === "draft" && (!userIds?.length || userIds.includes(g.user_id)),
    );
    const at = now();
    for (const grade of drafts) {
      grade.status = "published";
      grade.published_at = at;
      notify([grade.user_id], { type: "grade_published", title: `Nilai ${assignment.title} sudah keluar`, excerpt: `Skor: ${grade.score}`, link: `/assignments/${assignmentId}` });
    }
    persist();
    return { published: drafts.length };
  },

  async unpublishGrade(gradeId) {
    await delay();
    const me = currentUser();
    if (!isStaff(me)) forbidden();
    const grade = db.grades.find((g) => g.id === gradeId) ?? notFound();
    findVisible(grade.assignment_id, me);
    grade.status = "draft";
    grade.published_at = null;
    persist();
    return toGrade(grade);
  },
};
