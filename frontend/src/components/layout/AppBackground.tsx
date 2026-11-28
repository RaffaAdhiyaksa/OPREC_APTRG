/** Fixed team-photo backdrop of the lab website, softened so glass surfaces stay readable. */
export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-background" aria-hidden>
      <img
        src="/images/foto-anggota.webp"
        alt=""
        className="size-full object-cover object-[center_20%] opacity-20 dark:opacity-40"
      />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px] dark:bg-black/60" />
    </div>
  );
}
