import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface DonationEffect {
  id: string;
  username: string;
  amount: number;
  message?: string;
  tier: "small" | "medium" | "large" | "epic";
  timestamp: number;
}

interface DonationEffectsProps {
  streamId: string;
}

/* ─── Tier Config ──────────────────────────────── */

const EFFECT_TIERS = {
  small: {
    min: 1,
    label: "NICE SHOT!",
    duration: 3500,
  },
  medium: {
    min: 100,
    label: "ACE!",
    duration: 4500,
  },
  large: {
    min: 500,
    label: "SMASH!",
    duration: 5500,
  },
  epic: {
    min: 2000,
    label: "MATCH POINT!",
    duration: 7000,
  },
};

function getTier(amount: number): DonationEffect["tier"] {
  if (amount >= 2000) return "epic";
  if (amount >= 500) return "large";
  if (amount >= 100) return "medium";
  return "small";
}

/* ─── All keyframe animations (static CSS constant) ── */

const ANIMATION_CSS = `
@keyframes ball-bounce-across {
  0%   { transform: translate(-120%, 0) rotate(0deg); opacity: 0; }
  5%   { opacity: 1; }
  15%  { transform: translate(0%, -60px) rotate(120deg); }
  25%  { transform: translate(20%, 0) rotate(200deg); }
  35%  { transform: translate(40%, -35px) rotate(300deg); }
  45%  { transform: translate(55%, 0) rotate(400deg); }
  55%  { transform: translate(68%, -18px) rotate(500deg); }
  65%  { transform: translate(78%, 0) rotate(600deg); }
  75%  { transform: translate(88%, -8px) rotate(680deg); }
  82%  { transform: translate(95%, 0) rotate(720deg); }
  88%  { opacity: 1; }
  100% { transform: translate(120%, -50px) rotate(800deg); opacity: 0; }
}
@keyframes small-label-pop {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); }
  15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.3) rotate(3deg); }
  25%  { transform: translate(-50%, -50%) scale(0.95) rotate(-2deg); }
  35%  { transform: translate(-50%, -50%) scale(1.05) rotate(1deg); }
  45%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  75%  { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(0deg); }
}
@keyframes small-info-fade {
  0%   { opacity: 0; transform: translateY(8px); }
  20%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes ball-shadow {
  0%, 100% { transform: scaleX(0.5); opacity: 0; }
  25%, 65% { transform: scaleX(1); opacity: 0.3; }
  15%, 35%, 55% { transform: scaleX(0.6); opacity: 0.15; }
}
@keyframes fireball-entry {
  0%   { transform: translate(-200%, 50%) scale(0.4) rotate(-30deg); opacity: 0; filter: blur(4px); }
  10%  { opacity: 1; filter: blur(0); }
  40%  { transform: translate(0%, 0%) scale(1.2) rotate(10deg); }
  50%  { transform: translate(0%, 0%) scale(1) rotate(0deg); }
  55%  { transform: translate(0%, 0%) scale(3) rotate(0deg); opacity: 1; filter: blur(0); }
  65%  { transform: translate(0%, 0%) scale(0) rotate(0deg); opacity: 0; filter: blur(8px); }
  100% { transform: translate(0%, 0%) scale(0) rotate(0deg); opacity: 0; }
}
@keyframes fire-spark {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
}
@keyframes medium-text-slam {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(3) rotate(-5deg); filter: blur(6px); }
  15%  { opacity: 1; transform: translate(-50%, -50%) scale(0.85) rotate(2deg); filter: blur(0); }
  22%  { transform: translate(-50%, -50%) scale(1.1) rotate(-1deg); }
  30%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  75%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1) rotate(0deg); }
}
@keyframes medium-ring-expand {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; border-width: 4px; }
  50%  { opacity: 0.3; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; border-width: 1px; }
}
@keyframes medium-flash {
  0%   { opacity: 0; }
  5%   { opacity: 0.4; }
  15%  { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes fire-trail-particle {
  0%   { opacity: 0.9; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
}
@keyframes screen-shake {
  0%, 100% { transform: translate(0,0) rotate(0deg); }
  10% { transform: translate(-6px, 4px) rotate(-0.5deg); }
  20% { transform: translate(5px, -3px) rotate(0.5deg); }
  30% { transform: translate(-4px, 6px) rotate(-0.3deg); }
  40% { transform: translate(4px, -2px) rotate(0.3deg); }
  50% { transform: translate(-3px, 3px) rotate(0deg); }
  60% { transform: translate(2px, -2px) rotate(0.2deg); }
  70% { transform: translate(-1px, 1px) rotate(-0.1deg); }
  80% { transform: translate(1px, -1px) rotate(0deg); }
}
@keyframes racket-swing {
  0%   { transform: translate(100%, -100%) rotate(-90deg) scale(0.5); opacity: 0; }
  15%  { opacity: 1; }
  35%  { transform: translate(0%, 0%) rotate(15deg) scale(1.2); }
  40%  { transform: translate(-5%, 5%) rotate(0deg) scale(1); }
  42%  { transform: translate(-5%, 5%) rotate(0deg) scale(1.1); }
  50%  { transform: translate(-5%, 5%) rotate(0deg) scale(1); }
  70%  { opacity: 1; }
  100% { transform: translate(-80%, 40%) rotate(30deg) scale(0.6); opacity: 0; }
}
@keyframes impact-crack {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  20%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  60%  { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}
@keyframes large-shard {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)) scale(0); opacity: 0; }
}
@keyframes large-text-crash {
  0%   { opacity: 0; transform: translate(-50%, -200%) scale(2) rotate(-10deg); }
  20%  { opacity: 1; transform: translate(-50%, -50%) scale(0.9) rotate(2deg); }
  25%  { transform: translate(-50%, -50%) scale(1.15) rotate(-1deg); }
  32%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  75%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2) rotate(0deg); }
}
@keyframes large-flash {
  0%   { opacity: 0; }
  5%   { opacity: 0.6; }
  20%  { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes epic-vignette {
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes epic-rays {
  0%   { transform: translate(-50%, -50%) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.4; }
  80%  { opacity: 0.4; }
  100% { transform: translate(-50%, -50%) rotate(180deg); opacity: 0; }
}
@keyframes trophy-entrance {
  0%   { transform: translate(-50%, 100%) scale(0) rotate(-30deg); opacity: 0; }
  20%  { transform: translate(-50%, -60%) scale(1.4) rotate(5deg); opacity: 1; }
  30%  { transform: translate(-50%, -50%) scale(0.9) rotate(-3deg); }
  38%  { transform: translate(-50%, -50%) scale(1.1) rotate(1deg); }
  45%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  75%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translate(-50%, -150%) scale(1.3) rotate(10deg); opacity: 0; }
}
@keyframes epic-text-reveal {
  0%   { opacity: 0; transform: translate(-50%, -50%) scaleX(0) scaleY(2); letter-spacing: 0.5em; }
  15%  { opacity: 1; transform: translate(-50%, -50%) scaleX(1.1) scaleY(0.9); letter-spacing: 0.05em; }
  22%  { transform: translate(-50%, -50%) scaleX(0.95) scaleY(1.05); }
  30%  { transform: translate(-50%, -50%) scaleX(1) scaleY(1); letter-spacing: 0.02em; }
  75%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
}
@keyframes confetti-fall {
  0%   { transform: translate(var(--cx), -20px) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(calc(var(--cx) + var(--drift)), var(--fall)) rotate(var(--spin)) scale(0.5); opacity: 0; }
}
@keyframes epic-ring {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
  50%  { opacity: 0.3; }
  100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
}
@keyframes sparkle-pop {
  0%   { transform: translate(var(--x), var(--y)) scale(0) rotate(0deg); opacity: 1; }
  50%  { transform: translate(var(--x), var(--y)) scale(1) rotate(180deg); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0) rotate(360deg); opacity: 0; }
}
@keyframes epic-flash {
  0%   { opacity: 0; }
  3%   { opacity: 0.8; }
  6%   { opacity: 0.2; }
  9%   { opacity: 0.6; }
  15%  { opacity: 0; }
  100% { opacity: 0; }
}
`;

/**
 * Injects the animation CSS into the document head once.
 * This avoids using dangerouslySetInnerHTML on every render.
 */
let styleInjected = false;
function useInjectAnimationCSS() {
  useEffect(() => {
    if (styleInjected) return;
    const style = document.createElement("style");
    style.setAttribute("data-donation-effects", "true");
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
    styleInjected = true;
    return () => {
      // Intentionally not removing - shared across instances
    };
  }, []);
}

/* ─── Small Effect: Tennis ball bounces across ─── */
function SmallEffect({ effect }: { effect: DonationEffect }) {
  const dur = EFFECT_TIERS.small.duration;
  return (
    <div className="absolute inset-0">
      <div
        className="absolute left-0 top-[55%]"
        style={{
          width: "100%",
          animation: `ball-bounce-across ${dur * 0.8}ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
        }}
      >
        <div
          className="relative h-10 w-10"
          style={{ filter: "drop-shadow(0 4px 8px rgba(200,255,0,0.4))" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d4ff33] via-[#C8FF00] to-[#8fba00]"
            style={{ boxShadow: "inset -3px -3px 6px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.3)" }}
          >
            <div className="absolute inset-[3px] rounded-full"
              style={{
                background: "transparent",
                borderTop: "2px solid rgba(255,255,255,0.25)",
                borderBottom: "2px solid rgba(255,255,255,0.25)",
                transform: "rotate(30deg)",
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="absolute left-1/2 top-[38%]"
        style={{ animation: `small-label-pop ${dur}ms ease-out forwards` }}
      >
        <p className="whitespace-nowrap text-display text-2xl font-bold text-lime sm:text-3xl"
          style={{
            textShadow: "0 0 20px rgba(200,255,0,0.6), 0 2px 8px rgba(0,0,0,0.8)",
            WebkitTextStroke: "1px rgba(0,0,0,0.3)",
          }}
        >
          {EFFECT_TIERS.small.label}
        </p>
      </div>
      <div
        className="absolute left-1/2 top-[50%] -translate-x-1/2"
        style={{ animation: `small-info-fade ${dur}ms ease-out forwards` }}
      >
        <p className="whitespace-nowrap text-center text-sm text-white/90"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
        >
          <span className="font-bold">{effect.username}</span>
          {" wysyła "}
          <span className="font-bold text-lime">{effect.amount} Piłek</span>
        </p>
        {effect.message && (
          <p className="mt-0.5 text-center text-xs text-white/60"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            &ldquo;{effect.message}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Medium Effect: Fireball + explosion ──────── */
function MediumEffect({ effect }: { effect: DonationEffect }) {
  const dur = EFFECT_TIERS.medium.duration;

  const sparks = useMemo(() =>
    Array.from({ length: 16 }).map(() => ({
      sx: `${(Math.random() - 0.5) * 250}px`,
      sy: `${(Math.random() - 0.5) * 250}px`,
      size: 3 + Math.random() * 6,
      delay: 0.35 + Math.random() * 0.15,
      color: ["#FF6A00", "#FF9500", "#FFB800", "#FFF"][Math.floor(Math.random() * 4)],
    })), []);

  const trailParticles = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      tx: `${-30 - Math.random() * 80}px`,
      ty: `${(Math.random() - 0.5) * 50}px`,
      delay: i * 0.03,
      size: 4 + Math.random() * 8,
    })), []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-orange/50"
        style={{ animation: `medium-flash ${dur}ms ease-out forwards` }}
      />
      {[0, 0.15, 0.3].map((delay, i) => (
        <div key={i}
          className="absolute left-1/2 top-1/3 h-32 w-32 rounded-full border-orange"
          style={{
            animation: `medium-ring-expand 1s ease-out ${delay}s forwards`,
            opacity: 0,
            borderWidth: "3px",
            borderStyle: "solid",
            borderColor: i === 0 ? "#FF6A00" : i === 1 ? "#FF9500" : "#FFB800",
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: `fireball-entry ${dur * 0.65}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` }}
      >
        {trailParticles.map((p, i) => (
          <div key={i} className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, #FFB800 0%, #FF6A00 70%, transparent 100%)`,
              animation: `fire-trail-particle 0.6s ease-out ${p.delay}s forwards`,
              ["--tx" as string]: p.tx,
              ["--ty" as string]: p.ty,
              opacity: 0.9,
            }}
          />
        ))}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-orange-400 to-red-600"
            style={{
              boxShadow: "0 0 30px 10px rgba(255,106,0,0.6), 0 0 60px 20px rgba(255,150,0,0.3)",
              filter: "brightness(1.3)",
            }}
          />
          <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white via-yellow-200 to-orange-300 opacity-80" />
        </div>
      </div>
      {sparks.map((s, i) => (
        <div key={i}
          className="absolute left-1/2 top-1/3 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animation: `fire-spark 0.8s ease-out ${s.delay}s forwards`,
            ["--sx" as string]: s.sx,
            ["--sy" as string]: s.sy,
            opacity: 0,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-[38%]"
        style={{ animation: `medium-text-slam ${dur}ms ease-out forwards` }}
      >
        <p className="whitespace-nowrap text-display text-4xl font-bold text-orange sm:text-5xl"
          style={{
            textShadow: "0 0 30px rgba(255,106,0,0.8), 0 0 60px rgba(255,150,0,0.4), 0 3px 10px rgba(0,0,0,0.8)",
            WebkitTextStroke: "1.5px rgba(0,0,0,0.4)",
          }}
        >
          {EFFECT_TIERS.medium.label}
        </p>
      </div>
      <div
        className="absolute left-1/2 top-[52%] -translate-x-1/2"
        style={{ animation: `small-info-fade ${dur}ms ease-out 0.3s forwards`, opacity: 0 }}
      >
        <p className="whitespace-nowrap text-center text-sm font-medium text-white/90"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
        >
          <span className="font-bold">{effect.username}</span>
          {" wysyła "}
          <span className="font-bold text-orange">{effect.amount} Piłek</span>
        </p>
        {effect.message && (
          <p className="mt-0.5 text-center text-xs text-white/60"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            &ldquo;{effect.message}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Large Effect: Racket smash + shockwave ───── */
function LargeEffect({ effect }: { effect: DonationEffect }) {
  const dur = EFFECT_TIERS.large.duration;

  const shards = useMemo(() =>
    Array.from({ length: 24 }).map(() => ({
      sx: `${(Math.random() - 0.5) * 400}px`,
      sy: `${(Math.random() - 0.5) * 300}px`,
      sr: `${(Math.random() - 0.5) * 720}deg`,
      w: 3 + Math.random() * 12,
      h: 8 + Math.random() * 20,
      delay: 0.3 + Math.random() * 0.2,
      color: ["#FBBF24", "#F59E0B", "#FDE68A", "#FFFFFF"][Math.floor(Math.random() * 4)],
    })), []);

  return (
    <div className="absolute inset-0"
      style={{ animation: `screen-shake 0.6s ease-out 0.35s` }}
    >
      <div className="absolute inset-0 bg-yellow-400/60"
        style={{ animation: `large-flash ${dur}ms ease-out forwards` }}
      />
      <div className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 35%, transparent 20%, rgba(0,0,0,0.4) 80%)",
          animation: `epic-vignette ${dur}ms ease-out forwards`,
        }}
      />
      <div className="absolute left-[45%] top-[25%]"
        style={{ animation: `racket-swing ${dur * 0.7}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` }}
      >
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
          <rect x="33" y="70" width="14" height="50" rx="5" fill="#8B6914" />
          <rect x="35" y="72" width="10" height="46" rx="4" fill="#A67C1A" />
          {[0, 8, 16, 24, 32].map((y) => (
            <rect key={y} x="33" y={74 + y} width="14" height="3" rx="1" fill="#725510" opacity="0.5" />
          ))}
          <ellipse cx="40" cy="38" rx="32" ry="36" fill="#1A1A2E" stroke="#FBBF24" strokeWidth="3" />
          <ellipse cx="40" cy="38" rx="28" ry="32" fill="#0F0F1E" />
          {[-18, -9, 0, 9, 18].map((x) => (
            <line key={`v${x}`} x1={40 + x} y1="10" x2={40 + x} y2="66" stroke="#FBBF24" strokeWidth="1" opacity="0.6" />
          ))}
          {[-20, -10, 0, 10, 20].map((y) => (
            <line key={`h${y}`} x1="14" y1={38 + y} x2="66" y2={38 + y} stroke="#FBBF24" strokeWidth="1" opacity="0.6" />
          ))}
          <ellipse cx="30" cy="28" rx="8" ry="12" fill="white" opacity="0.08" />
        </svg>
      </div>
      <div className="absolute left-1/2 top-[33%]"
        style={{ animation: `impact-crack 0.8s ease-out 0.38s forwards`, opacity: 0 }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            const len = 30 + Math.random() * 25;
            return (
              <line key={i}
                x1="60" y1="60"
                x2={60 + Math.cos(a) * len}
                y2={60 + Math.sin(a) * len}
                stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.8"
              />
            );
          })}
          <circle cx="60" cy="60" r="8" fill="#FBBF24" opacity="0.6" />
        </svg>
      </div>
      {shards.map((s, i) => (
        <div key={i}
          className="absolute left-1/2 top-[33%]"
          style={{
            width: s.w,
            height: s.h,
            background: s.color,
            borderRadius: "2px",
            boxShadow: `0 0 6px ${s.color}`,
            animation: `large-shard 1s ease-out ${s.delay}s forwards`,
            ["--sx" as string]: s.sx,
            ["--sy" as string]: s.sy,
            ["--sr" as string]: s.sr,
            opacity: 0,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-[38%]"
        style={{ animation: `large-text-crash ${dur}ms ease-out 0.3s forwards`, opacity: 0 }}
      >
        <p className="whitespace-nowrap text-display text-5xl font-bold text-yellow-400 sm:text-6xl"
          style={{
            textShadow: "0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(245,158,11,0.4), 0 4px 12px rgba(0,0,0,0.9)",
            WebkitTextStroke: "2px rgba(0,0,0,0.4)",
          }}
        >
          {EFFECT_TIERS.large.label}
        </p>
      </div>
      <div className="absolute left-1/2 top-[53%] -translate-x-1/2"
        style={{ animation: `small-info-fade ${dur}ms ease-out 0.5s forwards`, opacity: 0 }}
      >
        <p className="whitespace-nowrap text-center text-base font-medium text-white"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
        >
          <span className="font-bold">{effect.username}</span>
          {" wysyła "}
          <span className="font-bold text-yellow-400">{effect.amount} Piłek</span>
        </p>
        {effect.message && (
          <p className="mt-1 text-center text-sm text-white/70"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
          >
            &ldquo;{effect.message}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Epic Effect: Full golden spectacle ──────── */
function EpicEffect({ effect }: { effect: DonationEffect }) {
  const dur = EFFECT_TIERS.epic.duration;

  const confetti = useMemo(() =>
    Array.from({ length: 40 }).map(() => ({
      cx: `${(Math.random() * 100)}vw`,
      drift: `${(Math.random() - 0.5) * 80}px`,
      fall: `${100 + Math.random() * 60}vh`,
      spin: `${(Math.random() - 0.5) * 1080}deg`,
      delay: Math.random() * 1.5,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 10,
      color: ["#FBBF24", "#F59E0B", "#FDE68A", "#EF4444", "#C8FF00", "#FF6A00", "#FFFFFF"][Math.floor(Math.random() * 7)],
      isRound: Math.random() > 0.5,
    })), []);

  const sparkles = useMemo(() =>
    Array.from({ length: 16 }).map(() => ({
      x: `${(Math.random() - 0.5) * 500}px`,
      y: `${(Math.random() - 0.5) * 300}px`,
      delay: 0.3 + Math.random() * 2,
      size: 10 + Math.random() * 16,
    })), []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-yellow-300"
        style={{ animation: `epic-flash ${dur}ms ease-out forwards` }}
      />
      <div className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.1) 30%, rgba(0,0,0,0.5) 100%)",
          animation: `epic-vignette ${dur}ms ease-out forwards`,
        }}
      />
      <div className="absolute left-1/2 top-[30%]"
        style={{ animation: `epic-rays ${dur}ms linear forwards` }}
      >
        <svg width="600" height="600" viewBox="0 0 600 600" style={{ transform: "translate(-50%, -50%)" }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            return (
              <polygon key={i}
                points="300,300 280,0 320,0"
                fill="url(#rayGrad)"
                opacity="0.15"
                transform={`rotate(${angle} 300 300)`}
              />
            );
          })}
          <defs>
            <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {[0, 0.2, 0.4, 0.6].map((delay, i) => (
        <div key={i}
          className="absolute left-1/2 top-[30%] h-24 w-24 rounded-full"
          style={{
            border: `${3 - i * 0.5}px solid`,
            borderColor: i < 2 ? "#FBBF24" : "#FDE68A",
            animation: `epic-ring 1.2s ease-out ${delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-[28%]"
        style={{ animation: `trophy-entrance ${dur}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards` }}
      >
        <svg width="80" height="90" viewBox="0 0 80 90" fill="none"
          style={{ filter: "drop-shadow(0 0 20px rgba(251,191,36,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
        >
          <path d="M15 10 H65 L58 55 H22 Z" fill="url(#trophyGold)" />
          <path d="M15 15 C-5 15 -5 40 15 40" stroke="url(#trophyGold)" strokeWidth="5" fill="none" />
          <path d="M65 15 C85 15 85 40 65 40" stroke="url(#trophyGold)" strokeWidth="5" fill="none" />
          <rect x="30" y="55" width="20" height="12" rx="2" fill="#B8860B" />
          <rect x="20" y="67" width="40" height="8" rx="3" fill="#DAA520" />
          <rect x="16" y="75" width="48" height="10" rx="4" fill="url(#trophyGold)" />
          <polygon points="40,22 43,31 52,31 45,37 47,46 40,41 33,46 35,37 28,31 37,31" fill="#FFF8DC" opacity="0.8" />
          <path d="M22 15 L24 45" stroke="white" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
          <defs>
            <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="30%" stopColor="#FBBF24" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {sparkles.map((s, i) => (
        <div key={i}
          className="absolute left-1/2 top-[30%]"
          style={{
            animation: `sparkle-pop 0.8s ease-out ${s.delay}s forwards`,
            ["--x" as string]: s.x,
            ["--y" as string]: s.y,
            opacity: 0,
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="#FDE68A">
            <polygon points="12,0 14,9 24,9 16,15 18,24 12,18 6,24 8,15 0,9 10,9" />
          </svg>
        </div>
      ))}
      {confetti.map((c, i) => (
        <div key={i}
          className="absolute top-0"
          style={{
            width: c.w,
            height: c.h,
            borderRadius: c.isRound ? "50%" : "2px",
            background: c.color,
            boxShadow: `0 0 4px ${c.color}`,
            animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${c.delay}s forwards`,
            ["--cx" as string]: c.cx,
            ["--drift" as string]: c.drift,
            ["--fall" as string]: c.fall,
            ["--spin" as string]: c.spin,
            opacity: 0,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-[48%]"
        style={{ animation: `epic-text-reveal ${dur}ms ease-out 0.4s forwards`, opacity: 0 }}
      >
        <p className="whitespace-nowrap text-display text-5xl font-bold sm:text-7xl"
          style={{
            background: "linear-gradient(135deg, #FDE68A 0%, #FBBF24 25%, #F59E0B 50%, #FBBF24 75%, #FDE68A 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 30px rgba(251,191,36,0.5)) drop-shadow(0 4px 16px rgba(0,0,0,0.8))",
          }}
        >
          {EFFECT_TIERS.epic.label}
        </p>
      </div>
      <div className="absolute left-1/2 top-[62%] -translate-x-1/2"
        style={{ animation: `small-info-fade ${dur}ms ease-out 0.7s forwards`, opacity: 0 }}
      >
        <div className="rounded-xl border border-yellow-500/30 bg-black/60 px-6 py-3 backdrop-blur-sm">
          <p className="whitespace-nowrap text-center text-lg font-bold text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
          >
            {effect.username}
          </p>
          <p className="text-center text-sm text-yellow-300">
            wysyła <span className="text-lg font-bold">{effect.amount}</span> Piłek
          </p>
        </div>
        {effect.message && (
          <p className="mt-2 text-center text-sm text-white/80"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
          >
            &ldquo;{effect.message}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────── */

export function DonationEffects({ streamId }: DonationEffectsProps) {
  useInjectAnimationCSS();
  const [activeEffects, setActiveEffects] = useState<DonationEffect[]>([]);

  const removeEffect = useCallback((id: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const fireEffect = useCallback((amount: number, username: string, message?: string) => {
    const effect: DonationEffect = {
      id: `don_${Date.now()}`,
      username,
      amount,
      message: message || undefined,
      tier: getTier(amount),
      timestamp: Date.now(),
    };
    setActiveEffects((prev) => [...prev, effect]);
    const tierConfig = EFFECT_TIERS[effect.tier];
    setTimeout(() => removeEffect(effect.id), tierConfig.duration);
  }, [removeEffect]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        fireEffect(detail.amount, detail.username || "Widz", detail.message);
      }
    };
    window.addEventListener("padelvision:cheer", handler);
    return () => window.removeEventListener("padelvision:cheer", handler);
  }, [fireEffect]);

  useEffect(() => {
    const demoAmounts = [10, 50, 100, 250, 500, 2000];
    const demoNames = ["PadelFan_PL", "SmashKing99", "WarsawPadel", "AceHunter", "GoldenPoint"];
    const demoMessages = ["Świetny mecz!", "Dawaj! 💪", "Najlepszy turniej!", "", "GG!", "Co za rally!"];

    const timer = setInterval(
      () => {
        const amount = demoAmounts[Math.floor(Math.random() * demoAmounts.length)];
        const username = demoNames[Math.floor(Math.random() * demoNames.length)];
        const message = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        fireEffect(amount, username, message || undefined);
      },
      20000 + Math.random() * 15000
    );

    return () => clearInterval(timer);
  }, [fireEffect]);

  if (activeEffects.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {activeEffects.map((effect) => (
        <div key={effect.id} className="absolute inset-0">
          {effect.tier === "small" && <SmallEffect effect={effect} />}
          {effect.tier === "medium" && <MediumEffect effect={effect} />}
          {effect.tier === "large" && <LargeEffect effect={effect} />}
          {effect.tier === "epic" && <EpicEffect effect={effect} />}
        </div>
      ))}
    </div>
  );
}
