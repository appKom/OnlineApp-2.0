import { showToast } from "./toast";

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = { getGlobalHandler(): ErrorHandler; setGlobalHandler(handler: ErrorHandler): void };

/**
 * Render errors are caught by the route error boundaries, but an error thrown from a press handler or
 * a timer goes to React Native's global handler, which kills a release build. Once the app is up,
 * show a toast instead so an unexpected API response doesn't crash the whole app.
 * Development builds keep the default handler and its red screen.
 *
 * Returns a function that restores the previous handler.
 */
export function installCrashGuard(): () => void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (__DEV__ || !errorUtils) return () => {};

  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error) => {
    console.error("Uncaught error:", error);
    showToast({ message: "Noe gikk galt. Prøv igjen, eller oppdater appen.", icon: "alert-circle-outline" });
  });
  return () => errorUtils.setGlobalHandler(previous);
}
