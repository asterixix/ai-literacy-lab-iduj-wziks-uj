import Link from "next/link";

import { ModuleCard } from "@/components/ModuleCard";
import { Button } from "@/components/ui/button";
import { modules } from "@/lib/modules";

export function ModulesPreviewSection() {
  return (
    <section className="py-16">
      <div className="container-wide space-y-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Warsztaty</h2>
          <Button nativeButton={false} variant="outline" render={<Link href="/warsztaty" />}>
            Zobacz pełne warsztaty →
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {modules.slice(0, 3).map((module) => (
            <ModuleCard key={module.slug} module={module} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
