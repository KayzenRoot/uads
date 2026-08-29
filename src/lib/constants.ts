export const UADS_DIR_NAME = ".uads";
export const DEFAULT_UADS_VERSION = "0.1.0";

export const EXCLUDED_DIRECTORY_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "build",
  ".next",
  ".turbo",
  ".cache",
  ".parcel-cache",
  ".nuxt",
  ".output",
  ".venv",
  "venv",
  "__pycache__",
  ".tox",
  ".pytest_cache",
  ".idea",
  ".vscode",
  ".uads",
  "reviews",
  "memory-bank",
  ".terraform",
  "target",
  "bin",
  "obj",
]);

export const EXCLUDED_FILE_GLOBS = [
  /^\.env(\..+)?$/i,
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/i,
  /(^|[-_.])(secret|secrets|credential|credentials|token|passwd|password)([-_.]|$)/i,
];

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp3",
  ".mp4",
  ".wav",
  ".zip",
  ".gz",
  ".tgz",
  ".7z",
  ".rar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".wasm",
  ".pdf",
  ".bin",
]);

export const MAX_REVIEW_FILE_BYTES = 1_000_000;
