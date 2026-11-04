import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { widgetsDirectory } from "expo-widgets";
import type { LiveEventBranding } from "./live-event-model";

let pending: Promise<LiveEventBranding> | undefined;

/** Keep small copies in the shared app group so ActivityKit can read them while suspended. */
export function prepareLiveEventBranding() {
  pending ??= (async () => {
    if (!widgetsDirectory) throw new Error("Live-banner mangler delt bildemappe.");
    const exportAsset = async (source: number, name: string, width: number) => {
      const target = new File(widgetsDirectory, name);
      if (target.exists) return target.uri;
      const asset = await Asset.fromModule(source).downloadAsync();
      if (!asset.localUri) throw new Error("Kunne ikke laste Online-logoen.");
      const context = ImageManipulator.manipulate(asset.localUri);
      let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
      let temporary: File | undefined;
      try {
        context.resize({ width });
        image = await context.renderAsync();
        const result = await image.saveAsync({ format: SaveFormat.PNG });
        temporary = new File(result.uri);
        await temporary.copy(target);
        return target.uri;
      } finally {
        image?.release(); context.release();
        if (temporary?.exists) temporary.delete();
      }
    };
    return {
      logoLightURI: await exportAsset(require("../assets/Online_Logokit/png/Online_bla.png"), "online-logo-blue-v1.png", 252),
      logoDarkURI: await exportAsset(require("../assets/Online_Logokit/png/Online_hvit.png"), "online-logo-white-v1.png", 252),
      markURI: await exportAsset(require("../assets/Online_Logokit/png/Online_hvit_o.png"), "online-mark-white-v1.png", 60),
    };
  })().catch((error) => { pending = undefined; throw error; });
  return pending;
}
