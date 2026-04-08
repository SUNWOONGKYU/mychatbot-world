export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
      <div className="animate-pulse space-y-4 w-full max-w-md p-8">
        <div className="h-8 bg-[rgb(var(--bg-muted))] rounded w-3/4"></div>
        <div className="h-4 bg-[rgb(var(--bg-muted))] rounded w-full"></div>
        <div className="h-4 bg-[rgb(var(--bg-muted))] rounded w-5/6"></div>
      </div>
    </div>
  );
}
