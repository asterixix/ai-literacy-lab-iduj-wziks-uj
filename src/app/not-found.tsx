import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-wide py-24">
      <p className="font-mono text-xs uppercase text-muted-foreground">404</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Nie znaleziono strony</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Ten adres nie istnieje lub materiał został przeniesiony.
      </p>
      <div className="mt-8">
        <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
          Wróć na stronę główną
        </Button>
      </div>
    </div>
  );
}
