export const sampleOpportunities = [
  { id: 'sample-kirkland-sa', firm: 'Kirkland & Ellis', title: 'Summer Associate', role: 'Summer associate', office: 'New York', website: 'https://www.kirkland.com' },
  { id: 'sample-latham-intern', firm: 'Latham & Watkins', title: 'Legal Intern', role: 'Legal intern', office: 'Los Angeles', website: 'https://www.lw.com' },
  { id: 'sample-skadden-sa', firm: 'Skadden', title: 'Summer Associate', role: 'Summer associate', office: 'New York', website: 'https://www.skadden.com' },
  { id: 'sample-gibson-intern', firm: 'Gibson Dunn', title: 'Legal Intern', role: 'Legal intern', office: 'Washington, DC', website: 'https://www.gibsondunn.com' },
].map(item => ({ ...item, sample: true }));

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
  } else if (kind === 'transcript') suggestions.push('Check that every page is readable and includes your school, course names, grades, and grading scale.', 'Compare extracted text with the original transcript before using it.');
  else suggestions.push('Make the opening specific to the firm, role, and office.', 'Use the cover letter studio to include a genuine networking event or personal connection.', 'Support your interest with a concrete example from your resume.');
  return suggestions;
}
