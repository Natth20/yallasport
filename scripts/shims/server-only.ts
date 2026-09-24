// Next supplies `server-only` through its own bundler alias, so the package does
// not exist in node_modules. Standalone scripts run outside the bundler and need
// something to resolve to; the guard it provides is meaningless there anyway.
export {};
