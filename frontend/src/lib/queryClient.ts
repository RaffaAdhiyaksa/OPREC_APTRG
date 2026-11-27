import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toApiError } from "@/lib/errors";

// Handled elsewhere: session errors by AuthProvider + route guards, 404 by each page's empty state.
const isHandledElsewhere = (status: number, code?: string) =>
  status === 401 ||
  status === 404 ||
  code === "ACCOUNT_INACTIVE" ||
  code === "PASSWORD_CHANGE_REQUIRED";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (rawError) => {
      const error = toApiError(rawError);
      if (!isHandledElsewhere(error.status, error.code)) toast.error(error.message);
    },
  }),
  defaultOptions: {
    queries: {
      // Retry only network failures and server errors; 4xx answers will not change.
      retry: (failureCount, error) => {
        const { status } = toApiError(error);
        return (status === 0 || status >= 500) && failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
