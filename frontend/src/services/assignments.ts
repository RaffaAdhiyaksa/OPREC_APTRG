import { isMocked } from "@/lib/env";
import { api } from "@/services/api";
import { mockAssignments } from "@/services/mock/assignments";
import type {
  Assignment,
  AssignmentListParams,
  AssignmentPayload,
  DataResponse,
  Grade,
  GradePayload,
  MyGrade,
  MyGradesSummary,
  Submission,
  SubmissionCounts,
  SubmissionRow,
  SubmitPayload,
} from "@/types/api";

export interface AssignmentsService {
  list(params: AssignmentListParams): Promise<Assignment[]>;
  get(id: number): Promise<Assignment>;
  /** Always created as draft. */
  create(payload: AssignmentPayload): Promise<Assignment>;
  update(id: number, payload: AssignmentPayload): Promise<Assignment>;
  publish(id: number): Promise<Assignment>;
  remove(id: number): Promise<void>;

  // Intern
  submit(id: number, payload: SubmitPayload, onProgress?: (percent: number) => void): Promise<Submission>;
  withdraw(id: number): Promise<void>;
  myGrades(): Promise<{ data: MyGrade[]; meta: MyGradesSummary }>;

  // Staff
  submissions(id: number): Promise<{ data: SubmissionRow[]; meta: SubmissionCounts }>;
  download(submissionId: number): Promise<{ blob: Blob; fileName: string }>;
  grade(assignmentId: number, userId: number, payload: GradePayload): Promise<Grade>;
  /** Empty `userIds` publishes every draft grade of the assignment. */
  publishGrades(assignmentId: number, userIds?: number[]): Promise<{ published: number }>;
  unpublishGrade(gradeId: number): Promise<Grade>;
}

function fileNameFrom(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

const realAssignments: AssignmentsService = {
  async list(params) {
    const { data } = await api.get<DataResponse<Assignment[]>>("/assignments", { params: { ...params, per_page: 100 } });
    return data.data;
  },
  async get(id) {
    const { data } = await api.get<DataResponse<Assignment>>(`/assignments/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post<DataResponse<Assignment>>("/assignments", payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.put<DataResponse<Assignment>>(`/assignments/${id}`, payload);
    return data.data;
  },
  async publish(id) {
    const { data } = await api.post<DataResponse<Assignment>>(`/assignments/${id}/publish`);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/assignments/${id}`);
  },
  async submit(id, payload, onProgress) {
    const form = new FormData();
    if (payload.file) form.append("file", payload.file);
    if (payload.drive_link) form.append("drive_link", payload.drive_link);
    if (payload.note) form.append("note", payload.note);
    const { data } = await api.post<DataResponse<Submission>>(`/assignments/${id}/submission`, form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
    return data.data;
  },
  async withdraw(id) {
    await api.delete(`/assignments/${id}/submission`);
  },
  async myGrades() {
    const { data } = await api.get<{ data: MyGrade[]; meta: MyGradesSummary }>("/me/grades");
    return data;
  },
  async submissions(id) {
    const { data } = await api.get<{ data: SubmissionRow[]; meta: SubmissionCounts }>(`/assignments/${id}/submissions`, {
      params: { per_page: 100 },
    });
    return data;
  },
  async download(submissionId) {
    const response = await api.get<Blob>(`/submissions/${submissionId}/download`, { responseType: "blob" });
    return { blob: response.data, fileName: fileNameFrom(response.headers["content-disposition"], `submission-${submissionId}`) };
  },
  async grade(assignmentId, userId, payload) {
    const { data } = await api.put<DataResponse<Grade>>(`/assignments/${assignmentId}/grades/${userId}`, payload);
    return data.data;
  },
  async publishGrades(assignmentId, userIds) {
    const { data } = await api.post<DataResponse<{ published: number }>>(`/assignments/${assignmentId}/grades/publish`, {
      user_ids: userIds?.length ? userIds : undefined,
    });
    return data.data;
  },
  async unpublishGrade(gradeId) {
    const { data } = await api.post<DataResponse<Grade>>(`/grades/${gradeId}/unpublish`);
    return data.data;
  },
};

export const assignmentsService = isMocked("assignments") ? mockAssignments : realAssignments;
