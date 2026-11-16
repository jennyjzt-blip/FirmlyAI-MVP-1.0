export const firms = [
  ['Kirkland & Ellis', 'https://www.kirkland.com', 'Private equity, litigation'],
  ['Latham & Watkins', 'https://www.lw.com', 'Corporate, finance, litigation'],
  ['Skadden', 'https://www.skadden.com', 'M&A, litigation'],
  ['Gibson Dunn', 'https://www.gibsondunn.com', 'Litigation, corporate'],
  ['Sidley Austin', 'https://www.sidley.com', 'Corporate, regulatory'],
  ['Davis Polk', 'https://www.davispolk.com', 'Capital markets, M&A'],
  ['Sullivan & Cromwell', 'https://www.sullcrom.com', 'Finance, corporate'],
  ['Paul Weiss', 'https://www.paulweiss.com', 'Litigation, private equity'],
  ['Simpson Thacher', 'https://www.stblaw.com', 'Private equity, M&A'],
  ['Cravath', 'https://www.cravath.com', 'Corporate, litigation'],
].map(([name, website, practice]) => ({ name, website, practice }));

export const statuses = ['Draft — not submitted', 'Preparing', 'Submitted — self-reported', 'Interview', 'Closed'];
export const emptyData = { account: null, profile: {}, opportunities: [], applications: [], letters: [], sources: [], calendarEvents: [] };

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
