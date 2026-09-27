const { withAppDelegate } = require('@expo/config-plugins');

// react-native-auth0's plugin adds an `application(_:open:options:)` override to ReactNativeDelegate,
// which no longer exists under Expo's scene-based AppDelegate template and breaks the iOS build.
// ExpoAppSceneDelegate already forwards incoming URLs to RCTLinkingManager, so the override isn't needed.
// The auth0 plugin skips its injection when the file mentions RCTLinkingManager.application, so this
// removes the block if it's already there and otherwise leaves that mention behind.
const MARKER =
  '// Incoming URLs reach RCTLinkingManager.application through ExpoAppSceneDelegate (see withAuth0SceneLinking.js).';
const AUTH0_BLOCK =
  /\/\/ @generated begin react-native-auth0-linking-swift[\s\S]*?\/\/ @generated end react-native-auth0-linking-swift\n?/;

module.exports = function withAuth0SceneLinking(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') return config;

    let contents = config.modResults.contents.replace(AUTH0_BLOCK, '');
    if (!contents.includes(MARKER)) {
      contents = contents.replace(
        /class ReactNativeDelegate: ExpoReactNativeFactoryDelegate \{\n/,
        (match) => `${match}  ${MARKER}\n`
      );
    }
    config.modResults.contents = contents;
    return config;
  });
};
