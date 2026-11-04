const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Android can fail reading large multipart bundle responses on Windows, leaving
// the dev loading overlay at 99.x%. Use React Native's plain JS download fallback.
// https://github.com/expo/expo/issues/49111
if (process.platform === "win32") {
  const enhanceMiddleware = config.server.enhanceMiddleware;
  config.server.enhanceMiddleware = (middleware, server) => {
    const enhancedMiddleware = enhanceMiddleware
      ? enhanceMiddleware(middleware, server)
      : middleware;
    return (req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.endsWith(".bundle") && url.searchParams.get("platform") === "android") {
        req.headers.accept = "application/javascript";
      }
      return enhancedMiddleware(req, res, next);
    };
  };
}

module.exports = config;
