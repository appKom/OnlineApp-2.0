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
const { BITS_ROUND_LENGTHS, BITS_CATEGORY_LABELS, createBitsSession, validateBitsPlayers, bitsReducer, getBitsScore, getBitsActiveRules } = loadTypeScript("utils/bits.ts");
const { BITS_TEMPLATES, BITS_BACK_TO_BACK_QUESTIONS } = loadTypeScript("utils/bits-content.ts");
function randomSeed(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function session(count = 4, length = 35, seed = 7) {
  return createBitsSession(Array.from({ length: count }, (_, i) => `P${String(i).padStart(2, "0")}`), length, randomSeed(seed));
}
function advance(state, outcome = "done") {
  return bitsReducer(state, { type: "advance", cardId: state.deck[state.index].id, outcome });
}
function replace(state) {
  return bitsReducer(state, { type: "replace", cardId: state.deck[state.index].id });
}

test("BITS requires two distinct non-empty names and accepts groups larger than eleven", () => {
  for (const names of [[], ["Nora"], ["Nora", "  "], [" Nora ", "nora"], ["a".repeat(25), "Emil"]]) {
    assert.equal(typeof validateBitsPlayers(names), "string");
    assert.throws(() => createBitsSession(names, 20));
  }
  assert.equal(validateBitsPlayers([" Nora ", "Emil"]), null);
  assert.deepEqual(createBitsSession([" Nora ", "Emil"], 20).players, ["Nora", "Emil"]);
  assert.equal(session(24).players.length, 24);
  assert.equal(session(100).players.length, 100);
  assert.throws(() => createBitsSession(["Nora", "Emil"], 21));
});

test("BITS separates game type from thematic titles", () => {
  const fadderuke = BITS_TEMPLATES.find(task => task.id === "fadderuke");
  assert.equal(fadderuke.title, "Fadderuke");
  assert.equal(BITS_CATEGORY_LABELS[fadderuke.category], "Utfordring");
  assert.equal(BITS_CATEGORY_LABELS.point, "Pekelek");
  assert.ok(BITS_TEMPLATES.every(task => BITS_CATEGORY_LABELS[task.category]));
});

test("BITS expands the deck with playable party-game formats and unique content", () => {
  assert.equal(new Set(BITS_TEMPLATES.map(task => task.id)).size, BITS_TEMPLATES.length);
  assert.equal(new Set(BITS_TEMPLATES.map(task => task.body)).size, BITS_TEMPLATES.length);
  assert.equal(new Set(BITS_BACK_TO_BACK_QUESTIONS).size, BITS_BACK_TO_BACK_QUESTIONS.length);
  for (const task of BITS_TEMPLATES) {
    assert.ok(task.title && task.body && BITS_CATEGORY_LABELS[task.category]);
    assert.ok(!task.body.includes("{other}") || task.body.includes("{player}"), task.id);
    assert.ok(!/\{(?!player\}|other\})/.test(task.body), task.id);
  }
  for (const category of ["quickfire", "wordplay", "memory", "duel", "truth"]) {
    assert.ok(BITS_TEMPLATES.filter(task => task.category === category).length >= 6);
    for (const players of [2, 4]) {
      const seen = new Set();
      for (let seed = 0; seed < 30; seed++) {
        for (const task of session(players, 50, seed).deck) {
          if (task.category === category) seen.add(task.templateId);
        }
      }
      assert.ok(seen.size >= 6, `${category} should be dealt to groups of ${players}`);
    }
  }
});

function navigationHarness(initialSession) {
  const hooks = [];
  const dialogs = [];
  let cursor = 0, blocked = false, onBlocked, removals = 0;
  const action = { type: "GO_BACK", source: "bits-route" };
  function cell(initial) {
    const index = cursor++;
    return hooks[index] ?? (hooks[index] = { value: initial });
  }
  const navigation = { dispatch: received => {
    assert.equal(received, action, "retry the original navigation action");
    if (blocked) onBlocked({ data: { action } });
    else removals++;
  } };
  const mocks = {
    react: {
      useState: initial => { const state = cell(initial); return [state.value, value => { state.value = value; }]; },
      useRef: initial => cell({ current: initial }).value,
      useReducer: reducer => { const state = cell(initialSession); return [state.value, next => { state.value = reducer(state.value, next); }]; },
    },
    "react/jsx-runtime": { jsx: (type, props) => ({type, props}), jsxs: (type, props) => ({type, props}) },
    "react-native": { StyleSheet: { create: styles => styles }, Platform: { OS: "android" }, Keyboard: {dismiss() {}}, Alert: { alert: (title, body, buttons, options) => dialogs.push({title, buttons, options}) } },
    "expo-router/react-navigation": {
      useNavigation: () => navigation,
      usePreventRemove: (prevent, callback) => { blocked = prevent; onBlocked = callback; return () => { blocked = false; }; },
    },
    "expo-router": { useRouter: () => ({}) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 24, bottom: 24 }) },
    "../../../utils/theme": { useThemeMode: () => ({ mode: "dark" }) },
    "../../../utils/bits": loadTypeScript("utils/bits.ts"),
    "../../../components/GamesHub/SongPlayingCard": { CASINO_COLORS: {} },
  };
  const { outputText } = ts.transpileModule(readFileSync(resolve(__dirname, "../app/(tabs)/(games)/bits.tsx"), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = {exports:{}};
  new Function("require", "module", "exports", outputText)(id => mocks[id] ?? {}, module, module.exports);
  const render = () => { cursor = 0; module.exports.default(); };
  render();
  return { dialogs, render, attempt: () => { if (blocked) onBlocked({data:{action}}); else removals++; }, get removals() { return removals; } };
}

test("BITS cancels or confirms exit once, disabling removal prevention before navigation", () => {
  const screen = navigationHarness(session());
  screen.attempt();
  screen.attempt();
  assert.equal(screen.dialogs.length, 1, "repeated back presses cannot stack dialogs");
  screen.dialogs[0].buttons.find(button => button.style === "cancel").onPress();
  assert.equal(screen.removals, 0);
  screen.attempt();
  assert.equal(screen.dialogs.length, 2, "cancel keeps the game protected");
  screen.dialogs[1].buttons.find(button => button.style === "destructive").onPress();
  assert.equal(screen.removals, 1, "confirm removes the screen synchronously without another prompt");
  assert.equal(screen.dialogs.length, 2);
  screen.render();
  screen.attempt();
  assert.equal(screen.dialogs.length, 2, "rerender must not restore the exit guard");
});

test("BITS allows exit without a dialog before starting and after finishing", () => {
  for (const initial of [null, { ...session(), index: 35 }]) {
    const screen = navigationHarness(initial);
    screen.attempt();
    assert.equal(screen.removals, 1);
    assert.equal(screen.dialogs.length, 0);
  }
});

test("BITS deals supported lengths without repeats, unresolved names or split mini-games", () => {
  for (const length of BITS_ROUND_LENGTHS) for (const count of [2, 4, 11, 24]) for (let seed = 0; seed < 30; seed++) {
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

test("BITS ignores repeated actions and reaches a stable automatic finish", () => {
  let state = session();
  const action = { type: "advance", cardId: state.deck[0].id, outcome: "done" };
  state = bitsReducer(state, action);
  assert.equal(bitsReducer(state, action), state);
  while (state.index < state.deck.length) state = advance(state, state.deck[state.index].stage === "question" ? "pair" : "done");
  assert.equal(state.index, state.deck.length);
  assert.equal(Object.keys(state.outcomes).length, state.deck.length);
  assert.equal(bitsReducer(state, { type: "advance", cardId: "missing", outcome: "done" }), state);
  assert.equal(bitsReducer(state, { type: "replace", cardId: "missing" }), state);
});

test("BITS skip replaces a solo, pair or group task without progressing or changing participants", () => {
  for (const count of [0, 1, 2]) {
    let state = session(12, 50);
    const index = state.deck.findIndex(task => !task.stage && task.participants.length === count);
    assert.ok(index >= 0);
    state = { ...state, index };
    const initial = state;
    const original = state.deck[index];
    const snapshot = JSON.stringify(state);
    for (let attempt = 1; attempt <= 150; attempt++) {
      const oldTask = state.deck[index];
      const action = { type: "replace", cardId: oldTask.id };
      state = bitsReducer(state, action);
      assert.notEqual(state.deck[index].templateId, oldTask.templateId);
      assert.notEqual(state.deck[index].body, oldTask.body);
      assert.deepEqual(state.deck[index].participants, original.participants);
      assert.equal(state.index, index);
      assert.equal(state.deck.length, 50);
      assert.equal(Object.keys(state.outcomes).length, 0);
      assert.equal(state.replacements, attempt);
      assert.equal(bitsReducer(state, action), state, "repeated skip must not replace twice");
      assert.equal(new Set(state.deck.map(task => task.id)).size, 50);
    }
    assert.equal(JSON.stringify(initial), snapshot, "replacement must not mutate history");
    assert.deepEqual(state.deck.slice(index + 1), initial.deck.slice(index + 1));
  }
});

test("BITS replacements use unused content first and keep literal player names intact", () => {
  let state = createBitsSession(["{other}", "$&"], 20, randomSeed(3));
  const index = state.deck.findIndex(task => !task.stage && task.participants.length === 2);
  state = { ...state, index };
  const before = state.deck[index];
  const used = new Set(state.seenTemplates);
  state = replace(state);
  assert.ok(!used.has(state.deck[index].templateId));
  assert.deepEqual(state.deck[index].participants, before.participants);
  assert.ok(state.deck[index].body.includes("{other}"));
  assert.ok(state.deck[index].body.includes("$&"));
});

test("BITS skipping the last task cannot finish or shorten the round", () => {
  let state = session(4, 20);
  state = { ...state, index: state.deck.length - 1 };
  for (let i = 0; i < 20; i++) state = replace(state);
  assert.equal(state.index, 19);
  assert.equal(state.deck.length, 20);
  state = advance(state);
  assert.equal(state.index, 20);
});

test("BITS mini-game replacement keeps the pair, question slot, progress and existing score", () => {
  let state = session();
  const first = state.deck.findIndex(task => task.stage === "question");
  state = { ...state, index: first };
  state = advance(state, "pair");
  const score = getBitsScore(state);
  const original = state.deck[state.index];
  for (let attempt = 0; attempt < 30; attempt++) {
    const before = state.deck[state.index];
    state = replace(state);
    assert.equal(state.index, first + 1);
    assert.equal(state.deck[state.index].stage, "question");
    assert.notEqual(state.deck[state.index].body, before.body);
    assert.deepEqual(state.deck[state.index].pair, original.pair);
    assert.deepEqual(getBitsScore(state), score);
    assert.equal(new Set(state.deck.filter(task => task.stage === "question").map(task => task.body)).size, 4);
  }
});

test("BITS corrected or replaced mini-game answers do not accumulate duplicate points", () => {
  let state = session();
  state = { ...state, index: state.deck.findIndex(task => task.stage === "question") };
  assert.equal(advance(state), state, "question needs a scored answer");
  state = advance(state, "pair");
  assert.deepEqual(getBitsScore(state), { pair: 1, audience: 0 });
  state = bitsReducer(state, { type: "previous" });
  const oldId = state.deck[state.index].id;
  state = replace(state);
  assert.equal(state.outcomes[oldId], undefined);
  state = advance(state, "audience");
  assert.deepEqual(getBitsScore(state), { pair: 0, audience: 1 });
});

test("BITS cannot replace mini-game instructions or results with an unrelated task", () => {
  const state = session();
  for (const stage of ["intro", "result"]) {
    const current = { ...state, index: state.deck.findIndex(task => task.stage === stage) };
    assert.equal(replace(current), current);
  }
});

test("BITS active rules count completed tasks but stay unchanged when replacing one", () => {
  let state = session(4, 50);
  const rule = state.deck.findIndex(task => task.category === "rule");
  assert.ok(rule >= 0);
  state = { ...state, index: rule };
  assert.equal(getBitsActiveRules(state).length, 0);
  state = advance(state);
  for (let remaining = 5; remaining > 0; remaining--) {
    assert.equal(getBitsActiveRules(state)[0].remaining, remaining);
    const before = getBitsActiveRules(state);
    state = replace(state);
    assert.deepEqual(getBitsActiveRules(state), before);
    state = advance(state, state.deck[state.index].stage === "question" ? "pair" : "done");
  }
  assert.ok(!getBitsActiveRules(state).some(item => item.id === state.deck[rule].id));
});

test("BITS replacing an unaccepted rule does not activate it", () => {
  let state = session(4, 50);
  state = { ...state, index: state.deck.findIndex(task => task.category === "rule") };
  state = replace(state);
  assert.equal(getBitsActiveRules(state).length, 0);
  assert.equal(Object.keys(state.outcomes).length, 0);
});

test("BITS sessions do not share mutable decks", () => {
  const first = session();
  const snapshot = JSON.stringify(first);
  replace(first);
  session(20, 50);
  assert.equal(JSON.stringify(first), snapshot);
});

test("BITS uses the game as opponent when there are only two players", () => {
  const two = session(2);
  assert.match(two.deck.find(c => c.stage === "intro").body, /gir spillet ett poeng/);
  assert.match(two.deck.find(c => c.stage === "result").body, /Vant dere over spillet/);
  assert.match(session(3).deck.find(c => c.stage === "intro").body, /gir publikum ett poeng/);
});
