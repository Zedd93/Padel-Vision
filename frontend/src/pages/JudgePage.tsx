import { useState } from 'react';
import { Minus, Plus, RotateCcw, Send, Radio } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Score {
  team1Games: number;
  team2Games: number;
  sets: { team1: number; team2: number }[];
  currentSet: number;
  serving: 1 | 2;
}

const INITIAL_SCORE: Score = {
  team1Games: 0,
  team2Games: 0,
  sets: [],
  currentSet: 1,
  serving: 1,
};

const DEMO_MATCH = {
  id: 'match-1',
  tournament: 'Silesia Open 2025',
  round: 'Półfinał',
  court: 'Kort 1',
  team1: { player1: 'M. Kowalski', player2: 'J. Nowak' },
  team2: { player1: 'K. Wiśniewski', player2: 'P. Zieliński' },
};

export default function JudgePanelPage() {
  const [score, setScore] = useState<Score>(INITIAL_SCORE);
  const [synced, setSynced] = useState(true);

  const addGame = (team: 1 | 2) => {
    setSynced(false);
    setScore((prev) => {
      const newScore = { ...prev };
      if (team === 1) {
        newScore.team1Games = prev.team1Games + 1;
      } else {
        newScore.team2Games = prev.team2Games + 1;
      }

      const g1 = newScore.team1Games;
      const g2 = newScore.team2Games;
      if (
        (g1 >= 6 && g1 - g2 >= 2) ||
        (g2 >= 6 && g2 - g1 >= 2) ||
        (g1 === 7 && g2 === 6) ||
        (g2 === 7 && g1 === 6)
      ) {
        newScore.sets = [...prev.sets, { team1: g1, team2: g2 }];
        newScore.team1Games = 0;
        newScore.team2Games = 0;
        newScore.currentSet = prev.currentSet + 1;
      }

      return newScore;
    });
  };

  const removeGame = (team: 1 | 2) => {
    setSynced(false);
    setScore((prev) => {
      if (team === 1 && prev.team1Games > 0) {
        return { ...prev, team1Games: prev.team1Games - 1 };
      }
      if (team === 2 && prev.team2Games > 0) {
        return { ...prev, team2Games: prev.team2Games - 1 };
      }
      return prev;
    });
  };

  const toggleServing = () => {
    setScore((prev) => ({
      ...prev,
      serving: prev.serving === 1 ? 2 : 1,
    }));
  };

  const syncScore = () => {
    setSynced(true);
  };

  const resetScore = () => {
    setScore(INITIAL_SCORE);
    setSynced(false);
  };

  const team1SetsWon = score.sets.filter((s) => s.team1 > s.team2).length;
  const team2SetsWon = score.sets.filter((s) => s.team2 > s.team1).length;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-bg p-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Radio className="h-4 w-4 text-live" />
          <span className="text-xs font-semibold uppercase tracking-wider text-live">
            Panel Sędziego
          </span>
        </div>
        <h1 className="text-display text-lg">{DEMO_MATCH.tournament}</h1>
        <p className="text-xs text-muted">
          {DEMO_MATCH.round} — {DEMO_MATCH.court}
        </p>
      </div>

      {/* Set History */}
      {score.sets.length > 0 && (
        <div className="mb-4 flex justify-center gap-3">
          {score.sets.map((set, i) => (
            <div key={i} className="rounded-lg bg-bg3 px-3 py-1.5 text-center">
              <p className="text-[10px] text-muted">Set {i + 1}</p>
              <p className="font-mono text-sm font-bold text-text">
                {set.team1}-{set.team2}
              </p>
            </div>
          ))}
          <div className="rounded-lg bg-lime/10 px-3 py-1.5 text-center">
            <p className="text-[10px] text-lime">Sety</p>
            <p className="font-mono text-sm font-bold text-lime">
              {team1SetsWon}-{team2SetsWon}
            </p>
          </div>
        </div>
      )}

      {/* Current Set Label */}
      <div className="mb-3 text-center">
        <span className="rounded-full bg-orange/20 px-3 py-1 text-xs font-bold text-orange">
          Set {score.currentSet}
        </span>
      </div>

      {/* Score Board */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Team 1 */}
        <div
          className={cn(
            'glass-card overflow-hidden',
            score.serving === 1 && 'ring-2 ring-lime/40'
          )}
        >
          <div className="bg-bg3 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-text">{DEMO_MATCH.team1.player1}</p>
            <p className="text-xs text-muted">{DEMO_MATCH.team1.player2}</p>
            {score.serving === 1 && (
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-lime" />
            )}
          </div>
          <div className="p-4 text-center">
            <p className="text-display text-6xl text-text">{score.team1Games}</p>
          </div>
          <div className="flex border-t border-border">
            <button
              onClick={() => removeGame(1)}
              className="flex flex-1 items-center justify-center border-r border-border py-4 text-muted transition-colors active:bg-bg3"
            >
              <Minus className="h-6 w-6" />
            </button>
            <button
              onClick={() => addGame(1)}
              className="flex flex-1 items-center justify-center py-4 text-lime transition-colors active:bg-lime/10"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Team 2 */}
        <div
          className={cn(
            'glass-card overflow-hidden',
            score.serving === 2 && 'ring-2 ring-lime/40'
          )}
        >
          <div className="bg-bg3 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-text">{DEMO_MATCH.team2.player1}</p>
            <p className="text-xs text-muted">{DEMO_MATCH.team2.player2}</p>
            {score.serving === 2 && (
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-lime" />
            )}
          </div>
          <div className="p-4 text-center">
            <p className="text-display text-6xl text-text">{score.team2Games}</p>
          </div>
          <div className="flex border-t border-border">
            <button
              onClick={() => removeGame(2)}
              className="flex flex-1 items-center justify-center border-r border-border py-4 text-muted transition-colors active:bg-bg3"
            >
              <Minus className="h-6 w-6" />
            </button>
            <button
              onClick={() => addGame(2)}
              className="flex flex-1 items-center justify-center py-4 text-lime transition-colors active:bg-lime/10"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button onClick={toggleServing} className="btn-secondary w-full py-3 text-sm">
          <RotateCcw className="mr-2 inline h-4 w-4" />
          Zmień serwującego
        </button>

        <button
          onClick={syncScore}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all',
            synced
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-lime text-black active:scale-[0.98]'
          )}
        >
          <Send className="h-4 w-4" />
          {synced ? 'Zsynchronizowano \u2713' : 'Wyślij wynik na stream'}
        </button>

        <button onClick={resetScore} className="w-full py-2 text-xs text-muted hover:text-red-400">
          Resetuj wynik
        </button>
      </div>

      {/* Status Bar */}
      <div className="mt-6 rounded-lg bg-bg3 p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
          <span className="text-xs text-muted">Połączono z transmisją na żywo</span>
        </div>
      </div>
    </div>
  );
}
