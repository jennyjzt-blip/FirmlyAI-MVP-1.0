export function initialMaterials(profile = {}) {
  return {
    resumeText: profile.resumeText || '',
    resumeName: profile.resumeName || '',
    resumeFileId: profile.resumeFileId || '',
    coverLetter: profile.coverLetter || '',
    coverLetterName: profile.coverLetterName || '',
    coverLetterFileId: profile.coverLetterFileId || '',
    coverMode: profile.coverMode || (profile.coverLetter ? 'upload' : 'skip'),
  };
}

export function demoMasterLetter(profile, resumeText) {
  const excerpt = resumeText.trim().slice(0, 1600);
  return `Dear Recruiting Committee,\n\nI am writing to express my interest in [position] at [firm]${profile.location ? ` in ${profile.location}` : ''}.${profile.school ? ` I am a student at ${profile.school}${profile.grad ? `, graduating in ${profile.grad}` : ''}.` : ''}\n\n[Explain how the following experience from your resume prepares you for this role.]\n\n${excerpt}\n\n[Add your specific reasons for applying to this firm and office.]\n\nThank you for your consideration. I would welcome the opportunity to discuss my application.\n\nSincerely,\n${profile.name || '[Your name]'}`;
}

export function finishMaterials(profile, materials) {
  if (!materials.resumeText.trim()) throw new Error('Upload your resume or paste its text to continue.');
  if (materials.coverMode === 'upload' && !materials.coverLetter.trim()) throw new Error('Upload your master cover letter, paste its text, or choose another option.');
  return { ...profile, ...materials,
    coverLetter: materials.coverMode === 'skip' ? '' : materials.coverMode === 'ai'
      ? profile.coverMode === 'ai' && profile.resumeText === materials.resumeText && materials.coverLetter.trim()
        ? materials.coverLetter : demoMasterLetter(profile, materials.resumeText)
      : materials.coverLetter,
    coverLetterName: materials.coverMode === 'ai' ? 'Cover letter — demo draft' : materials.coverMode === 'skip' ? '' : materials.coverLetterName,
    coverLetterFileId: materials.coverMode === 'upload' ? materials.coverLetterFileId || '' : '',
    materialsUpdatedAt: new Date().toISOString(),
  };
}
