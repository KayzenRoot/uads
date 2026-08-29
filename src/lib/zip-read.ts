import fs from "node:fs";
import yauzl from "yauzl";

export type ZipEntry = {
  name: string;
  content: Buffer;
};

export async function readZip(zipPath: string): Promise<ZipEntry[]> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new Error("unable to open zip"));
        return;
      }

      const entries: ZipEntry[] = [];
      zipfile.readEntry();
      zipfile.on("entry", (entry: yauzl.Entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) {
            reject(streamErr ?? new Error(`unable to read ${entry.fileName}`));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => {
            entries.push({ name: entry.fileName, content: Buffer.concat(chunks) });
            zipfile.readEntry();
          });
        });
      });
      zipfile.on("end", () => resolve(entries));
      zipfile.on("error", reject);
    });
  });
}

export function zipExists(zipPath: string): boolean {
  return fs.existsSync(zipPath);
}
