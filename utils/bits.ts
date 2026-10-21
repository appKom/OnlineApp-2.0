import { BITS_BACK_TO_BACK_QUESTIONS, BITS_TEMPLATES, type BitsCategory, type BitsTemplate } from "./bits-content";

export { BITS_CATEGORY_LABELS } from "./bits-content";
export const BITS_ROUND_LENGTHS = [20, 35, 50] as const;
export type BitsRoundLength = (typeof BITS_ROUND_LENGTHS)[number];
export type BitsCard = {
  id: string;
  category: BitsCategory;
  title: string;
  body: string;
  stage?: "intro" | "question" | "result";
  pair?: [string, string];
};
export type BitsOutcome = "done" | "skipped" | "pair" | "audience";
export type BitsSession = {
  players: string[];
  deck: BitsCard[];
  index: number;
  outcomes: Record<string, BitsOutcome>;
};
export type BitsAction =
  | { type: "start"; session: BitsSession }
  | { type: "advance"; cardId: string; outcome: BitsOutcome }
  | { type: "previous" }
  | { type: "setup" };

export function validateBitsPlayers(names: readonly string[]): string | null {
  if (names.length < 2 || names.length > 11) return "Legg til mellom 2 og 11 spillere.";
  const trimmed = names.map(name => name.trim());
  if (trimmed.some(name => !name)) return "Fyll inn navn på alle spillerne.";
  if (trimmed.some(name => name.length > 24)) return "Bruk navn på maks 24 tegn.";
  if (new Set(trimmed.map(name => name.toLocaleLowerCase("nb-NO"))).size !== names.length) return "Bruk ulike navn, så dere vet hvem kortet gjelder.";
  return null;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createBitsSession(names: readonly string[], length: BitsRoundLength, random = Math.random): BitsSession {
  const error = validateBitsPlayers(names);
  if (error) throw new Error(error);
  if (!BITS_ROUND_LENGTHS.includes(length)) throw new Error("Ugyldig rundelengde.");
  const players = names.map(name => name.trim());
  const appearances = players.map(() => 0);
  let lastPlayer = -1;
  function pickPlayer(exclude = -1) {
    const candidates = players.map((_, i) => i).filter(i => i !== exclude);
    const minimum = Math.min(...candidates.map(i => appearances[i]));
    let eligible = candidates.filter(i => appearances[i] === minimum);
    if (eligible.length > 1) eligible = eligible.filter(i => i !== lastPlayer);
    const selected = eligible[Math.floor(random() * eligible.length)];
    appearances[selected]++;
    lastPlayer = selected;
    return selected;
  }
  function deal(template: BitsTemplate): BitsCard {
    const primary = template.body.includes("{player}") ? pickPlayer() : -1;
    const secondary = template.body.includes("{other}") ? pickPlayer(primary) : -1;
    return { ...template, body: template.body.replace(/\{player\}|\{other\}/g, token => players[token === "{player}" ? primary : secondary]) };
  }

  // Shuffle normal cards independently; the mini-game is inserted as one ordered block.
  const pool = shuffle(BITS_TEMPLATES, random);
  const normal: BitsTemplate[] = [];
  let lastRule = -6;
  while (normal.length < length - 6) {
    const allowed = (card: BitsTemplate) => card.category !== "rule" || normal.length - lastRule >= 6;
    let next = pool.findIndex(card => allowed(card) && card.category !== normal.at(-1)?.category);
    if (next < 0) next = pool.findIndex(allowed);
    if (next < 0) throw new Error("Ikke nok kort til denne runden.");
    const [template] = pool.splice(next, 1);
    if (template.category === "rule") lastRule = normal.length;
    normal.push(template);
  }
  const insertAt = Math.floor(normal.length * (0.35 + random() * 0.3));
  const deck = normal.slice(0, insertAt).map(deal);
  const first = pickPlayer();
  const second = pickPlayer(first);
  const pair: [string, string] = [players[first], players[second]];
  const opponent = players.length === 2 ? "spillet" : "publikum";
  const miniBase = { category: "back-to-back" as const, pair };
  deck.push({ ...miniBase, id: "back-intro", stage: "intro", title: "Rygg til rygg", body: `${pair[0]} og ${pair[1]}, still dere rygg mot rygg. På hver påstand rekker dere opp hånda hvis den passer best på dere selv. Kun én hånd oppe gir dere ett poeng. Begge eller ingen gir ${opponent} ett poeng. Spill fire spørsmål!` });
  shuffle(BITS_BACK_TO_BACK_QUESTIONS, random).slice(0, 4).forEach((body, i) => {
    deck.push({ ...miniBase, id: `back-question-${i}`, stage: "question", title: "Hvem av dere?", body });
  });
  deck.push({ ...miniBase, id: "back-result", stage: "result", title: "Hvordan gikk det?", body: players.length === 2
    ? "Vant dere over spillet? Ta en seiersskål! Vant spillet, tar dere én slurk hver. Ved uavgjort blir det felles skål. Så fortsetter vi."
    : "Vinnerlaget deler ut to slurker til det andre laget. Ved uavgjort blir det felles skål. Så fortsetter vi rundt bordet." });
  deck.push(...normal.slice(insertAt).map(deal));
  return { players, deck, index: 0, outcomes: {} };
}

export function bitsReducer(state: BitsSession | null, action: BitsAction): BitsSession | null {
  if (action.type === "start") return action.session;
  if (action.type === "setup") return null;
  if (!state) return state;
  if (action.type === "previous") return { ...state, index: Math.max(0, state.index - 1) };
  const current = state.deck[state.index];
  // Ignore a second tap queued for an already advanced card.
  if (!current || action.cardId !== current.id) return state;
  if (current.stage === "question" && action.outcome === "done") return state;
  if (current.stage !== "question" && (action.outcome === "pair" || action.outcome === "audience")) return state;
  const outcomes = { ...state.outcomes, [current.id]: action.outcome };
  let next = state.index + 1;
  if (current.stage === "intro" && action.outcome === "skipped") {
    while (next < state.deck.length && state.deck[next].category === "back-to-back") {
      outcomes[state.deck[next].id] = "skipped";
      next++;
    }
  }
  return { ...state, index: next, outcomes };
}

export function getBitsScore(session: BitsSession) {
  const played = session.deck.slice(0, session.index);
  return {
    pair: played.filter(card => session.outcomes[card.id] === "pair").length,
    audience: played.filter(card => session.outcomes[card.id] === "audience").length,
  };
}

export function getBitsActiveRules(session: BitsSession) {
  return session.deck.slice(0, session.index).flatMap((card, index) => {
    const remaining = 5 - (session.index - index - 1);
    return card.category === "rule" && session.outcomes[card.id] === "done" && remaining > 0
      ? [{ ...card, remaining }] : [];
  });
}
