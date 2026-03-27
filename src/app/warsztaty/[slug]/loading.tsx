export default function LoadingWarsztatyDetailPage() {
  return (
    <div className="container-wide py-12">
      <div className="h-4 w-40 animate-pulse bg-muted" />
      <div className="mt-6 h-10 w-3/4 animate-pulse bg-muted" />
      <div className="mt-4 h-5 w-1/2 animate-pulse bg-muted" />
      <div className="mt-10 space-y-4">
        <div className="h-5 w-full animate-pulse bg-muted" />
        <div className="h-5 w-5/6 animate-pulse bg-muted" />
        <div className="h-5 w-2/3 animate-pulse bg-muted" />
      </div>
    </div>
  );
}
