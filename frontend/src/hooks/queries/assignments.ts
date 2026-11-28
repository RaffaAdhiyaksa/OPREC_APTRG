import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { assignmentsService } from "@/services/assignments";
import type { AssignmentListParams, AssignmentPayload, GradePayload, SubmitPayload } from "@/types/api";

export function useAssignments(params: AssignmentListParams = {}) {
  return useQuery({ queryKey: queryKeys.assignments(params), queryFn: () => assignmentsService.list(params) });
}

export function useAssignment(id: number) {
  return useQuery({
    queryKey: queryKeys.assignment(id),
    queryFn: () => assignmentsService.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useAssignmentSubmissions(id: number) {
  return useQuery({ queryKey: queryKeys.submissions(id), queryFn: () => assignmentsService.submissions(id) });
}

export function useMyGrades() {
  return useQuery({ queryKey: queryKeys.myGrades, queryFn: assignmentsService.myGrades });
}

/** Every assignment-related view (lists, detail, submissions, stats, my grades, admin dashboard). */
function useInvalidateAssignments() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.assignmentsAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myGrades }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
    ]);
}

export function useSaveAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: async ({ id, payload, publish }: { id?: number; payload: AssignmentPayload; publish: boolean }) => {
      const saved = id ? await assignmentsService.update(id, payload) : await assignmentsService.create(payload);
      return publish && saved.status === "draft" ? assignmentsService.publish(saved.id) : saved;
    },
    onSettled: invalidate,
  });
}

export function usePublishAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({ mutationFn: (id: number) => assignmentsService.publish(id), onSuccess: invalidate });
}

export function useDeleteAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({ mutationFn: (id: number) => assignmentsService.remove(id), onSuccess: invalidate });
}

export function useSubmitAssignment(id: number) {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({ payload, onProgress }: { payload: SubmitPayload; onProgress?: (percent: number) => void }) =>
      assignmentsService.submit(id, payload, onProgress),
    onSuccess: invalidate,
  });
}

export function useWithdrawSubmission(id: number) {
  const invalidate = useInvalidateAssignments();
  return useMutation({ mutationFn: () => assignmentsService.withdraw(id), onSuccess: invalidate });
}

export function useGradeSubmission(assignmentId: number) {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: async ({ userId, payload, publish }: { userId: number; payload: GradePayload; publish: boolean }) => {
      const grade = await assignmentsService.grade(assignmentId, userId, payload);
      if (publish && grade.status === "draft") await assignmentsService.publishGrades(assignmentId, [userId]);
      return grade;
    },
    onSettled: invalidate,
  });
}

export function usePublishGrades(assignmentId: number) {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (userIds?: number[]) => assignmentsService.publishGrades(assignmentId, userIds),
    onSuccess: invalidate,
  });
}

export function useUnpublishGrade() {
  const invalidate = useInvalidateAssignments();
  return useMutation({ mutationFn: (gradeId: number) => assignmentsService.unpublishGrade(gradeId), onSuccess: invalidate });
}
