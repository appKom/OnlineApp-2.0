const { withDangerousMod } = require("@expo/config-plugins");
const { applyPatch } = require("./scripts/patch-expo-widgets.cjs");

module.exports = (config) => withDangerousMod(config, ["ios", (mod) => {
  applyPatch(mod.modRequest.projectRoot);
  return mod;
}]);
