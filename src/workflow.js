export const sampleOpportunities = [
  { id: 'sample-kirkland-sa', firm: 'Kirkland & Ellis', title: 'Summer Associate', role: 'Summer associate', office: 'New York', website: 'https://www.kirkland.com' },
  { id: 'sample-latham-intern', firm: 'Latham & Watkins', title: 'Legal Intern', role: 'Legal intern', office: 'Los Angeles', website: 'https://www.lw.com' },
  { id: 'sample-skadden-sa', firm: 'Skadden', title: 'Summer Associate', role: 'Summer associate', office: 'New York', website: 'https://www.skadden.com' },
  { id: 'sample-gibson-intern', firm: 'Gibson Dunn', title: 'Legal Intern', role: 'Legal intern', office: 'Washington, DC', website: 'https://www.gibsondunn.com' },
].map(item => ({ ...item, sample: true }));

// Official careers pages reviewed November 16, 2026. Confirm intake with each firm.
export const localOpportunities = [
  { id: 'local-anum-intern', firm: 'Anum Law', title: 'Legal Internship / Externship', role: 'Legal intern', office: 'Los Angeles · Remote / hybrid', practice: 'Contracts, intellectual property, entertainment', source_url: 'https://www.anumlaw.com/get-involved', apply_url: 'https://www.anumlaw.com/get-involved', notes: 'Firm lists rolling internship and externship applications; 2L/3L students preferred. Confirm format and availability with the firm.' },
  { id: 'local-lovell-sa', firm: 'Lovell Law Group', title: 'Summer Associate', role: 'Summer associate', office: 'Los Angeles · Remote', practice: 'Corporate, contracts, transactional', source_url: 'https://lovelllawgroup.com/careers/', apply_url: 'https://lovelllawgroup.com/careers/', notes: 'Firm describes an 8–10 week summer program for 2L students. Program year and deadline are not specified; confirm availability.' },
  { id: 'local-kingsiegel-sa', firm: 'King & Siegel LLP', title: 'Summer Associate', role: 'Summer associate', office: 'Los Angeles', practice: 'Employment, litigation, civil rights', source_url: 'https://www.kingsiegel.com/careers/', apply_url: 'https://www.kingsiegel.com/careers/', notes: 'Careers page welcomes law student applications and describes summer associate work. Confirm current intake and eligibility directly.' },
].map(item => ({ ...item, local: true, reviewedAt: '2026-11-16' }));

export function greatMatches(profile, opportunities, applications = []) {
  const tracked = new Set(applications.map(item => item.opportunityId));
  const areas = ['contracts', 'corporate', 'litigation', 'employment', 'entertainment', 'intellectual property', 'finance', 'private equity', 'regulatory', 'civil rights', 'transactional'];
  const preference = (profile.practice || '').toLowerCase().replace(/\bip\b/g, 'intellectual property');
  const resume = (profile.resumeText || '').toLowerCase();
  const normalize = text => text.toLowerCase().replace(/\bnyc\b/g, 'new york').replace(/\bla\b/g, 'los angeles');
  const locations = normalize(profile.location || '').split(/[,;\/]+/).map(value => value.trim()).filter(Boolean);
  const unique = [...new Map(opportunities.map(item => [item.id, item])).values()];
  return unique.filter(item => !tracked.has(item.id)).map(item => {
    let score = 0;
    const reasons = [];
    const office = normalize(item.office || '');
    if (locations.some(location => office.includes(location))) { score += 5; reasons.push('Matches your preferred office'); }
    const keywords = `${item.practice || ''} ${item.notes || ''}`.toLowerCase();
    const practices = areas.filter(area => keywords.includes(area) && preference.includes(area));
    if (practices.length) { score += practices.length * 4; reasons.push(`Practice fit: ${practices.join(', ')}`); }
    if (!practices.length && areas.some(area => keywords.includes(area) && resume.includes(area))) { score += 2; reasons.push('Relevant to experience in your resume'); }
    return { ...item, score, reasons: reasons.length ? reasons : ['Add office and practice preferences in My Profile to personalize suggestions'] };
  }).sort((a, b) => b.score - a.score || Number(!!a.sample) - Number(!!b.sample)).slice(0, 3);
}

export function roleOf(item) {
  return item.role || (/intern/i.test(item.title) ? 'Legal intern' : 'Summer associate');
}

export function queueApplications(existing, opportunities, mode, now = new Date().toISOString()) {
  const seen = new Set(existing.map(item => item.opportunityId).filter(Boolean));
  const additions = [];
  for (const item of opportunities) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const status = mode === 'auto' ? 'Auto queued — demo, not submitted' : 'Copilot — preparing';
    additions.push({ id: crypto.randomUUID(), opportunityId: item.id, firm: item.firm, position: item.title,
      office: item.office, apply_url: item.apply_url || '', sample: !!item.sample, mode, status, createdAt: now,
      history: [{ at: now, text: mode === 'auto' ? 'Added to demo auto queue. No application submitted.' : 'Started Copilot preparation.' }],
    });
  }
  return [...additions, ...existing];
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthDays(month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index); return date;
  });
}

export function previewInterview(month, events, now = new Date()) {
  const prefix = dateKey(month).slice(0, 7);
  if (prefix !== dateKey(now).slice(0, 7) || events.some(item => item.type === 'Interview' && item.date.startsWith(prefix))) return null;
  return { id: 'preview-interview', type: 'Interview', date: dateKey(new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 3, 28))), time: '10:30', firm: 'Example boutique firm', sample: true };
}

export function trackExamples(now = new Date()) {
  return [
    ['anum', 'Anum Law', 'Legal Intern', 'Los Angeles', 'Submitted — demo'],
    ['king-siegel', 'King & Siegel LLP', 'Summer Associate', 'Los Angeles', 'Interview — demo'],
    ['lovell', 'Lovell Law Group', 'Summer Associate', 'Remote · Los Angeles', 'Submitted — demo'],
    ['latham', 'Latham & Watkins', 'Legal Intern', 'Los Angeles', 'Preparing — demo'],
  ].map(([key, firm, position, office, status], index) => {
    const date = new Date(now); date.setDate(date.getDate() - index - 1);
    return { id: `track-example-${key}`, firm, position, office, status, sample: true, demoExample: true, createdAt: date.toISOString(), history: [{ at: date.toISOString(), text: 'Sample application for trying the calendar. No external application was submitted.' }] };
  });
}

export function includeExample(existing, id, examples) {
  if (existing.some(item => item.id === id)) return existing;
  const example = examples.find(item => item.id === id);
  return example ? [example, ...existing] : existing;
}

export function tailorLetter(profile, context) {
  const base = profile.coverLetter || `Dear Recruiting Committee,\n\nI am applying for [position] at [firm]${context.office ? ' in [office]' : ''}.${profile.school ? ` I am a student at ${profile.school}.` : ''}\n\n[Connect the following resume experience to the role.]\n${(profile.resumeText || '[Add your resume in Workshop.]').slice(0, 1600)}\n\nThank you for considering my application.\n\nSincerely,\n${profile.name || '[Your name]'}`;
  let letter = base.replaceAll('[firm]', context.firm || '[firm]').replaceAll('[position]', context.position || '[position]').replaceAll('[office]', context.office || '[office]');
  const connection = [context.event ? `Attending ${context.event} strengthened my interest in ${context.firm || 'your firm'}.` : '', context.contacts ? `I appreciated the opportunity to connect with ${context.contacts}.` : '', context.notes || ''].filter(Boolean).join(' ');
  if (connection) {
    const closing = letter.search(/\n\n(?:Thank you|Sincerely|Best regards)/i);
    letter = closing >= 0 ? `${letter.slice(0, closing)}\n\n${connection}${letter.slice(closing)}` : `${letter}\n\n${connection}`;
  }
  return letter;
}

export function reviewDocument(text, kind) {
  if (!text.trim()) return ['Upload a document or paste text before requesting a review.'];
  const suggestions = [];
  if (kind === 'resume') {
    if (!/education|university|school/i.test(text)) suggestions.push('Check that your education, law school, and expected graduation date are included.');
    if (!/\b(19|20)\d{2}\b/.test(text)) suggestions.push('Add or verify the dates for your education and experience.');
    if (!/@/.test(text)) suggestions.push('Check that your contact email is included.');
    suggestions.push('For each experience, explain your contribution and a verified result.');
  } else suggestions.push('Make the opening specific to the firm, role, and office.', 'Use the cover letter studio to include a genuine networking event or personal connection.', 'Support your interest with a concrete example from your resume.');
  return suggestions;
}
