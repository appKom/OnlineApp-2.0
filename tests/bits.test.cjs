const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const modules = new Map();
function loadTypeScript(relativePath) {
  const filename = resolve(__dirname, "..", relativePath);
  if (modules.has(filename)) return modules.get(filename);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    id => loadTypeScript(resolve(dirname(filename), `${id}.ts`)), module, module.exports,
  );
  modules.set(filename, module.exports);
  return module.exports;
}
const { BITS_ROUND_LENGTHS, createBitsSession, validateBitsPlayers, bitsReducer, getBitsScore, getBitsActiveRules } = loadTypeScript("utils/bits.ts");
function randomSeed(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function session(count = 4, length = 35, seed = 7) {
  return createBitsSession(Array.from({ length: count }, (_, i) => `P${String(i).padStart(2, "0")}`), length, randomSeed(seed));
}
function advance(state, outcome = "done") {
  return bitsReducer(state, { type: "advance", cardId: state.deck[state.index].id, outcome });
}

test("BITS validates trimmed, distinct names and the 2–11 player limit", () => {
  for (const names of [["Nora"], Array(12).fill("Nora"), ["Nora", "  "], [" Nora ", "nora"], ["a".repeat(25), "Emil"]]) {
    assert.equal(typeof validateBitsPlayers(names), "string");
    assert.throws(() => createBitsSession(names, 20));
  }
  assert.equal(validateBitsPlayers([" Nora ", "Emil"]), null);
  assert.deepEqual(createBitsSession([" Nora ", "Emil"], 20).players, ["Nora", "Emil"]);
  assert.throws(() => createBitsSession(["Nora", "Emil"], 21));
});

test("BITS deals every supported length without repeats, unresolved names or split mini-games", () => {
  for (const length of BITS_ROUND_LENGTHS) for (const count of [2, 4, 11]) for (let seed = 0; seed < 30; seed++) {
    const state = session(count, length, seed);
    assert.equal(state.deck.length, length);
    assert.equal(new Set(state.deck.map(c => c.id)).size, length);
    assert.ok(state.deck.every(c => !/\{player\}|\{other\}/.test(c.body)));
    const start = state.deck.findIndex(c => c.stage === "intro");
    const block = state.deck.slice(start, start + 6);
    assert.deepEqual(block.map(c => c.stage), ["intro", "question", "question", "question", "question", "result"]);
    assert.ok(block.every(c => c.pair[0] !== c.pair[1]));
    assert.ok(block.every(c => c.pair.join() === block[0].pair.join()));
    assert.equal(new Set(block.slice(1, 5).map(c => c.body)).size, 4);
    const counts = Object.fromEntries(state.players.map(name => [name, 0]));
    for (const card of state.deck) for (const name of card.body.match(/\bP\d{2}\b/g) || []) counts[name]++;
    assert.ok(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1, "names should be balanced");
  }
});

test("BITS ignores repeated card taps and reaches a stable, automatic finish", () => {
  let state = session();
  const action = { type: "advance", cardId: state.deck[0].id, outcome: "done" };
  state = bitsReducer(state, action);
  assert.equal(bitsReducer(state, action), state);
  while (state.index < state.deck.length) state = advance(state, state.deck[state.index].stage === "question" ? "pair" : "done");
  assert.equal(state.index, state.deck.length);
  assert.equal(Object.keys(state.outcomes).length, state.deck.length);
  assert.equal(bitsReducer(state, { type: "advance", cardId: "missing", outcome: "done" }), state);
});

test("BITS mini-game answers can be corrected without accumulating duplicate points", () => {
  let state = session();
  const firstQuestion = state.deck.findIndex(c => c.stage === "question");
  state = { ...state, index: firstQuestion };
  assert.equal(advance(state), state, "question needs an answer or skip");
  state = advance(state, "pair");
  assert.deepEqual(getBitsScore(state), { pair: 1, audience: 0 });
  state = bitsReducer(state, { type: "previous" });
  state = advance(state, "audience");
  assert.deepEqual(getBitsScore(state), { pair: 0, audience: 1 });
  state = bitsReducer(state, { type: "previous" });
  state = advance(state, "skipped");
  assert.deepEqual(getBitsScore(state), { pair: 0, audience: 0 });
});

test("BITS skips a whole mini-game from its intro and removes any earlier answers", () => {
  let state = session();
  const intro = state.deck.findIndex(c => c.stage === "intro");
  state = { ...state, index: intro + 1 };
  state = advance(state, "pair");
  state = { ...state, index: intro };
  state = advance(state, "skipped");
  assert.equal(state.index, intro + 6);
  assert.ok(state.deck.slice(intro, intro + 6).every(c => state.outcomes[c.id] === "skipped"));
  assert.deepEqual(getBitsScore(state), { pair: 0, audience: 0 });
});

test("BITS rules expire after exactly five following cards, including skipped cards", () => {
  const deck = [{ id: "rule", category: "rule", title: "Regel", body: "Regelen" },
    ...Array.from({ length: 7 }, (_, i) => ({ id: `card-${i}`, category: "online", title: "Kort", body: "Oppgave" }))];
  let state = { players: ["A", "B"], deck, index: 0, outcomes: {} };
  assert.equal(getBitsActiveRules(state).length, 0);
  state = advance(state);
  for (let remaining = 5; remaining > 0; remaining--) {
    assert.equal(getBitsActiveRules(state)[0].remaining, remaining);
    state = advance(state, "skipped");
  }
  assert.equal(getBitsActiveRules(state).length, 0);
  state = { ...state, index: 0, outcomes: {} };
  state = advance(state, "skipped");
  assert.equal(getBitsActiveRules(state).length, 0);
});

test("BITS keeps literal placeholder-like player names intact and uses no shared mutable deck", () => {
  const first = createBitsSession(["{other}", "$&"], 50, randomSeed(3));
  const snapshot = JSON.stringify(first);
  createBitsSession(["Nora", "Emil"], 50, randomSeed(20));
  assert.equal(JSON.stringify(first), snapshot);
  const unusualNameCards = first.deck.filter(c => c.body.includes("{other}"));
  assert.ok(unusualNameCards.length > 0);
});

test("BITS uses the game as opponent when there are only two players", () => {
  const two = session(2);
  assert.match(two.deck.find(c => c.stage === "intro").body, /gir spillet ett poeng/);
  assert.match(two.deck.find(c => c.stage === "result").body, /Vant dere over spillet/);
  const three = session(3);
  assert.match(three.deck.find(c => c.stage === "intro").body, /gir publikum ett poeng/);
});
