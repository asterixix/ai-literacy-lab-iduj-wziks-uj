import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Material } from "@/types";

export function MaterialCard({
  material,
  readUrl,
  downloadUrl,
}: {
  material: Material;
  readUrl?: string;
  downloadUrl?: string;
}) {
  if (readUrl) {
    return (
      <article className="space-y-4 border border-border p-5">
        <div className="flex items-center justify-between">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <p className="font-mono text-xs uppercase text-muted-foreground">{material.formats.join(" · ")}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black tracking-tight">{material.title}</h3>
          <p className="text-sm text-muted-foreground">{material.description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button nativeButton={false} variant="outline" className="w-full" render={<Link href={readUrl} />}>
            Czytaj materiał →
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full"
            render={<Link href={downloadUrl ?? readUrl} />}
          >
            Pobierz plik
          </Button>
        </div>
      </article>
    );
  }

  const disabled = !material.available;
  const button = (
    <Button variant={disabled ? "outline" : "default"} disabled={disabled} className="w-full">
      Pobierz
    </Button>
  );

  return (
    <article className="space-y-4 border border-border p-5">
      <div className="flex items-center justify-between">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        <p className="font-mono text-xs uppercase text-muted-foreground">{material.formats.join(" · ")}</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black tracking-tight">{material.title}</h3>
        <p className="text-sm text-muted-foreground">{material.description}</p>
      </div>
      {disabled ? (
        <Tooltip>
          <TooltipTrigger render={<div>{button}</div>} />
          <TooltipContent>Dostępne po zakończeniu projektu — {material.availableDate}</TooltipContent>
        </Tooltip>
      ) : (
        <Link href={material.downloadUrl ?? "#"}>{button}</Link>
      )}
    </article>
  );
}
