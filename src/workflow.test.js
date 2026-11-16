import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, monthDays, queueApplications, sampleOpportunities, tailorLetter, roleOf } from './workflow.js';

test('bulk queue deduplicates positions and never claims a submission', () => {
  const original = [{ id: 'existing', opportunityId: sampleOpportunities[0].id, status: 'Submitted — self-reported' }];
  const result = queueApplications(original, [...sampleOpportunities, sampleOpportunities[1]], 'auto', '2026-11-16T20:00:00Z');
  assert.equal(result.length, 4);
  assert.equal(result.at(-1).status, original[0].status);
  for (const item of result.slice(0, -1)) {
    assert.equal(item.status, 'Auto queued — demo, not submitted');
    assert.equal(item.createdAt, '2026-11-16T20:00:00Z');
    assert.match(item.history[0].text, /No application submitted/);
  }
});

test('Copilot adds a preparing record and preserves custom application URLs', () => {
  const result = queueApplications([], [{ id: 'custom', title: 'Legal intern', firm: 'Example', apply_url: 'https://example.com/jobs' }], 'copilot');
  assert.equal(result[0].status, 'Copilot — preparing');
  assert.equal(result[0].apply_url, 'https://example.com/jobs');
});

test('calendar includes leap day and consecutive local dates across month boundaries', () => {
  const days = monthDays(new Date(2028, 1, 1));
  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 0);
  assert.ok(days.some(day => dateKey(day) === '2028-02-29'));
  assert.equal(dateKey(days[0]), '2028-01-30');
  assert.equal(dateKey(days[41]), '2028-03-11');
});

test('tailored letter uses supplied networking context and saved master letter', () => {
  const letter = tailorLetter({ coverLetter: 'Dear Recruiting Committee,\n\nI am applying for [position] at [firm].\n\nThank you for your consideration.', resumeText: 'Unused resume text' }, { firm: 'Example LLP', position: 'Legal Intern', event: 'Law School Careers Night', contacts: 'Alex, an associate', notes: 'I enjoyed our discussion of the clinic.' });
  assert.match(letter, /Legal Intern at Example LLP/);
  assert.match(letter, /Law School Careers Night/);
  assert.match(letter, /Alex, an associate/);
  assert.match(letter, /discussion of the clinic/);
  assert.doesNotMatch(letter, /Unused resume text/);
});

test('both role types are available and legacy intern titles are recognized', () => {
  assert.equal(roleOf({ title: '2027 Legal Internship' }), 'Legal intern');
  assert.deepEqual(new Set(sampleOpportunities.map(roleOf)), new Set(['Legal intern', 'Summer associate']));
});
