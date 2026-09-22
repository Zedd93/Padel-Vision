import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Tv2,
  Grid2x2,
  LayoutGrid,
  Lock,
  Crown,
  X,
  Radio,
  Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';

/* --- Types --- */

interface StreamSlot {
  id: string;
  /** Uzupelniane, gdy transmisja ma nagranie na YouTube. */
  youtubeVideoId: string | null;
  title: string;
  clubName: string;
  viewers: number;
  scoreLabel?: string;
}

/* --- Mock Available Streams --- */

const AVAILABLE_STREAMS: StreamSlot[] = [
  {
    id: 'stream-1',
    youtubeVideoId: null,
    title: 'SILESIA OPEN 2025 — FINAŁ OPEN A',
    clubName: 'Racket Club Katowice',
    viewers: 1247,
    scoreLabel: '6:3 / SET 2',
  },
  {
    id: 'stream-2',
    youtubeVideoId: null,
    title: 'Liga Weekendowa — Mecz 3',
    clubName: 'Padel Kraków',
    viewers: 432,
    scoreLabel: '4:4 / SET 1',
  },
  {
    id: 'stream-3',
    youtubeVideoId: null,
    title: 'Turniej Kobiet — Półfinał',
    clubName: 'Smash Arena Wrocław',
    viewers: 289,
    scoreLabel: '6:2 / SET 1',
  },
  {
    id: 'stream-4',
    youtubeVideoId: null,
    title: 'Americano Night — Kort 2',
    clubName: 'Vamos Padel Gdańsk',
    viewers: 156,
  },
  {
    id: 'stream-5',
    youtubeVideoId: null,
    title: 'Trening Otwarty — Kort 1',
    clubName: 'Warsaw Padel Club',
    viewers: 89,
  },
  {
    id: 'stream-6',
    youtubeVideoId: null,
    title: 'Junior Cup — Ćwierćfinał',
    clubName: 'Padel Academy Poznań',
    viewers: 201,
    scoreLabel: '3:5 / SET 2',
  },
];

/* --- Layout Options --- */

type LayoutType = '2x2' | '1+3' | '2x1';

/* --- MiniPlayer placeholder --- */

function MiniPlayer({
  title,
  clubName,
  viewers,
  scoreLabel,
  isActive,
  onActivate,
  onExpand,
  onRemove,
}: {
  title: string;
  clubName: string;
  viewers: number;
  scoreLabel?: string;
  isActive: boolean;
  onActivate: () => void;
  onExpand: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-bg2 transition-all',
        isActive ? 'border-lime ring-1 ring-lime/30' : 'border-border'
      )}
    >
      {/* Video placeholder */}
      <div
        className="relative flex flex-1 cursor-pointer items-center justify-center bg-black"
        onClick={onActivate}
      >
        <span className="text-xs text-white/30">[ Stream ]</span>
        {scoreLabel && (
          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-lime backdrop-blur-sm">
            {scoreLabel}
          </div>
        )}
        {isActive && (
          <div className="absolute left-2 top-2 rounded bg-lime/20 px-1.5 py-0.5 text-[9px] font-bold text-lime">
            AUDIO
          </div>
        )}
      </div>
      {/* Info bar */}
      <div className="flex items-center justify-between border-t border-border bg-bg2 px-2 py-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-text">{title}</p>
          <p className="truncate text-[9px] text-muted">{clubName}</p>
        </div>
        <div className="flex items-center gap-2 pl-2">
          <span className="flex items-center gap-1 text-[9px] text-muted">
            <Users className="h-2.5 w-2.5" />
            {viewers.toLocaleString('pl-PL')}
          </span>
          <button
            onClick={onExpand}
            className="rounded p-0.5 text-muted hover:text-text"
            title="Pełny ekran"
          >
            <Tv2 className="h-3 w-3" />
          </button>
          <button
            onClick={onRemove}
            className="rounded p-0.5 text-muted hover:text-red-400"
            title="Usuń"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Component --- */

export default function MultiViewPage() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<(StreamSlot | null)[]>([
    AVAILABLE_STREAMS[0],
    AVAILABLE_STREAMS[1],
    AVAILABLE_STREAMS[2],
    AVAILABLE_STREAMS[3],
  ]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [showPicker, setShowPicker] = useState<number | null>(null);

  const hasPro = true;

  const usedStreamIds = new Set(slots.filter(Boolean).map((s) => s!.id));

  const availableToAdd = AVAILABLE_STREAMS.filter(
    (s) => !usedStreamIds.has(s.id)
  );

  const handleActivate = useCallback((index: number) => {
    setActiveSlot(index);
  }, []);

  const handleExpand = useCallback(
    (index: number) => {
      const stream = slots[index];
      if (stream) {
        navigate(`/stream/${stream.id}`);
      }
    },
    [slots, navigate]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (activeSlot === index) {
        const firstFilled = slots.findIndex(
          (s, i) => s !== null && i !== index
        );
        if (firstFilled >= 0) setActiveSlot(firstFilled);
      }
    },
    [activeSlot, slots]
  );

  const handleAddStream = useCallback(
    (slotIndex: number, stream: StreamSlot) => {
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = stream;
        return next;
      });
      setShowPicker(null);
    },
    []
  );

  const filledCount = slots.filter(Boolean).length;

  if (!hasPro) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime/10">
            <Lock className="h-8 w-8 text-lime" />
          </div>
          <h1 className="text-display text-2xl">MultiView</h1>
          <p className="mt-2 text-sm text-muted">
            Oglądaj do 4 meczy jednocześnie. Funkcja dostępna w planie Padel Vision
            Pro.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Crown className="h-4 w-4" />
            Przejdź na Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <Tv2 className="h-5 w-5 text-lime" />
          <h1 className="text-display text-lg">MULTIVIEW</h1>
          <span className="rounded-full bg-bg3 px-2.5 py-0.5 text-xs text-muted">
            {filledCount}/4 streamów
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-bg2 p-0.5">
            <button
              onClick={() => setLayout('2x2')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                layout === '2x2'
                  ? 'bg-lime/20 text-lime'
                  : 'text-muted hover:text-text'
              )}
              title="Grid 2x2"
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout('1+3')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                layout === '1+3'
                  ? 'bg-lime/20 text-lime'
                  : 'text-muted hover:text-text'
              )}
              title="1 główny + 3 boczne"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout('2x1')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                layout === '2x1'
                  ? 'bg-lime/20 text-lime'
                  : 'text-muted hover:text-text'
              )}
              title="2 side-by-side"
            >
              <div className="flex h-4 w-4 gap-0.5">
                <div className="flex-1 rounded-sm border border-current" />
                <div className="flex-1 rounded-sm border border-current" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stream Grid */}
      <div className="flex-1 overflow-hidden p-2">
        {layout === '1+3' ? (
          <div className="grid h-full grid-cols-4 gap-2">
            <div className="col-span-3">
              {slots[0] ? (
                <MiniPlayer
                  title={slots[0].title}
                  clubName={slots[0].clubName}
                  viewers={slots[0].viewers}
                  scoreLabel={slots[0].scoreLabel}
                  isActive={activeSlot === 0}
                  onActivate={() => handleActivate(0)}
                  onExpand={() => handleExpand(0)}
                  onRemove={() => handleRemove(0)}
                />
              ) : (
                <EmptySlot index={0} onAdd={() => setShowPicker(0)} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1">
                  {slots[i] ? (
                    <MiniPlayer
                      title={slots[i]!.title}
                      clubName={slots[i]!.clubName}
                      viewers={slots[i]!.viewers}
                      scoreLabel={slots[i]!.scoreLabel}
                      isActive={activeSlot === i}
                      onActivate={() => handleActivate(i)}
                      onExpand={() => handleExpand(i)}
                      onRemove={() => handleRemove(i)}
                    />
                  ) : (
                    <EmptySlot index={i} onAdd={() => setShowPicker(i)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : layout === '2x1' ? (
          <div className="grid h-full grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <div key={i}>
                {slots[i] ? (
                  <MiniPlayer
                    title={slots[i]!.title}
                    clubName={slots[i]!.clubName}
                    viewers={slots[i]!.viewers}
                    scoreLabel={slots[i]!.scoreLabel}
                    isActive={activeSlot === i}
                    onActivate={() => handleActivate(i)}
                    onExpand={() => handleExpand(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ) : (
                  <EmptySlot index={i} onAdd={() => setShowPicker(i)} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                {slots[i] ? (
                  <MiniPlayer
                    title={slots[i]!.title}
                    clubName={slots[i]!.clubName}
                    viewers={slots[i]!.viewers}
                    scoreLabel={slots[i]!.scoreLabel}
                    isActive={activeSlot === i}
                    onActivate={() => handleActivate(i)}
                    onExpand={() => handleExpand(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ) : (
                  <EmptySlot index={i} onAdd={() => setShowPicker(i)} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stream Picker Modal */}
      {showPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card mx-4 w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-display text-lg">Dodaj stream</h2>
              <button
                onClick={() => setShowPicker(null)}
                className="rounded-lg p-1 text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {availableToAdd.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Brak dostępnych streamów do dodania
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {availableToAdd.map((stream) => (
                  <button
                    key={stream.id}
                    onClick={() => handleAddStream(showPicker, stream)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg2 p-3 text-left transition-all hover:border-lime hover:bg-bg3"
                  >
                    <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-bg3">
                      <Radio className="h-4 w-4 text-live" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {stream.title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {stream.clubName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Users className="h-3 w-3" />
                      {stream.viewers.toLocaleString('pl-PL')}
                    </div>
                    {stream.scoreLabel && (
                      <span className="rounded bg-bg3 px-2 py-0.5 font-mono text-xs text-lime">
                        {stream.scoreLabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Empty Slot --- */

function EmptySlot({
  index,
  onAdd,
}: {
  index: number;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg2/50 transition-all hover:border-lime/50 hover:bg-bg2"
    >
      <Plus className="mb-2 h-8 w-8 text-muted" />
      <span className="text-sm text-muted">Dodaj stream</span>
      <span className="mt-0.5 text-[10px] text-muted/60">
        Slot {index + 1}
      </span>
    </button>
  );
}
