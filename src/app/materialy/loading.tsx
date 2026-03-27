export default function LoadingMaterialsPage() {
  return (
    <div className="container-wide py-14">
      <div className="h-11 w-96 animate-pulse bg-muted" />
      <div className="mt-4 h-6 w-80 animate-pulse bg-muted" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse border border-border bg-muted" />
        ))}
      </div>
    </div>
  );
}
