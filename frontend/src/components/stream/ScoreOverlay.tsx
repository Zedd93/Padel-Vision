import { useEffect, useState, useRef } from "react";
import { cn } from "@/utils/cn";

export interface ScoreData {
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  currentSet: number;
  gameScore?: { team1: string; team2: string };
  sets?: Array<{ team1: number; team2: number }>;
  isTiebreak?: boolean;
  tiebreakScore?: { team1: number; team2: number };
  serving?: 1 | 2;
  elapsedTime?: string; // "01:24:07"
}

interface ScoreOverlayProps {
  score: ScoreData | null;
  position?: "bottom-center" | "top-left" | "top-right" | "bottom-left";
  compact?: boolean;
  className?: string;
}

export function ScoreOverlay({
  score,
  position = "top-right",
  compact = false,
  className,
}: ScoreOverlayProps) {
  const [animating, setAnimating] = useState(false);
  const prevScoreRef = useRef<string>("");

  // Trigger pulse animation on score change
  useEffect(() => {
    if (!score) return;
    const scoreKey = `${score.score1}-${score.score2}-${score.currentSet}`;
    if (prevScoreRef.current && prevScoreRef.current !== scoreKey) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = scoreKey;
  }, [score]);

  if (!score) return null;

  const positionClasses = {
    "bottom-center": "bottom-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  // Compact vertical layout for top-right corner — doesn't cover player controls
  if (compact) {
    const shortName = (name: string) => {
      const parts = name.split(" / ");
      return parts.map((p) => p.split(" ")[0]).join(" / ");
    };

    return (
      <div
        className={cn(
          "absolute z-10",
          positionClasses[position],
          animating && "animate-score-pulse",
          className
        )}
      >
        <div className="min-w-[160px] overflow-hidden rounded-lg border border-lime/20 bg-black/85 backdrop-blur-sm">
          {/* Header: Set + Time */}
          <div className="flex items-center justify-between bg-lime/10 px-2.5 py-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-lime">
              SET {score.currentSet}
            </span>
            {score.elapsedTime && (
              <span className="font-mono text-[10px] text-muted">
                {score.elapsedTime}
              </span>
            )}
          </div>

          {/* Team 1 Row */}
          <div className={cn(
            "flex items-center justify-between gap-3 border-b border-lime/10 px-2.5 py-1.5",
            score.score1 > score.score2 && "bg-lime/5"
          )}>
            <span className={cn(
              "text-xs font-semibold truncate max-w-[100px]",
              score.score1 > score.score2 ? "text-lime" : "text-text"
            )}>
              {shortName(score.team1)}
            </span>
            <div className="flex items-center gap-2">
              {/* Previous sets */}
              {score.sets?.map((set, i) => (
                <span key={i} className={cn(
                  "font-mono text-[10px]",
                  set.team1 > set.team2 ? "text-lime font-bold" : "text-muted"
                )}>
                  {set.team1}
                </span>
              ))}
              {/* Current set */}
              <span className={cn(
                "font-mono text-sm font-bold min-w-[16px] text-center",
                score.score1 > score.score2 ? "text-lime" : "text-text"
              )}>
                {score.score1}
              </span>
              {/* Game score */}
              {score.gameScore && (
                <span className="font-mono text-[10px] text-muted min-w-[12px] text-center">
                  {score.gameScore.team1}
                </span>
              )}
            </div>
          </div>

          {/* Team 2 Row */}
          <div className={cn(
            "flex items-center justify-between gap-3 px-2.5 py-1.5",
            score.score2 > score.score1 && "bg-lime/5"
          )}>
            <span className={cn(
              "text-xs font-semibold truncate max-w-[100px]",
              score.score2 > score.score1 ? "text-lime" : "text-text"
            )}>
              {shortName(score.team2)}
            </span>
            <div className="flex items-center gap-2">
              {/* Previous sets */}
              {score.sets?.map((set, i) => (
                <span key={i} className={cn(
                  "font-mono text-[10px]",
                  set.team2 > set.team1 ? "text-lime font-bold" : "text-muted"
                )}>
                  {set.team2}
                </span>
              ))}
              {/* Current set */}
              <span className={cn(
                "font-mono text-sm font-bold min-w-[16px] text-center",
                score.score2 > score.score1 ? "text-lime" : "text-text"
              )}>
                {score.score2}
              </span>
              {/* Game score */}
              {score.gameScore && (
                <span className="font-mono text-[10px] text-muted min-w-[12px] text-center">
                  {score.gameScore.team2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute z-10",
        positionClasses[position],
        animating && "animate-score-pulse",
        className
      )}
    >
      <div className="flex w-full items-center overflow-hidden rounded-lg border border-lime/20 bg-black/85 backdrop-blur-sm sm:w-auto sm:overflow-visible">
        {/* Team 1 */}
        <div className="px-2 py-2 sm:px-4 sm:py-2.5">
          <span
            className={cn(
              "font-mono text-xs font-semibold sm:text-sm",
              "max-w-[70px] truncate sm:max-w-none",
              score.score1 > score.score2 ? "text-lime" : "text-text"
            )}
          >
            {score.team1}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 border-x border-lime/10 px-2 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
          {/* Previous sets — hide on very small screens */}
          {score.sets && score.sets.length > 0 && (
            <div className="mr-1 hidden gap-1.5 border-r border-lime/10 pr-1 sm:mr-2 sm:flex sm:pr-2">
              {score.sets.map((set, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-[10px] text-muted"
                >
                  <span className={cn(set.team1 > set.team2 && "text-lime font-bold")}>
                    {set.team1}
                  </span>
                  <span className={cn(set.team2 > set.team1 && "text-lime font-bold")}>
                    {set.team2}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Current set score */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span
              className={cn(
                "text-display text-xl sm:text-2xl",
                score.score1 > score.score2 ? "text-lime" : "text-text"
              )}
            >
              {score.score1}
            </span>
            <span className="text-muted">:</span>
            <span
              className={cn(
                "text-display text-xl sm:text-2xl",
                score.score2 > score.score1 ? "text-lime" : "text-text"
              )}
            >
              {score.score2}
            </span>
          </div>

          {/* Game / Tiebreak score */}
          {score.isTiebreak && score.tiebreakScore ? (
            <div className="ml-1 flex items-center gap-1 border-l border-lime/10 pl-1 sm:ml-2 sm:pl-2">
              <span className="rounded bg-orange/20 px-1 py-0.5 text-[9px] font-bold text-orange sm:text-[10px]">
                TB
              </span>
              <span className="font-mono text-[10px] text-text sm:text-xs">
                {score.tiebreakScore.team1}-{score.tiebreakScore.team2}
              </span>
            </div>
          ) : score.gameScore ? (
            <div className="ml-1 flex items-center gap-1 border-l border-lime/10 pl-1 sm:ml-2 sm:pl-2">
              <span
                className={cn(
                  "font-mono text-[10px] sm:text-xs",
                  score.gameScore.team1 === "ADV" || score.gameScore.team2 === "ADV"
                    ? "text-lime"
                    : "text-muted"
                )}
              >
                {score.gameScore.team1 === "40" && score.gameScore.team2 === "40"
                  ? "DEUCE"
                  : `${score.gameScore.team1}-${score.gameScore.team2}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Team 2 */}
        <div className="px-2 py-2 sm:px-4 sm:py-2.5">
          <span
            className={cn(
              "font-mono text-xs font-semibold sm:text-sm",
              "max-w-[70px] truncate sm:max-w-none",
              score.score2 > score.score1 ? "text-lime" : "text-text"
            )}
          >
            {score.team2}
          </span>
        </div>

        {/* Set + Time */}
        <div className="flex items-center gap-1 border-l border-lime/10 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
          <span className="rounded bg-orange/20 px-1 py-0.5 text-[9px] font-bold text-orange sm:px-1.5 sm:text-[10px]">
            SET {score.currentSet}
          </span>
          {score.elapsedTime && (
            <span className="hidden font-mono text-[11px] text-muted sm:inline">
              {score.elapsedTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
