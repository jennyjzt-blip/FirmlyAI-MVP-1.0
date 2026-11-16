import test from 'node:test';
import assert from 'node:assert/strict';
import { finishMaterials, initialMaterials } from './account.js';

test('signup requires resume text, including after whitespace-only input', () => {
  assert.throws(() => finishMaterials({}, { ...initialMaterials(), resumeText: '  ' }), /resume/);
});

test('cover letter is optional and existing profile fields survive onboarding', () => {
  const result = finishMaterials({ name: 'Demo Student', practice: 'Litigation' }, { ...initialMaterials(), resumeText: 'Law school experience' });
  assert.equal(result.coverLetter, '');
  assert.equal(result.practice, 'Litigation');
  assert.equal(result.resumeText, 'Law school experience');
});

test('upload choice requires a letter and preserves supplied text', () => {
  const materials = { ...initialMaterials(), resumeText: 'Resume', coverMode: 'upload' };
  assert.throws(() => finishMaterials({}, materials), /cover letter/);
  assert.equal(finishMaterials({}, { ...materials, coverLetter: 'My own letter' }).coverLetter, 'My own letter');
});

test('mock AI uses supplied resume facts without inventing a firm', () => {
  const result = finishMaterials({ name: 'Demo Student' }, { ...initialMaterials(), resumeText: 'Clinic volunteer', coverMode: 'ai' });
  assert.match(result.coverLetter, /Clinic volunteer/);
  assert.match(result.coverLetter, /\[firm\]/);
  assert.match(result.coverLetter, /Demo Student/);
});

test('saving unchanged materials preserves an edited demo letter', () => {
  const profile = { resumeText: 'Original experience', coverMode: 'ai', coverLetter: 'My edited letter' };
  assert.equal(finishMaterials(profile, initialMaterials(profile)).coverLetter, 'My edited letter');
});

test('replacing resume refreshes mock draft with new facts', () => {
  const profile = { resumeText: 'Old experience', coverMode: 'ai', coverLetter: 'Old letter' };
  const result = finishMaterials(profile, { ...initialMaterials(profile), resumeText: 'Updated clinic work' });
  assert.match(result.coverLetter, /Updated clinic work/);
  assert.doesNotMatch(result.coverLetter, /Old experience/);
});
