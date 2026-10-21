const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAuth0AndroidCallbacks(config) {
  // Manifest mods run in reverse plugin order. Register this before Auth0 so
  // Auth0 has added RedirectActivity before this mod adjusts MainActivity.
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    const redirectActivity = application.activity?.find(
      (activity) =>
        activity.$["android:name"] ===
        "com.auth0.android.provider.RedirectActivity",
    );

    if (!redirectActivity) {
      throw new Error(
        "List withAuth0AndroidCallbacks before react-native-auth0 in the Expo plugins.",
      );
    }

    const callbackSchemes = new Set(
      (redirectActivity["intent-filter"] ?? []).flatMap((filter) =>
        (filter.data ?? []).map((data) => data.$["android:scheme"]),
      ),
    );
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      config.modResults,
    );

    // The generic app scheme also matches Auth0 URLs. Lower only the broad
    // filter's priority so Android sends callbacks to Auth0's specific filter.
    // Regular app and development links still resolve to MainActivity.
    for (const filter of mainActivity["intent-filter"] ?? []) {
      if (
        (filter.data ?? []).some(
          (data) =>
            callbackSchemes.has(data.$["android:scheme"]) &&
            !data.$["android:host"],
        )
      ) {
        filter.$ = { ...filter.$, "android:priority": "-1" };
      }
    }

    return config;
  });
};
