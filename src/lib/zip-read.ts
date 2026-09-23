import fs from "node:fs";
import AdmZip from "adm-zip";

export type ZipEntry = {
  name: string;
  content: Buffer;
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const MAX_EOCD_SEARCH = 22 + 0xffff;

function findEocd(buffer: Buffer): number {
  const start = Math.max(0, buffer.length - MAX_EOCD_SEARCH);
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  throw new Error("ZIP end-of-central-directory record is missing");
}

/**
 * Reads raw central-directory entry names without relying on adm-zip's
 * in-memory entry normalization/deduplication. Final-byte inspection uses
 * this to preserve duplicate-name and unsafe-path detection across library
 * upgrades.
 *
 * UADS review bundles are intentionally bounded standard ZIP archives.
 * ZIP64 is rejected fail-closed here rather than guessed.
 */
export function readZipCentralDirectoryNames(zipPath: string): string[] {
  const buffer = fs.readFileSync(zipPath);
  if (buffer.length < 22) throw new Error("ZIP is truncated");

  const eocd = findEocd(buffer);
  const diskEntries = buffer.readUInt16LE(eocd + 8);
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);

  if (
    diskEntries === 0xffff ||
    totalEntries === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error("ZIP64 review bundles are not supported");
  }
  if (diskEntries !== totalEntries) throw new Error("multi-disk ZIP review bundles are not supported");
  if (centralOffset + centralSize > eocd || centralOffset > buffer.length) {
    throw new Error("ZIP central directory bounds are invalid");
  }

  const names: string[] = [];
  let offset = centralOffset;
  const centralEnd = centralOffset + centralSize;

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > centralEnd || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new Error("ZIP central directory entry is invalid");
    }
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const recordLength = 46 + nameLength + extraLength + commentLength;
    if (recordLength < 46 || offset + recordLength > centralEnd) {
      throw new Error("ZIP central directory entry exceeds declared bounds");
    }
    names.push(buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8"));
    offset += recordLength;
  }

  if (offset !== centralEnd) throw new Error("ZIP central directory size does not match parsed entries");
  return names;
}

export function readZip(zipPath: string): Promise<ZipEntry[]> {
  const zip = new AdmZip(zipPath);
  const entries = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map((entry) => ({
      name: entry.entryName.replace(/\\/g, "/"),
      content: entry.getData(),
    }));
  return Promise.resolve(entries);
}

export function zipExists(zipPath: string): boolean {
  return fs.existsSync(zipPath);
}
