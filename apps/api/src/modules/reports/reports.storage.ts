import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ReportFormat } from './reports.schema';

/** `src/modules/reports` in dev, `dist/modules/reports` after a build — both three
 * levels from the workspace root, same resolution technique as `config/env.ts`. */
const STORAGE_DIR = path.resolve(__dirname, '../../../storage/reports');

const EXTENSIONS: Record<ReportFormat, string> = { pdf: 'pdf', excel: 'xlsx' };
const MIME_TYPES: Record<ReportFormat, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const reportsStorage = {
  mimeTypeFor(format: ReportFormat): string {
    return MIME_TYPES[format];
  },

  async save(format: ReportFormat, buffer: Buffer): Promise<string> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const filename = `${randomUUID()}.${EXTENSIONS[format]}`;
    await fs.writeFile(path.join(STORAGE_DIR, filename), buffer);
    return filename;
  },

  async read(filename: string): Promise<Buffer> {
    return fs.readFile(path.join(STORAGE_DIR, filename));
  },
};
