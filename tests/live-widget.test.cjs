const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { resolve, join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const babel = require("@babel/core");

test("every Live Activity region emits supported native nodes in Expo's isolated runtime", () => {
  const root = resolve(__dirname, "..");
  const directory = mkdtempSync(join(tmpdir(), "online-live-widget-"));
  try {
    const bundle = join(directory, "widget.bundle");
    execFileSync(process.execPath, [require.resolve("expo-widgets/scripts/build-bundle.mjs"), root, "ios", bundle], { cwd: root, stdio: "pipe" });
    const context = vm.createContext({ console, setTimeout, clearTimeout });
    vm.runInContext(readFileSync(bundle, "utf8"), context);
    let layout;
    const transformed = babel.transformFileSync(join(root, "widgets/EventLiveActivity.tsx"), {
      presets: ["babel-preset-expo"], configFile: false, babelrc: false,
    });
    new Function("require", "exports", transformed.code)((id) => id === "expo-widgets"
      ? { createLiveActivity: (_name, source) => { layout = source; } }
      : {}, {});
    context.__expoWidgetLayout = vm.runInContext(`(${layout})`, context);
    const nativeSource = readFileSync(join(root, "node_modules/expo-widgets/ios/Widgets/DynamicView.swift"), "utf8");
    const supported = new Set([...nativeSource.matchAll(/case "([^"]+)":/g)].map((match) => match[1]));
    const nodes = [];
    function inspect(node) {
      // Native flattenChildNodes omits null/false conditional children.
      if (node == null || node === false) return;
      assert.ok(supported.has(node.type), `Unsupported native node: ${String(node.type)}`);
      nodes.push(node);
      const children = node.props?.children;
      for (const child of Array.isArray(children) ? children.flat(Infinity) : children ? [children] : []) inspect(child);
    }
    for (const registrationStatus of [undefined, "REGISTERED", "QUEUED", "RESERVED"]) {
      for (const phase of ["starting-soon", "doors-open", "ongoing"]) {
        for (const isLuminanceReduced of [false, true]) {
          nodes.length = 0;
          const rendered = context.__expoWidgetRender({
            title: "Test event", location: "Kontoret", phase,
            intervalStart: Date.now(), intervalEnd: Date.now() + 900000,
            qrImageURI: "file:///shared/ticket.png", ticketURL: "ntnu.online.app://ticket",
            eventURL: "ntnu.online.app://event", registrationStatus,
            logoURI: "file:///shared/logo.png", markURI: "file:///shared/mark.png",
            backgroundColor: "#0F1417", textColor: "#DFE3E7", mutedColor: "#C1C7CE", accentColor: "#91CEF5", isDark: true,
          }, { isLuminanceReduced });
          assert.equal(Object.keys(rendered).length, 6);
          Object.values(rendered).forEach(inspect);
          assert.equal(nodes.filter((node) => node.type === "ImageView" && node.props.uiImage === "file:///shared/ticket.png").length, 2);
          assert.equal(rendered.banner.props.modifiers.find((modifier) => modifier.$type === "background").style.color, "#0F1417");
          assert.equal(rendered.compactLeading.props.uiImage, "file:///shared/mark.png");
          assert.ok(nodes.some((node) => node.props.uiImage === "file:///shared/logo.png"));
          assert.equal(rendered.compactLeading.type, "ImageView");
          assert.equal(rendered.minimal.type, "ImageView");
          const progress = nodes.filter((node) => node.type === "OnlineEventProgressView");
          assert.equal(progress.length, phase === "ongoing" ? 2 : 0);
          assert.ok(progress.every((node) => Number.isFinite(node.props.start) && node.props.end > node.props.start));
          assert.ok(nodes.filter((node) => node.props.timerInterval).every((node) => Number.isFinite(node.props.timerInterval.upper)));
        }
      }
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
