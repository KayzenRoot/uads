import { stripCredentialUrls } from "./sanitize-url.js";

export type SecretKind =
  | "private-key"
  | "github-token"
  | "aws-access-key"
  | "stripe-live-key"
  | "jwt"
  | "slack-token"
  | "google-api-key";

export type RedactionResult = {
  text: string;
  redactionCount: number;
  omit: boolean;
  kinds: SecretKind[];
};

const PLACEHOLDER =
  /\b(example|changeme|placeholder|dummy|fake|sample|your[-_]?[a-z0-9]+|xxx+|insert[-_]?key|test[-_]?key)\b/i;

const PATTERNS: Array<{ kind: SecretKind; regex: RegExp }> = [
  {
    kind: "private-key",
    regex:
      /-----BEGIN [A-Z0-9 ]{0,40}PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]{0,40}PRIVATE KEY-----/g,
  },
  { kind: "github-token", regex: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g },
  { kind: "aws-access-key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: "stripe-live-key", regex: /\bsk_live_[A-Za-z0-9]{16,}\b/g },
  { kind: "jwt", regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  { kind: "slack-token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: "google-api-key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
];

export function isPlaceholderSecret(value: string): boolean {
  const trimmed = value.trim();
  if (/^\$\{?[A-Z0-9_]+\}?$/.test(trimmed)) {
    return true;
  }
  return PLACEHOLDER.test(trimmed);
}

export function redactSecrets(input: string): RedactionResult {
  let text = stripCredentialUrls(input);
  let redactionCount = 0;
  const kinds = new Set<SecretKind>();

  for (const pattern of PATTERNS) {
    text = text.replace(pattern.regex, (match) => {
      if (pattern.kind !== "private-key" && isPlaceholderSecret(match)) {
        return match;
      }
      redactionCount += 1;
      kinds.add(pattern.kind);
      return `[REDACTED:${pattern.kind}]`;
    });
  }

  const omit = shouldOmit(text, redactionCount, kinds);
  return { text, redactionCount, omit, kinds: [...kinds] };
}

function shouldOmit(text: string, redactionCount: number, kinds: Set<SecretKind>): boolean {
  if (redactionCount === 0) {
    return false;
  }
  if (redactionCount > 20) {
    return true;
  }
  if (kinds.has("private-key")) {
    const remaining = text.replace(/\[REDACTED:[a-z-]+\]/g, "").trim();
    if (remaining.length < 40) {
      return true;
    }
  }
  return false;
}

export function redactHostPaths(text: string): string {
  let out = text;
  out = out.replace(/[A-Za-z]:\\(?:Users|home)\\[^\s"'\\]+/gi, "[REDACTED-HOME]");
  out = out.replace(/\/(?:Users|home)\/[^\s"'/]+/g, "[REDACTED-HOME]");
  out = out.replace(/[A-Za-z]:\\[^\s"'<>|*?\n]+/g, "[REDACTED-PATH]");
  return out;
}

export function sanitizeReviewText(input: string): RedactionResult {
  const pathRedacted = redactHostPaths(input);
  return redactSecrets(pathRedacted);
}

export function containsForbiddenLeak(haystack: string, needle: string): boolean {
  if (!needle) {
    return false;
  }
  return haystack.includes(needle);
}
