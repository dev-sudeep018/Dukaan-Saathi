import { motion } from "motion/react";
import { Mic } from "lucide-react";

/* Reveal-on-scroll wrapper. Motion already honors prefers-reduced-motion by
   shrinking transforms, and our CSS zeroes durations, so this stays gentle. */
export function Reveal({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Section shell with consistent vertical rhythm + optional id anchor. */
export function Section({ id, className = "", children }) {
  return (
    <section id={id} className={`relative px-5 py-20 sm:px-8 md:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className = "" }) {
  return (
    <p
      className={`font-sans text-xs font-semibold uppercase tracking-[0.18em] text-terracotta sm:text-sm ${className}`}
    >
      {children}
    </p>
  );
}

/* The physical phone shell used by the hero + how-it-works mockups. */
export function PhoneShell({ children, className = "" }) {
  return (
    <div
      className={`relative w-full max-w-[300px] rounded-[2.4rem] border-[10px] border-shopfront bg-shopfront p-0 shadow-[var(--shadow-phone)] ${className}`}
    >
      {/* speaker notch */}
      <div className="absolute left-1/2 top-2 z-20 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20" />
      <div className="relative h-[560px] overflow-hidden rounded-[1.7rem] bg-[#0b141a]">
        {/* WhatsApp-style top bar */}
        <div className="flex items-center gap-3 bg-shopfront-700 px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-marigold text-sm font-bold text-shopfront">
            दु
          </div>
          <div className="leading-tight">
            <p className="font-sans text-sm font-semibold text-paper">
              Dukaan Saathi
            </p>
            <p className="text-[11px] text-leaf">● online</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* A single chat bubble. side = "in" (assistant, left) | "out" (owner, right) */
export function Bubble({ side = "in", children, className = "" }) {
  const isOut = side === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug shadow-sm ${
          isOut
            ? "rounded-br-md bg-[#005c4b] text-paper"
            : "rounded-bl-md bg-white text-ink"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* Voice-note bubble with an animated waveform. */
export function VoiceNote({ side = "out", duration = "0:06" }) {
  const isOut = side === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[82%] items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
          isOut ? "rounded-br-md bg-[#005c4b]" : "rounded-bl-md bg-white"
        }`}
      >
        <Mic className={`h-4 w-4 ${isOut ? "text-marigold" : "text-terracotta"}`} />
        <Waveform tone={isOut ? "light" : "dark"} />
        <span className={`text-[11px] ${isOut ? "text-paper/70" : "text-ink/50"}`}>
          {duration}
        </span>
      </div>
    </div>
  );
}

export function Waveform({ tone = "light", bars = 22 }) {
  const color = tone === "light" ? "bg-marigold" : "bg-terracotta";
  return (
    <div className="flex h-6 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`wave-bar w-[2px] rounded-full ${color}`}
          style={{
            height: `${8 + ((i * 7) % 16)}px`,
            animationDelay: `${(i % 8) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3">
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}

/* A tidy "structured result" card the AI emits after parsing input. */
export function ResultCard({ rows, title = "Logged", tone = "leaf" }) {
  const accent = tone === "leaf" ? "text-leaf" : "text-marigold";
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3 text-ink shadow-sm">
      <p className={`mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide ${accent}`}>
        ✓ {title}
      </p>
      <dl className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 text-[12px]">
            <dt className="text-ink/50">{k}</dt>
            <dd className="font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
