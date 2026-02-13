import Papa from 'papaparse';

export interface ParsedUsageEntry {
  appName: string;
  date: string;
  usageMinutes: number;
}

export type CSVFormat = 'actiondash' | 'stayfree' | 'unknown';

/**
 * Detect CSV format (ActionDash or StayFree)
 */
function detectFormat(headers: string[]): CSVFormat {
  const normalized = headers.map((h) => h.toLowerCase().trim());

  // ActionDash format: typically has "App", "Date", "Duration" columns
  if (
    normalized.some((h) => h.includes('app')) &&
    normalized.some((h) => h.includes('duration'))
  ) {
    return 'actiondash';
  }

  // StayFree format: typically has "App Name", "Date", "Usage Time"
  if (
    normalized.some((h) => h.includes('app name') || h.includes('appname')) &&
    normalized.some((h) => h.includes('usage'))
  ) {
    return 'stayfree';
  }

  return 'unknown';
}

/**
 * Parse duration string to minutes
 * Supports: "1h 30m", "90m", "1:30:00", "5400" (seconds)
 */
function parseDuration(duration: string): number {
  if (!duration) return 0;

  const trimmed = duration.trim();

  // "1h 30m" format
  const hmMatch = trimmed.match(/(\d+)h\s*(\d+)?m?/i);
  if (hmMatch) {
    const hours = parseInt(hmMatch[1], 10);
    const mins = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    return hours * 60 + mins;
  }

  // "30m" format
  const mMatch = trimmed.match(/^(\d+)m$/i);
  if (mMatch) {
    return parseInt(mMatch[1], 10);
  }

  // "HH:MM:SS" format
  const timeMatch = trimmed.match(/(\d+):(\d+):(\d+)/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const s = parseInt(timeMatch[3], 10);
    return h * 60 + m + Math.round(s / 60);
  }

  // "HH:MM" format
  const shortTimeMatch = trimmed.match(/^(\d+):(\d+)$/);
  if (shortTimeMatch) {
    const h = parseInt(shortTimeMatch[1], 10);
    const m = parseInt(shortTimeMatch[2], 10);
    return h * 60 + m;
  }

  // Plain number (assume seconds if > 1000, else minutes)
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) {
    return num > 1000 ? Math.round(num / 60) : num;
  }

  return 0;
}

/**
 * Parse CSV string into usage entries
 */
export function parseCSV(csvString: string): {
  entries: ParsedUsageEntry[];
  format: CSVFormat;
  errors: string[];
} {
  const errors: string[] = [];

  // Strip BOM if present
  const cleanedCSV = csvString.replace(/^\uFEFF/, '');

  const result = Papa.parse<Record<string, string>>(cleanedCSV, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().replace(/^\uFEFF/, ''),
  });

  if (result.errors.length > 0) {
    errors.push(
      ...result.errors.map(
        (e) => `CSV 파싱 오류 (행 ${e.row}): ${e.message}`,
      ),
    );
  }

  if (!result.meta.fields || result.meta.fields.length === 0) {
    return { entries: [], format: 'unknown', errors: ['CSV 헤더를 찾을 수 없습니다.'] };
  }

  const format = detectFormat(result.meta.fields);
  const entries: ParsedUsageEntry[] = [];

  for (const row of result.data) {
    const fields = Object.keys(row);

    let appName = '';
    let date = '';
    let durationStr = '';

    if (format === 'actiondash') {
      appName =
        row['App'] || row['app'] || row['Application'] || '';
      date = row['Date'] || row['date'] || '';
      durationStr =
        row['Duration'] || row['duration'] || row['Time'] || '';
    } else if (format === 'stayfree') {
      appName =
        row['App Name'] || row['AppName'] || row['app name'] || '';
      date = row['Date'] || row['date'] || '';
      durationStr =
        row['Usage Time'] || row['Usage'] || row['usage time'] || '';
    } else {
      // Generic: try common column names
      appName = row[fields[0]] || '';
      date = row[fields[1]] || '';
      durationStr = row[fields[2]] || '';
    }

    if (appName) {
      entries.push({
        appName: appName.trim(),
        date: date.trim(),
        usageMinutes: parseDuration(durationStr),
      });
    }
  }

  return { entries, format, errors };
}
