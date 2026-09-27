# Assets

## App icon

`icon.png` (1024×1024, opaque) is the source of the iOS app icon. `app.json` points to it with `expo.icon`.

Don't edit the icon inside `ios/`. `ios/` is generated and gitignored: `npx expo prebuild` (and `expo run:ios`
when native modules change) recreates it and regenerates
`ios/Online/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` from `icon.png`, overwriting any
change made there. To change the icon, replace `icon.png` and run `npx expo prebuild --platform ios`.

The App Store rejects icons with transparency. Prebuild flattens the alpha channel, so transparent pixels would
turn white; keep the icon fully opaque.

Android uses the adaptive icons (`adaptive-icon-*.png`), configured under `expo.android.adaptiveIcon`.
