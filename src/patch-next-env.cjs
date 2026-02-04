// Load .env.local before any ESM module evaluation
require('dotenv').config({ path: '.env.local' });

// Patch @next/env to add a default export for Payload CMS compatibility with Next.js 16
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === '@next/env') {
    const resolved = originalResolveFilename.call(this, request, parent, isMain, options);
    const mod = require(resolved);
    if (!mod.default) {
      mod.default = mod;
    }
    return resolved;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
