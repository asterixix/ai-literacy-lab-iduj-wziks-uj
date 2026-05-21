"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

const stats = [
  { value: 33, suffix: "", label: "Studentów UJ zapisanych na warsztaty" },
  { value: 26, suffix: "", label: "Studentów z certyfikatem ukończenia" },
  { value: 40, suffix: "", label: "Uczestników wykładu otwartego" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (latest) => Math.round(latest));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, target, { duration: 1.1, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, target, value]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="border-b border-border py-12">
      <div className="container-wide space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase text-muted-foreground">Podsumowanie</p>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Edycja 2026 w liczbach</h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="border border-border p-5">
            <p className="text-4xl font-black tracking-tight">
              <CountUp target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </article>
        ))}
        </div>
      </div>
    </section>
  );
}
