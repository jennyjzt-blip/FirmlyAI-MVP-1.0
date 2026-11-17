import { useRef, useState } from 'react';
import { extractDocument } from './documents.js';
import { storeFile } from './fileStore.js';
import { finishMaterials, initialMaterials } from './account.js';

export default function MaterialsEditor({ profile, onSave, onboarding = false, onBack }) {
  const [materials, setMaterials] = useState(() => initialMaterials(profile));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const update = patch => setMaterials(old => ({ ...old, ...patch }));
  async function read(event, kind) {
    const file = event.target.files[0];
    if (!file || pending.current) return;
    pending.current = true;
    setBusy(kind); setError('');
    try {
      const text = await extractDocument(file);
      const fileId = await storeFile(file);
      update(kind === 'resume' ? { resumeText: text, resumeName: file.name, resumeFileId: fileId } : { coverLetter: text, coverLetterName: file.name, coverLetterFileId: fileId });
    } catch (err) { setError(err.message); }
    finally { pending.current = false; setBusy(''); event.target.value = ''; }
  }
  function save(event) {
    event.preventDefault(); setError('');
    if (pending.current) return;
    try { onSave(finishMaterials(profile, materials)); }
    catch (err) { setError(err.message); }
  }
  return <form className="space-y-6" onSubmit={save}>
    <section className="card space-y-4">
      <div><span className="badge mb-3">YOUR RESUME</span><h2>Start with your experience</h2><p className="muted">Upload once to build your application materials. You can replace it later in My Profile.</p></div>
      <label>{materials.resumeText ? 'Replace resume (PDF or DOCX)' : 'Upload resume (PDF or DOCX)'}<input name="resume" type="file" accept=".pdf,.docx" disabled={!!busy} onChange={event => read(event, 'resume')} /></label>
      <p className="muted">Maximum 5 MB. {materials.resumeName && `Current document: ${materials.resumeName}`}</p>
      {busy === 'resume' && <p role="status" className="muted">Reading your resume…</p>}
      <details open={!!materials.resumeText}><summary className="link cursor-pointer text-sm">{materials.resumeText ? 'Review or edit resume text' : 'Or paste your resume text'}</summary><label className="mt-4">Resume text<textarea name="resumeText" className="min-h-56" maxLength={16000} value={materials.resumeText} onChange={event => update({ resumeText: event.target.value })} placeholder="Paste your resume here if you prefer not to upload a file." /></label></details>
    </section>
    <section className="card space-y-4">
      <div><span className="badge mb-3">MASTER COVER LETTER · OPTIONAL</span><h2>A starting point for every application</h2><p className="muted">Bring your own letter, try a draft based on your resume, or add one later.</p></div>
      <fieldset className="space-y-3"><legend className="sr-only">Master cover letter preference</legend>{[
        ['skip', 'I’ll add one later', 'Continue with just my resume.'],
        ['upload', 'Upload my master cover letter', 'Upload a PDF or DOCX, or paste your existing letter.'],
        ['ai', 'Write one for me with AI (demo)', 'Preview a starter based on your resume.'],
      ].map(([mode, label, description]) => <label key={mode} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${materials.coverMode === mode ? 'border-orange-700 bg-orange-50' : 'border-stone-200'}`}><input className="mt-1 w-4 shrink-0" type="radio" name="coverMode" value={mode} checked={materials.coverMode === mode} disabled={!!busy} onChange={() => update({ coverMode: mode })} /><span>{label}<span className="mt-1 block text-xs font-normal text-stone-500">{description}</span></span></label>)}</fieldset>
      {materials.coverMode === 'upload' && <div className="space-y-4"><label>Upload master cover letter<input type="file" name="coverLetterFile" accept=".pdf,.docx" disabled={!!busy} onChange={event => read(event, 'letter')} /></label>{materials.coverLetterName && <p className="muted">Current document: {materials.coverLetterName}</p>}{busy === 'letter' && <p role="status" className="muted">Reading your cover letter…</p>}<label>Master cover letter text<textarea className="min-h-56" name="coverLetter" maxLength={16000} value={materials.coverLetter} onChange={event => update({ coverLetter: event.target.value })} /></label></div>}
      {materials.coverMode === 'ai' && <p className="rounded-lg bg-orange-50 p-4 text-sm text-orange-950">This mock creates an editable template using your resume text. Live AI writing isn’t connected yet. Review the draft in My Profile and personalize it for each firm.</p>}
    </section>
    <p className="muted">Document text is saved in this browser so you only need to do this once. Original files stay on your device. This demo does not provide a secure account or sync between devices.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    <div className="flex flex-wrap gap-3">{onBack && <button className="btn secondary" type="button" disabled={!!busy} onClick={onBack}>Back</button>}<button className="btn" disabled={!!busy}>{busy ? 'Reading document…' : onboarding ? 'Finish creating account →' : 'Save application materials'}</button></div>
  </form>;
}
