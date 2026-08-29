import path from "node:path";
import {
  BINARY_EXTENSIONS,
  EXCLUDED_DIRECTORY_NAMES,
  EXCLUDED_FILE_GLOBS,
} from "./constants.js";
import { toPosix } from "./hash.js";

export function shouldExcludeFromReview(relativePath: string): boolean {
  const posix = toPosix(relativePath);
  const parts = posix.split("/").filter(Boolean);

  if (parts.some((part) => EXCLUDED_DIRECTORY_NAMES.has(part))) {
    return true;
  }

  const base = parts[parts.length - 1] ?? "";
  if (EXCLUDED_FILE_GLOBS.some((pattern) => pattern.test(base))) {
    return true;
  }

  if (base.endsWith(".zip.sha256") || posix.includes("/reviews/")) {
    return true;
  }

  return false;
}

export function isLikelySecretPath(relativePath: string): boolean {
  return shouldExcludeFromReview(relativePath) && isSecretFileName(relativePath);
}

export function isSecretFileName(relativePath: string): boolean {
  const base = path.posix.basename(toPosix(relativePath));
  return (
    /^\.env(\..+)?$/i.test(base) ||
    /\.(pem|key|p12|pfx|jks|keystore)$/i.test(base) ||
    /secret|credential|token|passwd|password/i.test(base) ||
    /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)/i.test(base)
  );
}

export function isBinaryFileName(relativePath: string): boolean {
  const ext = path.posix.extname(toPosix(relativePath)).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}
