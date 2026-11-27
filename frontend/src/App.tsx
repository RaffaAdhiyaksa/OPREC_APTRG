import logo from "@/assets/aptrg_logo.png";

// Temporary placeholder. Routing (React Router) and pages are added in the feature phase.
export default function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <img src={logo} alt="APTRG" className="h-20 w-auto" />
      <h1 className="text-2xl font-bold">APTRG LMS</h1>
      <p className="text-sm text-muted-foreground">Frontend scaffold siap. Fitur menyusul.</p>
    </main>
  );
}
