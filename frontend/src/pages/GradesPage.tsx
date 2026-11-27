import { Link } from "react-router";
import { Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/shared/ListControls";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useMyGrades } from "@/hooks/queries/assignments";
import { formatDate } from "@/lib/date";

/** Intern's own grades. The API only returns published grades. */
export default function GradesPage() {
  const { data, isPending, isError, error, refetch } = useMyGrades();

  return (
    <>
      <PageHeader
        title="Nilai"
        description="Nilai yang sudah dipublikasikan asisten."
        stats={data ? [{ label: "Rata-rata", value: data.meta.average ?? "—" }, { label: "Tugas dinilai", value: data.meta.graded_count }] : undefined}
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !isPending && data.data.length === 0 ? (
        <EmptyState icon={Award} title="Belum ada nilai yang dipublikasikan." description="Nilai muncul di sini setelah asisten mempublikasikannya." />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Tugas</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="pr-5">Dipublikasikan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="px-5">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.data.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="pl-5 font-medium">
                        <Link to={`/assignments/${g.assignment.id}`} className="hover:underline">
                          {g.assignment.title}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="text-lg font-semibold">{g.score}</span>
                        <span className="text-muted-foreground">/{g.assignment.max_score}</span>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal text-muted-foreground">{g.feedback ?? "—"}</TableCell>
                      <TableCell className="pr-5 text-muted-foreground">{formatDate(g.published_at)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
