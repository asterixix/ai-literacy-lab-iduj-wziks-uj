"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { fadeInUp } from "@/lib/animations";
import type { Module } from "@/types";

export function ModuleCard({ module, compact = false }: { module: Module; compact?: boolean }) {
  return (
    <motion.article
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid gap-4 border border-border p-5 transition-colors hover:border-foreground/40 md:grid-cols-[88px_1fr] dark:hover:shadow-subtle"
    >
      <div className="text-5xl font-black text-muted-foreground">{String(module.number).padStart(2, "0")}</div>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{module.duration}</p>
          <h3 className="text-xl font-black tracking-tight">{module.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {module.tags.map((tag) => (
            <span key={tag} className="border border-border px-2 py-1 font-mono text-[11px] uppercase">
              {tag}
            </span>
          ))}
        </div>
        {!compact ? <p className="text-sm leading-relaxed text-muted-foreground">{module.description}</p> : null}
        <Link
          href={`/warsztaty/${module.slug}`}
          className="inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          Szczegóły →
        </Link>
      </div>
    </motion.article>
  );
}
