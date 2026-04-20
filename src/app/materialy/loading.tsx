export default function LoadingMaterialsPage() {
  const skeletonIds = ["material-card-1", "material-card-2", "material-card-3", "material-card-4"];

  return (
    <div className="container-wide py-14">
      <div className="h-11 w-96 animate-pulse bg-muted" />
      <div className="mt-4 h-6 w-80 animate-pulse bg-muted" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {skeletonIds.map((id) => (
          <div key={id} className="h-48 animate-pulse border border-border bg-muted" />
        ))}
      </div>
    </div>
  );
}
