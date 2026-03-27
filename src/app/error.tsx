"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-wide py-24">
      <h1 className="text-4xl font-black tracking-tight">Wystąpił nieoczekiwany błąd</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Spróbuj odświeżyć widok. Jeśli problem się powtarza, wróć do strony głównej.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Spróbuj ponownie</Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
          Strona główna
        </Button>
      </div>
    </div>
  );
}
