import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/States";

// Route skeleton. Each page is replaced by its real implementation in phases F4–F7.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Construction} title="Halaman ini dibangun di fase berikutnya." />
    </>
  );
}
