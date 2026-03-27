"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { REGISTRATION_FORM_URL } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="container-wide">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
          <motion.p
            variants={fadeInUp}
            className="inline-block border border-border px-3 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground"
          >
            WZiKS · ID.UJ · 2026
          </motion.p>
          <motion.h1 variants={fadeInUp} className="text-6xl font-black tracking-tighter md:text-8xl">
            AI LITERACY LAB
          </motion.h1>
          <motion.p variants={fadeInUp} className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Warsztaty kompetencyjne ze sztucznej inteligencji dla studentów UJ.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col flex-wrap gap-3 sm:flex-row">
            <Button nativeButton={false} render={<Link href="/warsztaty" />}>
              Zobacz warsztaty →
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/materialy" />}>
              Pobierz materiały
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={
                <a href={REGISTRATION_FORM_URL} target="_blank" rel="noopener noreferrer" />
              }
            >
              Zapisz się na warsztaty →
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
