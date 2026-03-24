import { useState } from "react";
import { Plus, Trophy, Calendar, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useTournamentStore, Tournament } from "@/lib/stores/tournament-store";

export default function TournamentsManagePage() {
  const { tournaments, addTournament } = useTournamentStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    format: "ELIMINATION",
    category: "OPEN",
    level: "A",
    maxPairs: "",
    entryFee: "",
    prizes: "",
  });

  const handleCreate = () => {
    if (!formData.name || !formData.date) return;
    const newTournament: Tournament = {
      id: String(Date.now()),
      name: formData.name,
      format: formData.format,
      category: formData.category,
      level: formData.level,
      date: formData.date,
      maxPairs: parseInt(formData.maxPairs) || 16,
      registeredPairs: 0,
      entryFee: formData.entryFee ? parseInt(formData.entryFee) : undefined,
      prizes: formData.prizes || undefined,
      status: "upcoming",
      pairs: [],
      matches: [],
    };
    addTournament(newTournament);
    setFormData({ name: "", date: "", format: "ELIMINATION", category: "OPEN", level: "A", maxPairs: "", entryFee: "", prizes: "" });
    setShowForm(false);

    // Fire-and-forget API persistence
    fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTournament),
    }).catch(() => {});
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-2xl">Turnieje</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Nowy turniej
        </button>
      </div>

      {/* New Tournament Form */}
      {showForm && (
        <div className="glass-card mb-6 p-6">
          <h2 className="mb-4 text-display text-lg">Utwórz turniej</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Nazwa turnieju</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Spring Open 2025"
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none [color-scheme:dark]"
              >
                <option value="ELIMINATION">Eliminacje</option>
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="AMERICANO">Americano</option>
                <option value="MEXICANO">Mexicano</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Kategoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none [color-scheme:dark]"
              >
                <option value="OPEN">OPEN</option>
                <option value="WOMEN">KOBIETY</option>
                <option value="SENIORS">SENIORZY</option>
                <option value="MIXED">MIXT</option>
                <option value="JUNIORS">JUNIORZY</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Poziom</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none [color-scheme:dark]"
              >
                <option value="A">A</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Max par</label>
              <input
                type="number"
                value={formData.maxPairs}
                onChange={(e) => setFormData({ ...formData, maxPairs: e.target.value })}
                placeholder="16"
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Wpisowe (PLN)</label>
              <input
                type="number"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                placeholder="50"
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Nagrody</label>
              <input
                type="text"
                value={formData.prizes}
                onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                placeholder="1. 1000 PLN, 2. 500 PLN"
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="btn-primary text-sm">Utwórz turniej</button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary text-sm"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Tournament List */}
      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tournaments/${tournament.id}`}
            className="glass-card-hover flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  tournament.status === "live"
                    ? "bg-live/20 text-live"
                    : tournament.status === "upcoming"
                    ? "bg-lime/10 text-lime"
                    : "bg-bg4 text-muted"
                )}
              >
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text">{tournament.name}</h3>
                  {tournament.status === "live" && (
                    <span className="badge-live text-[9px]">LIVE</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {tournament.date}
                  </span>
                  <span>{tournament.category} {tournament.level}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tournament.registeredPairs}/{tournament.maxPairs} par
                  </span>
                  <span className="capitalize">{tournament.format.toLowerCase().replace("_", " ")}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        ))}
      </div>

      {/* Bracket Preview */}
      <div className="mt-8">
        <h2 className="mb-4 text-display text-lg">
          Drabinka — Silesia Open 2025
        </h2>
        <div className="glass-card overflow-x-auto p-6">
          <div className="flex min-w-[800px] gap-12">
            {/* Round 1 */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase text-muted">Ćwierćfinał</p>
              {[
                { t1: "Kowalski / Nowak", t2: "Wiśniewski / Zając", s1: 6, s2: 3 },
                { t1: "Malinowski / Krawczyk", t2: "Szymański / Duda", s1: 7, s2: 5 },
                { t1: "Jankowski / Pawlak", t2: "Wójcik / Mazur", s1: 4, s2: 6 },
                { t1: "Kozłowski / Lis", t2: "Król / Zieliński", s1: 6, s2: 2 },
              ].map((match, i) => (
                <div key={i} className="w-56 rounded-lg border border-border bg-bg3">
                  <div className={cn("flex items-center justify-between border-b border-border px-3 py-2", match.s1 > match.s2 && "bg-lime/5")}>
                    <span className={cn("text-xs", match.s1 > match.s2 ? "text-lime font-semibold" : "text-text")}>{match.t1}</span>
                    <span className="font-mono text-xs text-lime">{match.s1}</span>
                  </div>
                  <div className={cn("flex items-center justify-between px-3 py-2", match.s2 > match.s1 && "bg-lime/5")}>
                    <span className={cn("text-xs", match.s2 > match.s1 ? "text-lime font-semibold" : "text-text")}>{match.t2}</span>
                    <span className="font-mono text-xs text-muted">{match.s2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Semifinals */}
            <div className="flex flex-col justify-around space-y-4">
              <p className="text-xs font-bold uppercase text-muted">Półfinał</p>
              {[
                { t1: "Kowalski / Nowak", t2: "Malinowski / Krawczyk", s1: 6, s2: 4 },
                { t1: "Wójcik / Mazur", t2: "Kozłowski / Lis", s1: 3, s2: 6 },
              ].map((match, i) => (
                <div key={i} className="w-56 rounded-lg border border-border bg-bg3">
                  <div className={cn("flex items-center justify-between border-b border-border px-3 py-2", match.s1 > match.s2 && "bg-lime/5")}>
                    <span className={cn("text-xs", match.s1 > match.s2 ? "text-lime font-semibold" : "text-text")}>{match.t1}</span>
                    <span className="font-mono text-xs text-lime">{match.s1}</span>
                  </div>
                  <div className={cn("flex items-center justify-between px-3 py-2", match.s2 > match.s1 && "bg-lime/5")}>
                    <span className={cn("text-xs", match.s2 > match.s1 ? "text-lime font-semibold" : "text-text")}>{match.t2}</span>
                    <span className="font-mono text-xs text-muted">{match.s2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Final */}
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-xs font-bold uppercase text-muted">Finał</p>
              <div className="w-56 rounded-lg border-2 border-lime/30 bg-bg3">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5 bg-lime/5">
                  <span className="text-xs font-semibold text-lime">Kowalski / Nowak</span>
                  <span className="font-mono text-sm font-bold text-lime">6</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-text">Kozłowski / Lis</span>
                  <span className="font-mono text-sm text-muted">4</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
                  Na żywo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
