"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

const stats = [
  { value: 30, suffix: "", label: "Uczestników warsztatów" },
  { value: 5, suffix: "", label: "Modułów tematycznych" },
  { value: 10, suffix: "h", label: "Praktycznych zajęć" },
  { value: 200, suffix: "", label: "Uczestników wykładu otwartego" },
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
      <div className="container-wide grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="border border-border p-5">
            <p className="text-4xl font-black tracking-tight">
              <CountUp target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
